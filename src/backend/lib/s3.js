// ============================================================
// S3 공용 모듈 (S3Client + 키 검증/삭제 헬퍼)
// ============================================================
// 오류 번호: P0 프로필 사진 업로드 (5/23 신규)
// 날짜: 2026-05-23
// 기대 효과:
//   - feed.js / login.js 양쪽에서 S3Client/extractS3Key/deleteS3Object 를
//     동일한 환경변수·동일한 검증 정책으로 사용하게 만들어
//     "feed/" 와 "profile/" prefix 양쪽에서 같은 보안 가드(hostname 정확
//     매칭, path traversal 방어, prefix 화이트리스트)가 적용되도록 한다.
// 장점:
//   - 환경변수 읽기·경고 로그·키 검증 로직을 한 곳에 모아 유지보수 비용 감소
//   - 새 라우트(예: 프로필 사진)에서 동일 정책을 자동 상속 → 누락으로 인한 보안 회귀 차단
//   - feed.js 의 기존 검증(2026-05-11 P0 #17) 을 그대로 이관해 동작 차이 없음
// ============================================================

const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const AWS_REGION = process.env.AWS_REGION || "ap-northeast-2";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

if (!AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
        "⚠️  [lib/s3] AWS S3 환경변수 누락. .env 에 AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY 설정 필요."
    );
}

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// 허용된 S3 키 prefix 목록 — 두 라우트 공통 정책.
//   "feed/"    : 피드/챌린지 인증 사진/영상
//   "profile/" : 프로필 아바타 (2026-05-23 추가)
const ALLOWED_S3_KEY_PREFIXES = ["feed/", "profile/"];

/**
 * S3 퍼블릭 URL → 객체 키 추출 (강화된 검증).
 *
 *   입력: https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/profile/123-456.jpg
 *   반환: profile/123-456.jpg
 *
 * 다음 중 하나라도 어긋나면 null 반환:
 *   1) URL 파싱 실패
 *   2) hostname 이 정확히 "${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com" 가 아님
 *   3) 추출된 key 가 비어 있음
 *   4) key 에 ".." 또는 백슬래시 포함 (path traversal 방어)
 *   5) key 가 ALLOWED_S3_KEY_PREFIXES 중 어느 것으로도 시작하지 않음
 */
function extractS3Key(fileUrl) {
    if (!fileUrl || typeof fileUrl !== "string") return null;
    if (!AWS_S3_BUCKET || !AWS_REGION) return null;

    let parsed;
    try {
        parsed = new URL(fileUrl);
    } catch {
        return null;
    }

    const expectedHost = `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    if (parsed.hostname !== expectedHost) return null;

    const key = parsed.pathname.startsWith("/")
        ? parsed.pathname.slice(1)
        : parsed.pathname;
    if (!key) return null;

    if (key.includes("..") || key.includes("\\")) return null;

    if (!ALLOWED_S3_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        return null;
    }

    return key;
}

/**
 * S3 버킷에서 객체 1개 삭제. 멱등성 있음(이미 없는 객체에 대해서도 200).
 * 실패해도 throw 하지 않고 false 반환 — 호출 측 정리 흐름이 끊기지 않게 함.
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

module.exports = {
    s3,
    AWS_REGION,
    AWS_S3_BUCKET,
    ALLOWED_S3_KEY_PREFIXES,
    extractS3Key,
    deleteS3Object,
};
