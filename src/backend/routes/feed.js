// ============================================================
// 피드(Feed) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /feed          : 피드 생성 (이미지 업로드 포함, 세션 인증)
//   GET    /feed          : 전체 피드 목록 조회 (이미지 + 현재 유저 좋아요 상태 포함)
//   DELETE /feed/:feed_id : 피드 삭제 (세션 인증 + 본인 소유 검증)
//
// 파일 업로드:
//   multer로 multipart/form-data 처리
//   이미지/영상 파일은 src/backend/uploads/ 에 저장
//   저장된 파일 URL은 FastAPI /feed/image로 DB에 기록
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
// [추가 2026-04-29] 고아 파일 정리용 — fs/promises 의 unlink 로 비동기 삭제
const fs = require("fs/promises");
const {
    createFeed,
    addFeedImage,
    getFeeds,
    getFeedDetail,
    deleteFeed,
    checkLike,
} = require("../database");
// [리팩터링 #12] 세션 인증 4줄 복붙을 미들웨어 한 줄로 대체
const requireAuth = require("../middleware/requireAuth");

// ── [추가 2026-04-29] 업로드 디렉터리 절대경로 상수화 ──────────────────────────
// 피드 삭제 시 file_url("/uploads/xxx.jpg") 의 파일명만 떼어
// 이 디렉터리에 join 하여 디스크에서 unlink 할 때 사용한다.
// path.basename() 으로 파일명만 추출하므로 디렉터리 트래버설 공격(../../etc/passwd)
// 같은 비정상 경로는 자동으로 차단된다.
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// ── multer 설정 (파일 업로드) ────────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        // 파일명 충돌 방지: timestamp + 랜덤 숫자 + 원본 확장자
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 파일당 최대 50MB
    fileFilter: (req, file, cb) => {
        // 이미지와 영상만 허용
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("이미지 또는 영상 파일만 업로드 가능합니다."), false);
        }
    },
});

// ── 피드 생성 (POST /feed) ───────────────────────────────────────────────────

/**
 * POST /feed
 *
 * multipart/form-data로 텍스트 필드 + 파일을 함께 전송
 * 텍스트 필드: routine_id, completion_id, content
 * 파일 필드: files (최대 10개)
 *
 * 처리 흐름:
 *   1. 세션 인증 → user_id 추출
 *   2. FastAPI POST /feed/ → feed_id 생성
 *   3. 업로드된 파일마다 FastAPI POST /feed/image → DB에 이미지 URL 저장
 */
// [리팩터링 #1+#3] 기존 catch는 무조건 500으로 뭉갰지만, next(err)로 넘기면
// 글로벌 핸들러가 FastApiError의 실제 상태(예: 404, 409)를 보존해서 응답
//
// ─────────────────────────────────────────────────────────────────────────────
// [수정 2026-04-29] 고아 파일(orphan file) 정리 로직 추가
// ─────────────────────────────────────────────────────────────────────────────
// 배경:
//   기존 구현은 multer 가 업로드 파일을 디스크에 먼저 저장한 뒤,
//   FastAPI 의 createFeed() / addFeedImage() 호출이 실패해도
//   이미 저장된 파일을 정리하지 않아 /uploads 디렉터리에 DB 레코드 없이
//   영구 보관되는 "고아 파일" 이 누적되는 문제가 있었음.
//
//   문제 시나리오:
//     1) multer 가 파일 N개 디스크 저장 (성공)
//     2) FastAPI POST /feed/ → 500 에러 또는 success:false 반환
//     3) catch 로 빠지지만 디스크 파일은 그대로 → 디스크 사용량 누적
//
// 해결:
//   - cleanupFiles() 헬퍼로 req.files 의 파일을 일괄 unlink
//   - Promise.allSettled 로 일부 실패해도 나머지를 계속 정리
//   - 검증 실패 / FastAPI 실패 / throw 모든 분기에서 호출
//   - 정상 흐름에서는 호출하지 않음 (DB 레코드와 일치 유지)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/feed", requireAuth, upload.array("files", 10), async (req, res, next) => {
    const { routine_id, completion_id, content } = req.body;
    // [추가 2026-04-29] 업로드된 파일 목록 — 검증/예외 시 정리 대상
    const uploadedFiles = req.files || [];

    /**
     * [추가 2026-04-29] 업로드된 multer 파일들을 디스크에서 일괄 삭제.
     * - Promise.allSettled 사용: 일부 unlink 가 실패하더라도(이미 지워진 경우 등)
     *   다른 파일 정리를 멈추지 않도록 함.
     * - 실패 자체는 로그만 남기고 무시 (파일 시스템 일시 오류일 수 있음).
     */
    const cleanupFiles = async () => {
        if (uploadedFiles.length === 0) return;
        const results = await Promise.allSettled(
            uploadedFiles.map((f) => fs.unlink(f.path))
        );
        results.forEach((r, idx) => {
            if (r.status === "rejected") {
                console.warn(
                    `[feed POST cleanup] ${uploadedFiles[idx].path} 삭제 실패:`,
                    r.reason?.message || r.reason
                );
            }
        });
    };

    if (!routine_id || !completion_id) {
        // [추가 2026-04-29] 필수값 누락 시에도 multer 가 이미 파일을 저장했으므로 정리 필요
        await cleanupFiles();
        return res.status(400).json({ success: false, message: "routine_id와 completion_id가 필요합니다." });
    }

    try {
        // 1. 피드 레코드 생성
        const feedResult = await createFeed({
            user_id: req.user.user_id,
            routine_id,
            completion_id,
            content: content || "",
        });

        if (!feedResult.success) {
            // [추가 2026-04-29] FastAPI 가 success:false 로 응답한 경우에도 고아 파일 방지
            await cleanupFiles();
            return res.status(500).json({ success: false, message: "피드 생성에 실패했습니다." });
        }

        const feed_id = feedResult.feed_id;

        // 2. 업로드된 파일들의 이미지 레코드 생성
        for (const file of uploadedFiles) {
            const fileUrl = `/uploads/${file.filename}`;
            await addFeedImage({
                feed_id,
                file_url: fileUrl,
                file_type: file.mimetype,
            });
        }

        return res.json({ success: true, feed_id });
    } catch (error) {
        // [추가 2026-04-29] FastApiError / 네트워크 오류 / addFeedImage 실패 모두 여기로 진입
        // 이미 일부 addFeedImage 가 성공했더라도, 클라이언트 입장에선 "피드 생성 실패" 이므로
        // 디스크 파일을 정리해 적어도 사용량 누적을 막는다.
        // (DB 부분 성공 데이터는 추후 정합성 점검 배치로 보완 가능 — 현재 범위 외)
        await cleanupFiles();
        return next(error);
    }
});

// ── 전체 피드 목록 조회 (GET /feed) ──────────────────────────────────────────

/**
 * GET /feed
 *
 * 전체 피드를 최신순으로 조회하며, 각 피드의 이미지 목록과
 * 현재 로그인 유저의 좋아요 상태도 함께 반환.
 *
 * 처리 흐름:
 *   1. FastAPI GET /feed/ → 피드 목록 (like_count, comment_count 포함)
 *   2. 각 피드에 대해 병렬로:
 *      - FastAPI GET /feed/{feed_id} → 이미지 목록
 *      - FastAPI GET /like/{feed_id}/{user_id} → 현재 유저 좋아요 여부
 *   3. 합쳐서 반환
 */
router.get("/feed", requireAuth, async (req, res, next) => {
    try {
        // 1. 전체 피드 목록 (최신순, 좋아요/댓글 수 포함)
        const feeds = await getFeeds();

        // 2. 각 피드별 이미지 + 좋아요 상태를 병렬로 조회
        const enrichedFeeds = await Promise.all(
            feeds.map(async (feed) => {
                const [detail, likeStatus] = await Promise.all([
                    getFeedDetail(feed.feed_id),
                    checkLike(feed.feed_id, req.user.user_id),
                ]);

                return {
                    ...feed,
                    images: detail.images || [],
                    comments: detail.comments || [],
                    liked: likeStatus.liked || false,
                };
            })
        );

        return res.json({ success: true, feeds: enrichedFeeds });
    } catch (error) {
        return next(error);
    }
});

// ── 피드 삭제 (DELETE /feed/:feed_id) ────────────────────────────────────────

/**
 * DELETE /feed/:feed_id
 *
 * 피드 삭제 (세션 인증 + 본인 소유 검증)
 *
 * 처리 흐름:
 *   1. 세션 쿠키 확인 → 미로그인 시 401
 *   2. 세션에서 user_id 추출
 *   3. FastAPI DELETE /feed/{feed_id}?user_id={user_id}
 *      → FastAPI에서 WHERE feed_id=? AND user_id=? 조건으로 삭제
 *      → ON DELETE CASCADE로 feed_images, feed_likes, feed_comments도 자동 삭제
 */
// ─────────────────────────────────────────────────────────────────────────────
// [수정 2026-04-29] 피드 삭제 시 디스크 첨부 파일도 함께 정리
// ─────────────────────────────────────────────────────────────────────────────
// 배경:
//   기존 DELETE /feed/:feed_id 는 FastAPI 의 ON DELETE CASCADE 로
//   feeds / feed_images / feed_likes / feed_comments 행만 삭제하고,
//   /uploads 디렉터리의 실제 파일은 그대로 남겨 디스크 사용량이 누적되었음.
//
// 흐름:
//   1) getFeedDetail() 로 첨부 이미지 file_url 목록을 미리 확보
//      (CASCADE 삭제 직후엔 image 레코드가 사라져 조회 불가하므로 반드시 선조회)
//   2) deleteFeed() 로 DB 행 삭제 (소유자 검증 포함)
//   3) DB 삭제가 성공한 경우에만 디스크 파일을 unlink
//      (DB 삭제 실패 시 파일을 지우면 화면엔 아직 남은 피드의 첨부가 사라짐)
//
// 보안:
//   - file_url 은 클라이언트에서 직접 들어오는 값이 아니라
//     POST /feed 에서 서버가 발급한 "/uploads/<random>.ext" 형태이지만,
//     혹시라도 변조된 값이 들어올 가능성에 대비하여
//     path.basename() 으로 파일명만 추출 → UPLOAD_DIR 과 join 한다.
//     이로써 "../../etc/passwd" 같은 디렉터리 트래버설 공격을 차단한다.
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/feed/:feed_id", requireAuth, async (req, res, next) => {
    try {
        // 1. [추가 2026-04-29] 삭제 전에 첨부 이미지 URL 목록을 확보
        //    CASCADE 로 이미지 레코드도 함께 사라지므로 "선조회" 가 핵심.
        //    피드가 없거나 권한 없으면 detail 이 빈 값일 수 있어 기본값 처리.
        let fileUrls = [];
        try {
            const detail = await getFeedDetail(req.params.feed_id);
            fileUrls = (detail?.images || []).map((img) => img.file_url).filter(Boolean);
        } catch (preFetchErr) {
            // 상세 조회 실패해도 DB 삭제 자체는 시도해야 하므로 여기선 swallow.
            // (예: 다른 사용자가 동시에 삭제한 경우 404 가 나올 수 있음)
            console.warn(
                `[feed DELETE] getFeedDetail 실패 — 디스크 정리 생략:`,
                preFetchErr?.message || preFetchErr
            );
        }

        // 2. DB 삭제 (소유자 검증은 FastAPI 측 WHERE user_id=? 로 처리됨)
        const result = await deleteFeed(req.params.feed_id, req.user.user_id);

        // 3. [추가 2026-04-29] DB 삭제가 실제로 성공한 경우에만 디스크 정리
        //    (success:false 인 경우 = 권한 없음 / 존재하지 않음 → 파일 보존)
        if (result?.success && fileUrls.length > 0) {
            const cleanupResults = await Promise.allSettled(
                fileUrls.map((url) => {
                    // 보안: path.basename() 으로 디렉터리 트래버설 차단
                    const filename = path.basename(url);
                    const fullPath = path.join(UPLOAD_DIR, filename);
                    return fs.unlink(fullPath);
                })
            );
            cleanupResults.forEach((r, idx) => {
                if (r.status === "rejected") {
                    console.warn(
                        `[feed DELETE cleanup] ${fileUrls[idx]} 삭제 실패:`,
                        r.reason?.message || r.reason
                    );
                }
            });
        }

        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
