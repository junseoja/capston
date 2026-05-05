// ============================================================
// 피드(Feed) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /feed          : 피드 생성 (이미지 업로드 포함, 세션 인증)
//   GET    /feed          : 전체 피드 목록 조회 (이미지 + 현재 유저 좋아요 상태 포함)
//   DELETE /feed/:feed_id : 피드 삭제 (세션 인증 + 본인 소유 검증)
//
// 파일 업로드 (2026-05-05 변경):
//   - 기존: multer.diskStorage → src/backend/uploads/ 로컬 저장
//   - 현재: multer-s3 → AWS S3 직접 업로드 (퍼블릭 읽기 버킷)
//   - 사유: 팀원 간 RDS 공유 시 "내 PC 이미지가 다른 PC에서 깨지는" 문제 해결.
//           README 미구현 항목("피드 이미지 → S3 등 클라우드 스토리지 전환 고려") 해소.
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
    getFeeds,
    getFeedDetail,
    deleteFeed,
} = require("../database");
// [리팩터링 #12] 세션 인증 4줄 복붙을 미들웨어 한 줄로 대체
const requireAuth = require("../middleware/requireAuth");

// ── [추가 2026-05-05] S3 클라이언트 초기화 ───────────────────────────────────
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

/**
 * S3 퍼블릭 URL 에서 객체 키만 추출.
 *   입력: https://my-bucket.s3.ap-northeast-2.amazonaws.com/feed/123-456.jpg
 *   반환: feed/123-456.jpg
 *
 * 실패 시 null. 비-S3 URL 이거나 형식이 맞지 않으면 삭제 대상에서 제외.
 */
function extractS3Key(fileUrl) {
    if (!fileUrl || typeof fileUrl !== "string") return null;
    try {
        const u = new URL(fileUrl);
        // 호스트는 "<bucket>.s3.<region>.amazonaws.com" 또는 "s3.<region>.amazonaws.com/<bucket>/..."
        // 이 코드는 Virtual-hosted-style (multer-s3 기본) 만 처리.
        if (!u.hostname.endsWith(".amazonaws.com")) return null;
        // pathname 은 "/feed/123-456.jpg" 형태 → 앞 슬래시 제거
        return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
    } catch {
        return null;
    }
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
 *   3. createFeed() 로 feeds 행 INSERT → feed_id 획득
 *   4. 각 파일마다 addFeedImage() 로 feed_images 행 INSERT
 *      file_url 에는 S3 퍼블릭 URL 전체 저장 (프론트는 URL 그대로 <img src=>)
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
        // 1. 피드 레코드 생성
        const feedResult = await createFeed({
            user_id: req.user.user_id,
            routine_id,
            completion_id,
            content: content || "",
        });

        if (!feedResult.success) {
            await cleanupS3Objects();
            return res.status(500).json({
                success: false,
                message: "피드 생성에 실패했습니다.",
            });
        }

        const feed_id = feedResult.feed_id;

        // 2. 각 업로드 파일에 대해 feed_images 행 생성 (S3 URL 그대로 저장)
        for (const file of uploadedFiles) {
            await addFeedImage({
                feed_id,
                file_url: file.location, // S3 퍼블릭 URL
                file_type: file.mimetype,
            });
        }

        return res.json({ success: true, feed_id });
    } catch (error) {
        // FastApiError / 네트워크 오류 / addFeedImage 실패 모두 진입.
        // DB 부분 성공 시 일부 image 행은 남을 수 있지만, 사용자에겐 "실패" 이므로
        // S3 객체는 일괄 정리해 누적 차단. (정합성 점검 배치는 추후 과제)
        await cleanupS3Objects();
        return next(error);
    }
});

// ── 전체 피드 목록 조회 (GET /feed) ──────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// [수정 2026-05-03] N+1 제거 + 커서 기반 페이지네이션
// ─────────────────────────────────────────────────────────────────────────────
// 배경 (README 기술부채 #10, #11):
//   기존 구현은 피드 1건마다 getFeedDetail + checkLike 두 번씩 호출 →
//   N개 피드면 1 + 2N 회의 HTTP/DB 라운드트립 발생 (N+1 안티패턴).
//   또한 LIMIT 없이 전 행을 반환해 피드 수 누적 시 응답 폭증.
//
// 변경:
//   - FastAPI GET /feed/ 가 user_id / cursor / limit 쿼리를 받아
//     단일 SQL JOIN 으로 이미지·좋아요 상태·페이지네이션을 모두 처리.
//   - Express 는 인증 정보와 쿼리 파라미터만 전달하는 얇은 패스스루로 정리.
//   - 댓글은 list 응답에서 제거 — 모달 진입 시 별도 엔드포인트로 페치.
// ─────────────────────────────────────────────────────────────────────────────
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
