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
router.post("/feed", requireAuth, upload.array("files", 10), async (req, res, next) => {
    const { routine_id, completion_id, content } = req.body;

    if (!routine_id || !completion_id) {
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
            return res.status(500).json({ success: false, message: "피드 생성에 실패했습니다." });
        }

        const feed_id = feedResult.feed_id;

        // 2. 업로드된 파일들의 이미지 레코드 생성
        const uploadedFiles = req.files || [];
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
router.delete("/feed/:feed_id", requireAuth, async (req, res, next) => {
    try {
        const result = await deleteFeed(req.params.feed_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
