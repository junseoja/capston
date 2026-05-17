// ============================================================
// 인증(Auth) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /signup          : 회원가입 (bcrypt 해싱 후 저장)
//   POST /login           : 로그인 (bcrypt 비교, httpOnly 쿠키 세션 발급)
//   GET  /me              : 현재 로그인 유저 정보 반환
//   POST /logout          : 로그아웃 (세션 DB 삭제 + 쿠키 제거)
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
    // [추가 2026-04-29] 평문→bcrypt Lazy Migration 용
    updateUserPassword,
    createSession,
    deleteSession,
} = require("../database");
const { v4: uuidv4 } = require("uuid"); // 세션 ID 생성용 UUID v4
// [리팩터링 #12] /me, /logout 에서 세션 검증 중복 코드를 미들웨어로 대체
const requireAuth = require("../middleware/requireAuth");

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY; // [추가 2026-05-10] FastAPI 내부 호출 인증 키
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // [추가] 백엔드 기본 이메일 형식 검사
const ALLOWED_GENDERS = ["남", "여", "기타"]; // [추가] DB ENUM과 동일한 허용 성별 목록

// [추가 2026-05-17 / 배포 준비] 세션 쿠키 옵션 공통 상수.
// 오류번호: 배포 준비 (크로스 도메인 쿠키)
// 날짜: 2026-05-17
// 기대효과:
//   배포 시 프론트(vercel.app)와 백엔드(render.com)가 다른 도메인이라
//   sameSite:"lax" 면 브라우저가 세션 쿠키를 안 보내 로그인이 안 됨.
//   production 에서는 secure:true + sameSite:"none" 으로 자동 전환.
// 장점:
//   - 발급(res.cookie)과 제거(res.clearCookie)가 동일 옵션을 공유 →
//     옵션 불일치로 로그아웃 시 쿠키가 안 지워지는 브라우저 버그 예방.
//   - 로컬은 기존대로 secure:false + sameSite:"lax" (HTTP 개발 정상 동작).
// 주의: sameSite:"none" 은 브라우저 규칙상 반드시 secure:true 와 함께여야 함
//       → production(HTTPS) 에서만 none 적용하므로 안전.
const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,                          // JS 접근 불가 → XSS 방어
    secure: IS_PROD,                         // 배포(HTTPS)에서만 true
    sameSite: IS_PROD ? "none" : "lax",      // 배포=크로스도메인 none, 로컬 lax
};

// [추가 2026-05-17 / 신규 #19 회원가입 비밀번호 정책]
// 오류번호: 5/11 종합 리뷰 신규 #19 (회원가입 비밀번호 정책 부재)
// 날짜: 2026-05-17
// 기대효과: 프론트(SignupPage.validatePassword)가 검증하던 비번 정책을
//          백엔드에서도 동일하게 강제 → curl/직접 API 호출 우회 차단.
// 장점: 약한 비밀번호 가입 자체를 막아 계정 탈취 위험 감소.
//       프론트와 규칙을 1:1로 맞춰(8~16자/공백X/영문·숫자·특수 각 1+)
//       사용자가 프론트 통과 후 백엔드에서 또 막히는 불일치 없음.
// SignupPage.jsx 의 SPECIAL_CHAR_REGEX 와 동일한 특수문자 집합.
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
// [리팩터링 #1] try/catch + next(err) 추가
//   - 기존: findUser/createUser 가 throw하면 Express 기본 핸들러로 흘러 HTML 500
//     → 프론트 res.json()이 SyntaxError 로 크래시
//   - 이후: 글로벌 에러 핸들러(#3)로 넘겨 JSON 응답 보장
router.post("/signup", async (req, res, next) => {
    try {
        const { id, password, nickname, birth, gender, email } = req.body;

        if (!id || !password) {
            return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력하세요." });
        }

        // [추가 2026-05-17 / 신규 #19] 비밀번호 정책 백엔드 강제.
        // 프론트 검증을 우회한 직접 API 호출(curl 등)도 약한 비번을 막는다.
        const pwError = validateSignupPassword(password);
        if (pwError) {
            return res.status(400).json({ success: false, message: pwError });
        }

        // [추가] 프론트 외의 클라이언트가 잘못된 body를 보내더라도
        // 500이 아닌 400으로 명확히 응답하도록 기본 입력 검증 보강
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
// [리팩터링 #1] try/catch + next(err) 추가
//   - 기존: findUser/createSession 실패 시 HTML 500 반환 → 프론트 crash
//   - 이후: 글로벌 에러 핸들러(#3)로 JSON 응답 보장
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
        // [수정 2026-04-29] 평문 → bcrypt Lazy Migration 추가
        //   기존에는 평문 폴백이 영구적으로 남아 있어 DB 유출 시 즉시 탈취되는
        //   심각한 보안 위험이 있었음. 이를 해결하기 위해
        //   "로그인 성공 시점에 자동으로 bcrypt 해시로 업그레이드" 하는 패턴을
        //   도입하여, 사용자가 한 번이라도 정상 로그인하면 그 즉시
        //   해당 계정 비밀번호가 bcrypt 해시로 영구 교체되도록 한다.
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
        //   향후 정리:
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
                    // [추가 2026-04-29] saltRounds=10 으로 bcrypt 해시 생성 후 DB 교체
                    const newHash = await bcrypt.hash(password, 10);
                    await updateUserPassword(user.user_id, newHash);
                    console.log(
                        `[lazy-migration 2026-04-29] user_id=${user.user_id} 평문→bcrypt 변환 완료`
                    );
                } catch (migrationError) {
                    // 업그레이드 실패해도 로그인 자체는 통과시킴 — 다음 로그인 때 재시도됨.
                    // 단, 운영 모니터링을 위해 에러 로그는 반드시 남긴다.
                    console.error(
                        `[lazy-migration 2026-04-29] 비밀번호 해시 업그레이드 실패 — user_id=${user.user_id}:`,
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

        // [수정 2026-05-17] 공통 SESSION_COOKIE_OPTIONS 사용 (배포 크로스도메인 대응)
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
 *
 * [리팩터링 #12] 기존의 sessionId 추출 + findSession 블록을 requireAuth 로 대체.
 * 401 메시지가 기존 "로그인되지 않았습니다." / "유효하지 않은 세션입니다." 에서
 * 미들웨어 표준 메시지 "로그인이 필요합니다." 로 통일됨 (프론트 쪽은 401 자체만 판단하므로 영향 없음).
 */
// [리팩터링 #1] try/catch + next(err) 추가 — findUser가 throw해도 글로벌 핸들러로 전달
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
            },
        });
    } catch (error) {
        return next(error);
    }
});

// ── 로그아웃 (POST /logout) ───────────────────────────────────────────────────

/**
 * POST /logout
 * DB에서 세션 삭제 + 브라우저 쿠키 제거
 *
 * [리팩터링 #1] try/catch + next(err) 추가 — FastAPI 세션 삭제 실패 시에도
 * 쿠키는 삭제하고 에러만 글로벌 핸들러로 전달.
 * (logout은 미로그인 상태에서도 성공해야 하므로 requireAuth는 적용하지 않음)
 */
router.post("/logout", async (req, res, next) => {
    try {
        const { sessionId } = req.cookies;
        if (sessionId) await deleteSession(sessionId);

        // [수정 2026-05-17] 발급(res.cookie)과 완전히 동일한 옵션으로 제거.
        // SESSION_COOKIE_OPTIONS 공유 → 옵션 불일치로 쿠키가 안 지워지는 버그 예방.
        res.clearCookie("sessionId", SESSION_COOKIE_OPTIONS);
        return res.json({ success: true, message: "로그아웃 완료" });
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
        // [추가 2026-05-10] /check-duplicate 는 database.fetchJson()을 거치지 않고
        // FastAPI를 직접 fetch 하므로, 여기서도 내부 인증 헤더를 반드시 붙인다.
        // 이유: FastAPI 전역 미들웨어가 X-Internal-Api-Key 없는 직접 호출을 차단하도록
        // 바뀌었기 때문에 중복체크만 403으로 깨지는 일을 막기 위함.
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
