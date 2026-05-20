const express = require("express");
const multer = require("multer");
const path = require("path");
const multerS3 = require("multer-s3");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const {
    getChallenges,
    getMyChallenges,
    getChallengeProofs,
    joinChallenge,
    createChallengeProof,
    cancelTodayChallengeProof,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengeParticipants,
    getChallengeAllProofs,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const AWS_REGION = process.env.AWS_REGION || "ap-northeast-2";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

if (!AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
        "[challenge] AWS S3 env is incomplete. Upload endpoints need AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY."
    );
}

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multerS3({
        s3,
        bucket: AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const uniqueName = `challenge/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, uniqueName);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
            return;
        }
        cb(new Error("이미지 또는 동영상 파일만 업로드할 수 있습니다."), false);
    },
});

async function deleteS3Object(key) {
    if (!key) return false;
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key }));
        return true;
    } catch (error) {
        console.warn(`[challenge S3 delete] key=${key} failed:`, error?.message || error);
        return false;
    }
}

function extractS3Key(fileUrl) {
    if (!fileUrl || typeof fileUrl !== "string" || !AWS_S3_BUCKET || !AWS_REGION) {
        return null;
    }

    let parsed;
    try {
        parsed = new URL(fileUrl);
    } catch {
        return null;
    }

    const expectedHost = `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    if (parsed.hostname !== expectedHost) return null;

    const key = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
    if (!key || key.includes("..") || key.includes("\\")) return null;
    if (!key.startsWith("challenge/")) return null;

    return key;
}

router.get("/challenge", requireAuth, async (req, res, next) => {
    try {
        const challenges = await getChallenges();
        return res.json({ success: true, challenges });
    } catch (error) {
        return next(error);
    }
});

router.get("/challenge/my", requireAuth, async (req, res, next) => {
    try {
        const challenges = await getMyChallenges(req.user.user_id);
        return res.json({ success: true, challenges });
    } catch (error) {
        return next(error);
    }
});

router.get("/challenge/proofs", requireAuth, async (req, res, next) => {
    try {
        const proofs = await getChallengeProofs(req.user.user_id);
        return res.json({ success: true, proofs });
    } catch (error) {
        return next(error);
    }
});

router.post("/challenge/:challenge_id/join", requireAuth, async (req, res, next) => {
    try {
        const result = await joinChallenge(req.params.challenge_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

router.post(
    "/challenge/:challenge_id/proof",
    requireAuth,
    upload.array("files", 3),
    async (req, res, next) => {
        const uploadedFiles = req.files || [];
        const content = req.body.content || "";
        const proofDate = req.body.proof_date || "";
        const shareToFeed =
            req.body.share_to_feed === "true" ||
            req.body.share_to_feed === "1" ||
            req.body.share_to_feed === true;

        const cleanupS3Objects = async () => {
            if (uploadedFiles.length === 0) return;
            await Promise.allSettled(uploadedFiles.map((file) => deleteS3Object(file.key)));
        };

        try {
            const result = await createChallengeProof(req.params.challenge_id, {
                user_id: req.user.user_id,
                content,
                proof_date: proofDate || null,
                share_to_feed: shareToFeed,
                files: uploadedFiles.map((file) => ({
                    file_url: file.location,
                    file_type: file.mimetype,
                })),
            });

            if (!result?.success) {
                await cleanupS3Objects();
                return res.status(500).json({
                    success: false,
                    message: "챌린지 인증 등록에 실패했습니다.",
                });
            }

            return res.json(result);
        } catch (error) {
            await cleanupS3Objects();
            return next(error);
        }
    }
);

router.delete("/challenge/:challenge_id/proof/today", requireAuth, async (req, res, next) => {
    try {
        const result = await cancelTodayChallengeProof(req.params.challenge_id, req.user.user_id);

        if (result?.success && Array.isArray(result.file_urls) && result.file_urls.length > 0) {
            await Promise.allSettled(
                result.file_urls.map((url) => {
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

// ────────────────────────────────────────────────────────────────────
// [추가 2026-05-20] 관리자 챌린지 CRUD + 참여자/인증 (5개 라우트)
// ────────────────────────────────────────────────────────────────────
// 오류 번호: P1 (AdminPage 챌린지 관리 mock state → DB 영속)
// 날짜: 2026-05-20
// 기대 효과:
//   - POST   /challenge                          : 챌린지 신규 등록
//   - PATCH  /challenge/:challenge_id            : 챌린지 정보 수정
//   - DELETE /challenge/:challenge_id            : 챌린지 Soft Delete
//   - GET    /challenge/:challenge_id/participants : 참여자 + 인증일수
//   - GET    /challenge/:challenge_id/proofs       : 실시간 인증 현황
// 장점:
//   - requireAdmin 으로 보호 (notice/report 와 동일 패턴)
//   - 입력 검증을 라우트 단에서 빠르게 거르고 FastAPI 호출 비용 절감
// ────────────────────────────────────────────────────────────────────

function _parsePayload(body) {
    return {
        title: typeof body.title === "string" ? body.title.trim() : body.title,
        description:
            typeof body.description === "string" ? body.description.trim() : body.description,
        category: typeof body.category === "string" ? body.category.trim() : body.category,
        start_date: body.start_date || body.startDate,
        end_date: body.end_date || body.endDate,
    };
}

router.post("/challenge", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const payload = _parsePayload(req.body || {});
        if (!payload.title) {
            return res.status(400).json({ success: false, message: "챌린지 제목을 입력해주세요." });
        }
        if (!payload.start_date || !payload.end_date) {
            return res.status(400).json({ success: false, message: "시작일과 종료일을 입력해주세요." });
        }
        const result = await createChallenge({
            ...payload,
            created_by: req.user.user_id,
        });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

router.patch("/challenge/:challenge_id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const payload = _parsePayload(req.body || {});
        const filtered = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== undefined && v !== null && v !== ""),
        );
        if (Object.keys(filtered).length === 0) {
            return res.status(400).json({ success: false, message: "수정할 항목이 없습니다." });
        }
        const result = await updateChallenge(req.params.challenge_id, filtered);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

router.delete("/challenge/:challenge_id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const result = await deleteChallenge(req.params.challenge_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

router.get(
    "/challenge/:challenge_id/participants",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            const result = await getChallengeParticipants(req.params.challenge_id);
            return res.json({ success: true, ...result });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/challenge/:challenge_id/proofs",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            const limit = Number(req.query.limit) || 60;
            const result = await getChallengeAllProofs(req.params.challenge_id, limit);
            return res.json({ success: true, ...result });
        } catch (error) {
            return next(error);
        }
    },
);

module.exports = router;
