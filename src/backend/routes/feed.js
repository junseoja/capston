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
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const {
    createFeed,
    addFeedImage,
    createFeedWithImages,
    getFeeds,
    getFeedDetail,
    deleteFeed,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");

// ── S3 클라이언트 초기화 ─────────────────────────────────────────────────────
// 환경변수 4개(.env): AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
// 누락 시 서버 기동은 되지만 첫 업로드/삭제에서 실패 → 부팅 시 경고만 출력.
const AWS_REGION = process.env.AWS_REGION || "ap-northeast-2";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

if (!AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
        "⚠️  [feed] AWS S3 환경변수 누락. .env 에 AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY 설정 필요."
    );
}

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ── multer 설정 (S3 직접 업로드) ─────────────────────────────────────────────
// 키(파일 경로) 규칙: feed/<timestamp>-<랜덤숫자>.<확장자>
// - 파일명 충돌 방지
// - "feed/" prefix 로 다른 용도 객체와 구분 (향후 프로필 사진 등 추가 시 분리 용이)

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

// ── 헬퍼: S3 객체 삭제 ────────────────────────────────────────────────────────
/**
 * S3 버킷에서 객체 1개 삭제. 멱등성 있음(이미 없는 객체에 대해서도 200 반환).
 * 실패해도 throw 하지 않고 false 반환 — 호출 측에서 일괄 정리 시 일부 실패가
 * 다른 정리를 막지 않도록 함.
 */
async function deleteS3Object(key) {
    if (!key) return false;
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key }));
        return true;
    } catch (err) {
        console.warn(`[S3 delete] key=${key} 실패:`, err?.message || err);
        return false;
    }
}

// multer-s3 의 key 생성 규칙(`feed/<timestamp>-...`)과 일치.
// 향후 프로필 사진 등이 추가되면 prefix 만 늘리면 됨.
const ALLOWED_S3_KEY_PREFIXES = ["feed/", "profile/"];

/**
 * S3 퍼블릭 URL 에서 객체 키만 추출 (강화된 검증).
 *
 *   입력: https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/feed/123-456.jpg
 *   반환: feed/123-456.jpg
 *
 * 다음 중 하나라도 어긋나면 null 반환 → 호출자가 삭제 대상에서 제외:
 *   1) URL 파싱 실패
 *   2) hostname 이 정확히 "${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com" 가 아님
 *   3) 추출된 key 가 비어 있음 / "/" 만으로 구성됨
 *   4) key 에 ".." 시퀀스 또는 백슬래시 포함 (path traversal 방어)
 *   5) key 가 ALLOWED_S3_KEY_PREFIXES 중 어느 것으로도 시작하지 않음
 */
function extractS3Key(fileUrl) {
    if (!fileUrl || typeof fileUrl !== "string") return null;

    // 환경변수가 없으면 정확 매칭 자체가 불가능 → 보수적으로 null
    if (!AWS_S3_BUCKET || !AWS_REGION) return null;

    let parsed;
    try {
        parsed = new URL(fileUrl);
    } catch {
        return null;
    }

    // (2) hostname 정확 매칭 — Virtual-hosted-style 만 허용
    const expectedHost = `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    if (parsed.hostname !== expectedHost) return null;

    // (3) pathname → key 변환
    const key = parsed.pathname.startsWith("/")
        ? parsed.pathname.slice(1)
        : parsed.pathname;
    if (!key) return null;

    // (4) path traversal 시퀀스 방어
    //     S3 키 자체는 ".." 를 허용하지만, 우리 코드 흐름에선 정상 키에 ".." 가 들어올 일이
    //     없으므로 거부하는 편이 안전. 백슬래시(\\) 도 비표준 인코딩 시도로 간주하고 차단.
    if (key.includes("..") || key.includes("\\")) return null;

    // (5) 화이트리스트 prefix 강제
    if (!ALLOWED_S3_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        return null;
    }

    return key;
}

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
