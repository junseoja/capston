// ============================================================
// 피드(Feed) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /feed          : 피드 생성 (이미지 업로드 포함, 세션 인증)
//   GET    /feed          : 전체 피드 목록 조회 (이미지 + 현재 유저 좋아요 상태 포함)
//   DELETE /feed/:feed_id : 피드 삭제 (세션 인증 + 본인 소유 검증)
//
// 파일 업로드:
//   - multer-s3로 AWS S3에 직접 업로드
//   - DB 의 feed_images.file_url 에는 S3 퍼블릭 URL 전체 문자열을 저장
//     (예: https://my-bucket.s3.ap-northeast-2.amazonaws.com/feed/171.../abc.jpg)
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const multerS3 = require("multer-s3");
const {
    createFeed,
    addFeedImage,
    createFeedWithImages,
    getFeeds,
    getFeedDetail,
    deleteFeed,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");
// ────────────────────────────────────────────────────────────────────
// [수정 2026-05-23] S3 공용 모듈로 이관 (프로필 사진 업로드 P0)
// ────────────────────────────────────────────────────────────────────
// 오류 번호: P0 프로필 사진 업로드 (5/23 신규)
// 날짜: 2026-05-23
// 기대 효과:
//   - feed.js / login.js 양쪽에서 동일한 S3Client 인스턴스와
//     동일한 키 검증 정책(hostname 정확 매칭, path traversal 방어,
//     prefix 화이트리스트)을 공유하도록 통합
// 장점:
//   - 신규 라우트(프로필 사진)에서 검증 누락 가능성 차단
//   - 검증 정책 변경 시 lib/s3.js 한 곳만 수정하면 됨
// ────────────────────────────────────────────────────────────────────
const { s3, AWS_S3_BUCKET, extractS3Key, deleteS3Object } = require("../lib/s3");

// ── multer 설정 (S3 직접 업로드) ─────────────────────────────────────────────
// 키(파일 경로) 규칙: feed/<timestamp>-<랜덤숫자>.<확장자>
// - 파일명 충돌 방지
// - "feed/" prefix 로 다른 용도 객체와 구분

const upload = multer({
    storage: multerS3({
        s3,
        bucket: AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE, // image/jpeg, video/mp4 등 자동 감지
        // ACL 비활성화 버킷이므로 ACL 옵션은 지정하지 않음
        // (퍼블릭 접근은 STEP 2 의 버킷 정책으로 일괄 허용)
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const uniqueName = `feed/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, uniqueName);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 파일당 최대 50MB
    fileFilter: (req, file, cb) => {
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
 * multipart/form-data 로 텍스트 + 파일 업로드.
 * multer-s3 가 파일을 받으면 즉시 S3 에 PutObject 후 req.files[i] 를 채움:
 *   - location : 퍼블릭 URL (https://...amazonaws.com/feed/...)
 *   - key      : S3 객체 키 (feed/...)
 *   - bucket   : 버킷 이름
 *   - mimetype : MIME 타입
 *
 * 처리 흐름:
 *   1. 세션 인증 → user_id (requireAuth 가 req.user 주입)
 *   2. 검증 실패 / FastAPI 실패 시 cleanupS3Objects() 로 업로드된 S3 객체 정리
 *      → "고아 객체"(DB 레코드 없는 S3 파일) 누적 방지
 *   3. createFeedWithImages() 로 FastAPI 에 단일 호출
 *      → feeds + feed_images 가 동일 트랜잭션에서 INSERT
 *      → 부분 실패 시 FastAPI 측에서 자동 ROLLBACK
 */
router.post("/feed", requireAuth, upload.array("files", 10), async (req, res, next) => {
    const { routine_id, completion_id, content } = req.body;
    const uploadedFiles = req.files || [];

    /**
     * S3 에 이미 업로드된 파일들을 일괄 삭제 (검증 실패 / FastAPI 실패 분기).
     * Promise.allSettled 로 일부 실패해도 나머지는 계속 정리.
     */
    const cleanupS3Objects = async () => {
        if (uploadedFiles.length === 0) return;
        await Promise.allSettled(
            uploadedFiles.map((f) => deleteS3Object(f.key))
        );
    };

    if (!routine_id || !completion_id) {
        await cleanupS3Objects();
        return res.status(400).json({
            success: false,
            message: "routine_id와 completion_id가 필요합니다.",
        });
    }

    try {
        // feeds + feed_images N건은 FastAPI 측 단일 트랜잭션에서 처리된다.
        const result = await createFeedWithImages({
            user_id: req.user.user_id,
            routine_id,
            completion_id,
            content: content || "",
            images: uploadedFiles.map((f) => ({
                file_url: f.location,   // S3 퍼블릭 URL
                file_type: f.mimetype,
            })),
        });

        if (!result?.success) {
            // FastAPI 가 200 OK 인데 success=false 인 경우는 현재 없으나 방어 코드
            await cleanupS3Objects();
            return res.status(500).json({
                success: false,
                message: "피드 생성에 실패했습니다.",
            });
        }

        return res.json({ success: true, feed_id: result.feed_id });
    } catch (error) {
        // FastApiError(403/500) / 네트워크 오류 모두 진입.
        // 이 시점엔 FastAPI 측이 ROLLBACK 했으므로 DB 행은 없음 → S3 객체만 정리.
        await cleanupS3Objects();
        return next(error);
    }
});

// ── 전체 피드 목록 조회 (GET /feed) ──────────────────────────────────────────

// FastAPI GET /feed/는 user_id / cursor / limit 쿼리로 피드 메타,
// 이미지, 좋아요 상태, 카운트, 페이지네이션을 묶어 반환한다.
router.get("/feed", requireAuth, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const result = await getFeeds({
            user_id: req.user.user_id,
            cursor: req.query.cursor,
            limit,
        });
        return res.json({
            success: true,
            feeds: result.feeds || [],
            next_cursor: result.next_cursor || null,
        });
    } catch (error) {
        return next(error);
    }
});

// ── 피드 삭제 (DELETE /feed/:feed_id) ────────────────────────────────────────

/**
 * DELETE /feed/:feed_id
 *
 * 피드 삭제 (세션 인증 + 본인 소유 검증).
 *
 * 처리 흐름:
 *   1. getFeedDetail() 로 첨부 이미지 file_url 목록을 미리 확보
 *      (CASCADE 로 image 레코드도 사라지므로 "선조회" 가 핵심)
 *   2. deleteFeed() 로 DB 행 삭제 (FastAPI 측 WHERE user_id 로 소유자 검증)
 *   3. DB 삭제가 성공한 경우에만 S3 객체 삭제
 *      (DB 삭제 실패 시 S3 객체를 지우면 화면엔 아직 남은 피드의 이미지가 깨짐)
 *
 * 보안:
 *   - file_url 은 서버가 발급한 S3 URL 이지만 변조 가능성 대비
 *     extractS3Key() 가 호스트네임을 검사하고, 비-S3 URL 이면 null 반환 → 무시.
 */
router.delete("/feed/:feed_id", requireAuth, async (req, res, next) => {
    try {
        // 1. 삭제 전에 첨부 이미지 URL 목록 확보
        let fileUrls = [];
        try {
            const detail = await getFeedDetail(req.params.feed_id);
            fileUrls = (detail?.images || []).map((img) => img.file_url).filter(Boolean);
        } catch (preFetchErr) {
            console.warn(
                `[feed DELETE] getFeedDetail 실패 — S3 정리 생략:`,
                preFetchErr?.message || preFetchErr
            );
        }

        // 2. DB 삭제 (소유자 검증은 FastAPI 측 WHERE user_id=? 로 처리됨)
        const result = await deleteFeed(req.params.feed_id, req.user.user_id);

        // 3. DB 삭제가 실제로 성공한 경우에만 S3 객체 삭제
        if (result?.success && fileUrls.length > 0) {
            await Promise.allSettled(
                fileUrls.map((url) => {
                    const key = extractS3Key(url);
                    return key ? deleteS3Object(key) : Promise.resolve(false);
                })
            );
        }

        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
