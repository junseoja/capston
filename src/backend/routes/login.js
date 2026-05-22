// ============================================================
// 인증(Auth) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /signup          : 회원가입 (bcrypt 해싱 후 저장)
//   POST /login           : 로그인 (bcrypt 비교, httpOnly 쿠키 세션 발급)
//   GET  /me              : 현재 로그인 유저 정보 반환
//   PATCH /me/profile     : 닉네임/자기소개 수정
//   POST /logout          : 로그아웃 (세션 DB 삭제 + 쿠키 제거)
//   POST /find-id         : 닉네임+이메일 기반 아이디 찾기
//   POST /find-password   : 본인확인 후 임시 비밀번호 발급
//   GET  /check-duplicate : 아이디/닉네임 중복 확인 (회원가입 전)
//
// 보안:
//   - 비밀번호는 bcryptjs로 단방향 해싱 후 DB 저장 (평문 저장 금지)
//   - 세션 ID는 UUID v4로 생성 → httpOnly 쿠키에 저장 (XSS 방어)
// ============================================================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // 비밀번호 단방향 해싱 라이브러리
const {
    findUser,
    createUser,
    updateUserPassword,
    updateUserProfile,
    findLoginIdByProfile,
    verifyForPasswordReset,
    createSession,
    deleteSession,
} = require("../database");
const crypto = require("crypto"); // [추가 2026-05-20] 임시 비밀번호 안전 난수 생성
const { v4: uuidv4 } = require("uuid"); // 세션 ID 생성용 UUID v4
const requireAuth = require("../middleware/requireAuth");

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY; // FastAPI 내부 호출 인증 키
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 백엔드 기본 이메일 형식 검사
const ALLOWED_GENDERS = ["남", "여", "기타"]; // DB ENUM과 동일한 허용 성별 목록

// 세션 쿠키 옵션은 발급/삭제가 같은 값을 쓰도록 공통 상수로 관리한다.
// production에서는 크로스도메인 HTTPS 쿠키 전송을 위해 secure + sameSite none을 사용한다.
const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,                          // JS 접근 불가 → XSS 방어
    secure: IS_PROD,                         // 배포(HTTPS)에서만 true
    sameSite: IS_PROD ? "none" : "lax",      // 배포=크로스도메인 none, 로컬 lax
};

// SignupPage.jsx와 같은 비밀번호 정책을 백엔드에서도 강제한다.
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/**
 * 회원가입 비밀번호 정책 검증.
 * 유효하면 "" 반환, 위반 시 사용자에게 보낼 메시지 문자열 반환.
 * (프론트 SignupPage.validatePassword 와 규칙 완전 일치)
 */
function validateSignupPassword(pw) {
    if (typeof pw !== "string" || !pw) return "비밀번호를 입력하세요.";
    if (pw.length < 8 || pw.length > 16) {
        return "비밀번호는 8자 이상 16자 이하로 입력하세요.";
    }
    if (/\s/.test(pw)) return "비밀번호에는 공백을 사용할 수 없습니다.";
    if (!/[A-Za-z]/.test(pw)) return "비밀번호에는 영문이 최소 1개 이상 포함되어야 합니다.";
    if (!/\d/.test(pw)) return "비밀번호에는 숫자가 최소 1개 이상 포함되어야 합니다.";
    if (!PASSWORD_SPECIAL_REGEX.test(pw)) {
        return "비밀번호에는 특수문자가 최소 1개 이상 포함되어야 합니다.";
    }
    return "";
}

// ── 회원가입 (POST /signup) ───────────────────────────────────────────────────

/**
 * POST /signup
 *
 * 처리 흐름:
 *   1. 아이디/비밀번호 필수값 확인
 *   2. 아이디 중복 확인
 *   3. 비밀번호 bcrypt 해싱 (saltRounds=10)
 *   4. 생년월일 "YYYY-MM-DD" 변환
 *   5. FastAPI /user/signup 으로 유저 생성 (해시된 비밀번호 전달)
 */
router.post("/signup", async (req, res, next) => {
    try {
        const { id, password, nickname, birth, gender, email } = req.body;

        if (!id || !password) {
            return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력하세요." });
        }

        // 프론트 검증을 우회한 직접 API 호출도 같은 비밀번호 정책으로 차단한다.
        const pwError = validateSignupPassword(password);
        if (pwError) {
            return res.status(400).json({ success: false, message: pwError });
        }

        // 필수 필드 누락은 FastAPI/DB까지 보내지 않고 400으로 응답한다.
        if (!nickname || !email || !gender || !birth) {
            return res.status(400).json({ success: false, message: "회원가입 필수값이 누락되었습니다." });
        }

        const birthYear = Number(birth.year);
        const birthMonth = Number(birth.month);
        const birthDay = Number(birth.day);

        if (!Number.isInteger(birthYear) || !Number.isInteger(birthMonth) || !Number.isInteger(birthDay)) {
            return res.status(400).json({ success: false, message: "생년월일 형식이 올바르지 않습니다." });
        }

        const birthDateObject = new Date(birthYear, birthMonth - 1, birthDay);
        const isValidBirthDate =
            birthDateObject.getFullYear() === birthYear &&
            birthDateObject.getMonth() === birthMonth - 1 &&
            birthDateObject.getDate() === birthDay;

        if (!isValidBirthDate) {
            return res.status(400).json({ success: false, message: "유효한 생년월일을 입력하세요." });
        }

        if (!EMAIL_REGEX.test(String(email).trim())) {
            return res.status(400).json({ success: false, message: "올바른 이메일 형식이 아닙니다." });
        }

        if (!ALLOWED_GENDERS.includes(gender)) {
            return res.status(400).json({ success: false, message: "성별 값이 올바르지 않습니다." });
        }

        const existing = await findUser(id);
        if (existing) {
            return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
        }

        // 비밀번호 해싱 (saltRounds=10: 보안↑ 속도↓ 적절한 균형값)
        // bcrypt.hash()는 내부적으로 랜덤 salt를 생성하여 결합
        const hashedPassword = await bcrypt.hash(password, 10);

        const birth_date = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

        const result = await createUser({
            login_id: id,
            password: hashedPassword, // 해시된 비밀번호만 DB에 저장 (원본 비밀번호는 폐기)
            nickname,
            birth_date,
            gender,
            email,
        });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

// ── 로그인 (POST /login) ──────────────────────────────────────────────────────

/**
 * POST /login
 *
 * 처리 흐름:
 *   1. 아이디로 유저 조회 (DB에서 해시된 비밀번호 포함한 유저 정보 반환)
 *   2. bcrypt.compare()로 입력 비밀번호 vs 저장된 해시 비교
 *   3. 일치 시 세션 생성 → httpOnly 쿠키 발급
 */
router.post("/login", async (req, res, next) => {
    try {
        const { id, password } = req.body;

        const user = await findUser(id);
        if (!user) {
            return res.status(401).json({ success: false, message: "존재하지 않는 아이디입니다." });
        }

        // ─────────────────────────────────────────────────────────────────
        // 비밀번호 비교:
        //   - DB에 bcrypt 해시($2b$ / $2a$ 로 시작)가 저장된 경우
        //     → bcrypt.compare() 로 안전하게 비교
        //   - 이전 방식으로 평문이 저장된 계정
        //     → 우선 직접 문자열 비교(하위 호환)
        //
        // 레거시 평문 비밀번호는 로그인 성공 시 bcrypt 해시로 자동 교체한다.
        //
        //   흐름:
        //     1) 평문 일치 확인
        //     2) bcrypt.hash(password, 10) 로 해시 생성
        //     3) FastAPI PATCH /user/password/{user_id} 호출하여 DB 교체
        //     4) 다음 로그인부터는 bcrypt.compare 분기로만 동작
        //
        //   업그레이드 실패 정책:
        //     - 로그인 자체는 평문 매치가 성공했으면 통과시킨다(UX 우선).
        //     - 업그레이드 실패는 console.error 로 로그만 남기고 다음 기회를 노림.
        //       (마이그레이션은 N번 시도되어도 멱등 — 항상 같은 평문이면 같은 결과)
        //
        //   정리 기준:
        //     SELECT user_id FROM users WHERE password NOT LIKE '$2%'; 가
        //     0건이 되면 아래 평문 폴백 분기를 완전히 제거할 수 있다.
        // ─────────────────────────────────────────────────────────────────
        const isBcryptHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
        let isMatch;

        if (isBcryptHash) {
            // 안전 경로: 이미 해시된 비밀번호와 비교
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // 레거시 평문 경로: 평문 일치 시 즉시 해시로 업그레이드
            isMatch = password === user.password;

            if (isMatch) {
                try {
                    const newHash = await bcrypt.hash(password, 10);
                    await updateUserPassword(user.user_id, newHash);
                    console.log(
                        `[lazy-migration] user_id=${user.user_id} 평문→bcrypt 변환 완료`
                    );
                } catch (migrationError) {
                    // 업그레이드 실패해도 로그인 자체는 통과시킴 — 다음 로그인 때 재시도됨.
                    // 단, 운영 모니터링을 위해 에러 로그는 반드시 남긴다.
                    console.error(
                        `[lazy-migration] 비밀번호 해시 업그레이드 실패 — user_id=${user.user_id}:`,
                        migrationError?.message || migrationError
                    );
                }
            }
        }

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
        }

        const sessionId = uuidv4();
        await createSession(sessionId, user.user_id);

        res.cookie("sessionId", sessionId, {
            ...SESSION_COOKIE_OPTIONS,
            maxAge: 1000 * 60 * 60 * 24, // 1일 (발급 시에만 추가)
        });

        return res.json({ success: true, message: "로그인 성공" });
    } catch (error) {
        return next(error);
    }
});

// ── 현재 유저 정보 (GET /me) ──────────────────────────────────────────────────

/**
 * GET /me
 * 쿠키의 sessionId → (requireAuth) 세션 조회 → 유저 정보 반환 (비밀번호 제외)
 */
router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const user = await findUser(req.user.login_id);
        if (!user) {
            return res.status(401).json({ success: false, message: "유저 정보를 찾을 수 없습니다." });
        }

        // 비밀번호(해시)는 절대 클라이언트에 전달하지 않음
        return res.json({
            success: true,
            user: {
                user_id: user.user_id,
                login_id: user.login_id,
                nickname: user.nickname,
                email: user.email,
                gender: user.gender,
                birth_date: user.birth_date,
                profile_img: user.profile_img,
                // ─────────────────────────────────────────────────────────────
                // [추가 2026-05-20] 자기소개 노출 (P0 #2)
                // 이유: MyPage 인스타 스타일 편집 UI 초기값을 DB 값으로 채우기 위해 필요
                // 기대 효과: 새로고침 후에도 저장된 bio 가 동일하게 노출
                // 장점: 단일 GET /me 호출로 nickname/bio 모두 받아 추가 fetch 불필요
                // ─────────────────────────────────────────────────────────────
                bio: user.bio ?? null,
            },
        });
    } catch (error) {
        return next(error);
    }
});

// ────────────────────────────────────────────────────────────────────
// [추가 2026-05-20] 프로필 수정 (PATCH /me/profile) — P0 #2
// ────────────────────────────────────────────────────────────────────
// 오류 번호: P0 #2 (MyPage handleSaveProfile 백엔드 미연결로 새로고침 시 휘발)
// 날짜: 2026-05-20
// 기대 효과:
//   - 인스타 스타일 프로필 편집 UI 가 누른 저장이 실제 DB 에 반영됨
//   - GET /me 응답의 nickname/bio 가 즉시 갱신값으로 응답
// 장점:
//   - requireAuth 미들웨어로 본인만 자기 프로필 수정 가능 (req.user.user_id 사용)
//   - 클라이언트가 보낸 user_id 는 무시 → IDOR 공격 차단
//   - 닉네임 trim + 길이 검증을 Express 단에서 차단 → FastAPI/DB 까지 가지 않음
// ────────────────────────────────────────────────────────────────────
router.patch("/me/profile", requireAuth, async (req, res, next) => {
    try {
        const { nickname, bio } = req.body || {};

        const payload = {};

        if (nickname !== undefined) {
            if (typeof nickname !== "string") {
                return res.status(400).json({ success: false, message: "닉네임 형식이 올바르지 않습니다." });
            }
            const trimmed = nickname.trim();
            if (!trimmed) {
                return res.status(400).json({ success: false, message: "닉네임을 입력하세요." });
            }
            if (trimmed.length > 10) {
                return res.status(400).json({ success: false, message: "닉네임은 10자 이내로 입력하세요." });
            }
            payload.nickname = trimmed;
        }

        if (bio !== undefined) {
            if (typeof bio !== "string") {
                return res.status(400).json({ success: false, message: "자기소개 형식이 올바르지 않습니다." });
            }
            if (bio.length > 300) {
                return res.status(400).json({ success: false, message: "자기소개는 300자 이내로 입력하세요." });
            }
            // 빈 문자열은 "자기소개 삭제" 의미로 그대로 전달
            payload.bio = bio;
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: "변경할 항목이 없습니다." });
        }

        const result = await updateUserProfile(req.user.user_id, payload);

        if (!result?.success) {
            return res.status(400).json({
                success: false,
                message: result?.message || "프로필 수정에 실패했습니다.",
            });
        }

        return res.json({ success: true, user: result.user });
    } catch (error) {
        return next(error);
    }
});

// ── 로그아웃 (POST /logout) ───────────────────────────────────────────────────

/**
 * POST /logout
 * DB에서 세션 삭제 + 브라우저 쿠키 제거
 *
 * (logout은 미로그인 상태에서도 성공해야 하므로 requireAuth는 적용하지 않음)
 */
router.post("/logout", async (req, res, next) => {
    try {
        const { sessionId } = req.cookies;
        if (sessionId) await deleteSession(sessionId);

        res.clearCookie("sessionId", SESSION_COOKIE_OPTIONS);
        return res.json({ success: true, message: "로그아웃 완료" });
    } catch (error) {
        return next(error);
    }
});

// ────────────────────────────────────────────────────────────────────
// [추가 2026-05-20] 아이디 찾기 / 비밀번호 재설정 (P0 #3)
// ────────────────────────────────────────────────────────────────────
// 오류 번호: P0 #3 (LoginPage 아이디·비번 찾기 Mock 하드코딩 제거)
// 날짜: 2026-05-20
// 기대 효과:
//   - "홍길동" / "test@test.com" 하드코딩 매칭 제거 → 실제 회원 정보로 본인 확인
//   - 비밀번호 재설정 성공 시 임시 비밀번호를 alert 로 즉시 안내 (이메일 인프라 부재 대안)
// 장점:
//   - 아이디 찾기: 닉네임+이메일 매칭, 응답에는 login_id 외 PII 노출 없음
//   - 비밀번호 재설정: 본인 확인 후 임시 비번을 정책(8-16자 영문/숫자/특수문자) 만족하게 생성,
//     bcrypt 해시로 DB 저장 → 다음 로그인부터 바로 사용 가능
//   - crypto.randomInt 사용으로 예측 불가능한 난수 보장
//   - 실제 이메일/SMS 발송 인프라가 추가되면 응답에서 temp_password 제거 + 발송 로직만 추가하면 됨
// ────────────────────────────────────────────────────────────────────

/**
 * 비밀번호 정책(8-16자, 영문/숫자/특수문자 각 1개 이상)을 만족하는 12자 임시 비밀번호 생성.
 * - 영문 대/소문자 8자 + 숫자 2자 + 특수문자 2자
 * - 순서를 섞어 패턴 추측 차단
 */
function generateTempPassword() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"; // 0,O,I,l 등 혼동 글자 제외
    const digits = "23456789";
    const specials = "!@#$%^&*";

    const pickFrom = (charset, count) => {
        let out = "";
        for (let i = 0; i < count; i++) {
            out += charset[crypto.randomInt(0, charset.length)];
        }
        return out;
    };

    const raw =
        pickFrom(letters, 8) +
        pickFrom(digits, 2) +
        pickFrom(specials, 2);

    // Fisher-Yates 셔플로 자릿수별 위치 무작위화
    const arr = raw.split("");
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
}

/**
 * POST /find-id
 * Body: { name, email }   ← 클라이언트 호환을 위해 "name" 도 닉네임으로 받음
 *       또는 { nickname, email }
 *
 * 실제 인증은 DB 의 nickname 컬럼과 매칭한다. (현 스키마에 실명 컬럼 없음)
 */
router.post("/find-id", async (req, res, next) => {
    try {
        const { name, nickname, email } = req.body || {};
        const candidateNickname = (nickname ?? name ?? "").trim();
        const candidateEmail = (email ?? "").trim();

        if (!candidateNickname || !candidateEmail) {
            return res.status(400).json({ success: false, message: "닉네임과 이메일을 입력하세요." });
        }
        if (!EMAIL_REGEX.test(candidateEmail)) {
            return res.status(400).json({ success: false, message: "올바른 이메일 형식이 아닙니다." });
        }

        const result = await findLoginIdByProfile(candidateNickname, candidateEmail);
        if (!result?.success) {
            return res.json({ success: false, message: "일치하는 회원 정보가 없습니다." });
        }
        return res.json({ success: true, login_id: result.login_id });
    } catch (error) {
        return next(error);
    }
});

/**
 * POST /find-password
 * Body: { name | nickname, login_id (또는 id), email }
 *
 * 동작:
 *   1) FastAPI 본인 확인 (닉네임 + 아이디 + 이메일 매칭)
 *   2) 임시 비밀번호 생성 → bcrypt 해시
 *   3) PATCH /user/password/{user_id} 호출로 DB 비밀번호 교체
 *   4) 평문 임시 비번을 응답에 포함 (이메일 발송 인프라 도입 전 대안)
 */
router.post("/find-password", async (req, res, next) => {
    try {
        const { name, nickname, id, login_id, email } = req.body || {};
        const candidateNickname = (nickname ?? name ?? "").trim();
        const candidateLoginId = (login_id ?? id ?? "").trim();
        const candidateEmail = (email ?? "").trim();

        if (!candidateNickname || !candidateLoginId || !candidateEmail) {
            return res.status(400).json({ success: false, message: "닉네임, 아이디, 이메일을 모두 입력하세요." });
        }
        if (!EMAIL_REGEX.test(candidateEmail)) {
            return res.status(400).json({ success: false, message: "올바른 이메일 형식이 아닙니다." });
        }

        const verify = await verifyForPasswordReset(candidateNickname, candidateLoginId, candidateEmail);
        if (!verify?.success) {
            return res.json({ success: false, message: "일치하는 회원 정보가 없습니다." });
        }

        const tempPassword = generateTempPassword();
        const hashed = await bcrypt.hash(tempPassword, 10);
        const updated = await updateUserPassword(verify.user_id, hashed);
        if (!updated?.success) {
            return res.status(500).json({ success: false, message: "임시 비밀번호 저장에 실패했습니다." });
        }

        return res.json({
            success: true,
            // 이메일 발송 인프라 도입 전까지는 평문 임시 비번을 응답으로 안내한다.
            // 인프라 도입 후엔 본 필드를 제거하고 메일 발송 트리거만 남기면 됨.
            temp_password: tempPassword,
        });
    } catch (error) {
        return next(error);
    }
});

// ── 중복체크 (GET /check-duplicate) ──────────────────────────────────────────

/**
 * GET /check-duplicate?field=userId&value=값
 *       또는
 * GET /check-duplicate?field=nickname&value=값
 *
 * SignupPage.jsx에서 아이디/닉네임 중복체크 버튼 클릭 시 호출
 * FastAPI의 /user/check/* 엔드포인트를 중계하여 결과 반환
 *
 * Query Params:
 *   field - "userId" 또는 "nickname"
 *   value - 확인할 값
 *
 * Response:
 *   { isDuplicate: true }  → 이미 사용 중
 *   { isDuplicate: false } → 사용 가능
 */
router.get("/check-duplicate", async (req, res) => {
    const { field, value } = req.query;

    if (!field || !value) {
        return res.status(400).json({ success: false, message: "field와 value가 필요합니다." });
    }

    // field 이름에 따라 FastAPI 엔드포인트 분기
    let url;
    if (field === "userId") {
        url = `${PYTHON_API}/user/check/login_id/${encodeURIComponent(value.trim())}`;
    } else if (field === "nickname") {
        url = `${PYTHON_API}/user/check/nickname/${encodeURIComponent(value.trim())}`;
    } else {
        return res.status(400).json({ success: false, message: "field는 userId 또는 nickname이어야 합니다." });
    }

    try {
        const fetch = require("node-fetch");
        // 이 엔드포인트는 fetchJson()을 거치지 않으므로 내부 인증 헤더를 직접 붙인다.
        const headers = INTERNAL_API_KEY
            ? { "X-Internal-Api-Key": INTERNAL_API_KEY }
            : {};
        const response = await fetch(url, { headers });
        const result = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: result?.detail || result?.message || "중복체크 요청에 실패했습니다.",
            });
        }
        // FastAPI 응답: { isDuplicate: true/false }
        return res.json(result);
    } catch (error) {
        console.error("중복체크 FastAPI 요청 실패:", error);
        return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

module.exports = { router };
