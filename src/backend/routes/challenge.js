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
} = require("../database");
const requireAuth = require("../middleware/requireAuth");

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

module.exports = router;
