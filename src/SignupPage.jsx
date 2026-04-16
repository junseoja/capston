// ============================================================
// SignupPage.jsx - 회원가입 페이지 컴포넌트
// ============================================================
// 역할:
//   - 아이디/비밀번호/닉네임/생년월일/성별/이메일 입력 및 실시간 유효성 검사
//   - 아이디/닉네임 중복체크 (Express /check-duplicate API 호출)
//     NOTE: 현재 Express에 /check-duplicate 라우트가 미구현 상태 (버그)
//   - 모든 검사 통과 후 Express /signup API로 POST
//   - <form onSubmit> 구조로 버튼 클릭 및 Enter 키 모두 제출 가능
//
// Props:
//   onBackToLogin - 로그인 페이지로 이동 (App.jsx의 navigate("/login"))
//
// 유효성 검사 전략:
//   - 입력 중(onChange): 에러 메시지 즉시 제거 (사용자 불편 최소화)
//   - 포커스 아웃(onBlur): 해당 필드 유효성 검사 및 에러 표시
//   - 제출 시(onSubmit): 전체 필드 일괄 검사 후 에러 있으면 중단
//   - 중복체크(버튼 클릭): 로컬 검사 통과 시에만 API 호출
// ============================================================

import { useState } from 'react'

// ── 입력값 유효성 검사 정규식 ──────────────────────────────────────────────────

// 아이디: 영문 소문자(a-z) + 숫자(0-9)만 허용 (특수문자, 대문자 불허)
const ID_REGEX = /^[a-z0-9]+$/;

// 닉네임: 한글(가-힣), 영문(A-Za-z), 숫자(0-9)만 허용 (공백, 특수문자 불허)
const NICKNAME_REGEX = /^[A-Za-z0-9가-힣]+$/;

// 이메일: @와 . 이 포함된 기본 형식 검사 (공백 및 @ 중복 불허)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 특수문자 포함 여부 검사 (아래 특수문자 중 하나 이상 필요)
// [수정] 문자 클래스 내부에서 불필요한 escape를 제거하여 ESLint(no-useless-escape) 경고 해결
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

// ── 각 필드 유효성 검사 함수 ──────────────────────────────────────────────────
// 규칙: 유효하면 "" 반환, 오류 있으면 에러 메시지 문자열 반환

/**
 * validateUserId - 아이디 유효성 검사
 * 조건: 5~15자, 영문 소문자 + 숫자만 허용
 */
function validateUserId(userId) {
    const trimmedId = userId.trim();
    if (!trimmedId) return "아이디를 입력하세요.";
    if (trimmedId.length < 5 || trimmedId.length > 15) {
        return "아이디는 5자 이상 15자 이하로 입력하세요.";
    }
    if (!ID_REGEX.test(trimmedId)) {
        return "아이디는 영문 소문자와 숫자만 사용할 수 있습니다.";
    }
    return ""; // 유효
}

/**
 * validateNickname - 닉네임 유효성 검사
 * 조건: 2~10자, 한글/영문/숫자만 허용
 */
function validateNickname(nickname) {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) return "닉네임을 입력하세요.";
    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
        return "닉네임은 2자 이상 10자 이하로 입력하세요.";
    }
    if (!NICKNAME_REGEX.test(trimmedNickname)) {
        return "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.";
    }
    return "";
}

/**
 * validatePassword - 비밀번호 유효성 검사
 * 조건: 8~16자, 영문/숫자/특수문자 각 1개 이상 포함, 공백 불허
 */
function validatePassword(password) {
    if (!password) return "비밀번호를 입력하세요.";
    if (password.length < 8 || password.length > 16) {
        return "비밀번호는 8자 이상 16자 이하로 입력하세요.";
    }
    if (/\s/.test(password)) {
        return "비밀번호에는 공백을 사용할 수 없습니다.";
    }
    if (!/[A-Za-z]/.test(password)) {
        return "비밀번호에는 영문이 최소 1개 이상 포함되어야 합니다.";
    }
    if (!/\d/.test(password)) {
        return "비밀번호에는 숫자가 최소 1개 이상 포함되어야 합니다.";
    }
    if (!SPECIAL_CHAR_REGEX.test(password)) {
        return "비밀번호에는 특수문자가 최소 1개 이상 포함되어야 합니다.";
    }
    return "";
}

/**
 * validatePasswordConfirm - 비밀번호 확인 일치 여부 검사
 * @param {string} password        - 원본 비밀번호
 * @param {string} confirmPassword - 확인용 비밀번호
 */
function validatePasswordConfirm(password, confirmPassword) {
    if (!confirmPassword) return "비밀번호 확인을 입력하세요.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";
    return "";
}

/**
 * validateEmail - 이메일 형식 검사
 * 조건: @와 . 포함하는 기본 형식
 */
function validateEmail(email) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "이메일을 입력하세요.";
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return "올바른 이메일 형식으로 입력하세요.";
    }
    return "";
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

function SignupPage({ onBackToLogin }) {
    // 올해부터 100년 전까지 연도 배열 생성 (예: [2026, 2025, ..., 1926])
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1) // 1 ~ 12

    // 생년월일 - 년/월/일 분리 관리 (선택 순서에 따라 일수가 달라지기 때문)
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedDay, setSelectedDay] = useState('')

    // 폼 입력값 - 하나의 객체로 통합 관리 (handleInputChange에서 fieldName으로 업데이트)
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        gender: '',
    })

    // 각 필드별 에러 메시지 (빈 문자열이면 에러 없음, 있으면 에러 메시지 표시)
    const [fieldErrors, setFieldErrors] = useState({})

    // 아이디/닉네임 중복체크 완료 상태
    // checked: true → 중복체크 통과 → 제출 허용
    // checked: false → 미완료 또는 중복 발견 → 제출 차단
    const [checkStatus, setCheckStatus] = useState({
        userId: { checked: false, message: '' },
        nickname: { checked: false, message: '' },
    })

    // 선택된 년/월에 따라 해당 월의 일수 계산 (2월 윤년 등 자동 처리)
    // new Date(year, month, 0).getDate(): month가 1-based이므로 0일 = 전달 마지막 날
    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate()
            : 31
    const days = Array.from({ length: lastDay }, (_, i) => i + 1)

    // ── 유효성 검사 함수 ──────────────────────────────────────────────────────

    /**
     * validateField - 특정 필드의 유효성 검사 실행
     *
     * fieldValue 미전달 시 현재 formData 값으로 검사
     * (blur 이벤트에서 현재 값으로 검사할 때 사용)
     *
     * @param {string} fieldName  - 검사할 필드명
     * @param {string} fieldValue - 검사할 값 (미전달 시 formData[fieldName] 사용)
     * @returns {string} 에러 메시지 (없으면 "")
     */
    const validateField = (fieldName, fieldValue = formData[fieldName]) => {
        if (fieldName === "userId")          return validateUserId(fieldValue);
        if (fieldName === "password")        return validatePassword(fieldValue);
        if (fieldName === "confirmPassword") return validatePasswordConfirm(formData.password, fieldValue);
        if (fieldName === "nickname")        return validateNickname(fieldValue);
        if (fieldName === "email")           return validateEmail(fieldValue);
        if (fieldName === "birth") {
            // 년/월/일 모두 선택했는지 확인
            if (!selectedYear || !selectedMonth || !selectedDay) {
                return "생년월일을 모두 선택하세요.";
            }
            return "";
        }
        if (fieldName === "gender") {
            if (!formData.gender) return "성별을 선택하세요.";
            return "";
        }
        return "";
    };

    /**
     * updateFieldError - 특정 필드의 에러 메시지 업데이트
     * 빈 문자열 전달 시 에러 제거 (시각적으로 에러 메시지 숨김)
     */
    const updateFieldError = (fieldName, message) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: message,
        }));
    };

    // ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    /**
     * handleInputChange - 입력값 변경 핸들러
     *
     * 처리:
     *   1. formData 해당 필드 업데이트
     *   2. 입력 시작하면 기존 에러 메시지 즉시 제거 (UX 개선)
     *   3. 비밀번호 변경 시 비밀번호 확인 에러도 함께 제거
     *   4. 아이디/닉네임 변경 시 중복체크 상태 초기화 (다시 체크해야 함)
     */
    const handleInputChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

        // 해당 필드 에러 메시지 즉시 제거 (타이핑 시작하면 에러 숨김)
        if (fieldErrors[fieldName]) {
            updateFieldError(fieldName, "");
        }

        // 비밀번호 변경 시 비밀번호 확인 에러도 함께 제거
        // (비밀번호가 바뀌면 확인란도 다시 검사해야 하므로 에러 제거)
        if (fieldName === "password" && fieldErrors.confirmPassword) {
            updateFieldError("confirmPassword", "");
        }

        // 아이디/닉네임 값 변경 시 중복체크 상태 초기화
        // (값이 바뀌었으므로 이전 중복체크 결과는 무효)
        if (fieldName === "userId" || fieldName === "nickname") {
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
        }
    };

    /**
     * handleBlur - 포커스 아웃 시 해당 필드 유효성 검사
     * 탭이나 다른 요소 클릭으로 포커스가 이동할 때 즉시 검사 결과 표시
     */
    const handleBlur = (fieldName) => {
        updateFieldError(fieldName, validateField(fieldName));
    };

    /**
     * handleDuplicateCheck - 중복체크 버튼 클릭 핸들러
     *
     * 처리 순서:
     *   1. 로컬 유효성 검사 먼저 수행 (API 호출 최소화)
     *   2. 검사 통과 시 Express /check-duplicate API 호출
     *      NOTE: 현재 Express에 이 라우트가 미구현 (버그 - 구현 필요)
     *   3. 결과에 따라 에러 메시지 또는 성공 메시지 표시
     *
     * @param {"userId"|"nickname"} fieldName - 중복체크할 필드명
     */
    const handleDuplicateCheck = async (fieldName) => {
        const value = formData[fieldName];
        const validationMessage = validateField(fieldName, value);

        // 로컬 유효성 검사 실패 시 API 호출 없이 바로 에러 표시
        if (validationMessage) {
            updateFieldError(fieldName, validationMessage);
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
            return;
        }

        // Express /check-duplicate?field=userId&value=입력값
        // NOTE: 이 라우트가 Express에 구현되어야 동작함
        try {
            const response = await fetch(
                `http://localhost:3000/check-duplicate?field=${fieldName}&value=${value.trim()}`,
                { credentials: "include" }
            );
            const result = await response.json();

            if (result.isDuplicate) {
                // 중복 존재 → 에러 메시지 표시, checked = false (제출 차단)
                updateFieldError(
                    fieldName,
                    fieldName === "userId"
                        ? "이미 사용 중인 아이디입니다."
                        : "이미 사용 중인 닉네임입니다."
                );
                setCheckStatus((prev) => ({
                    ...prev,
                    [fieldName]: { checked: false, message: "" },
                }));
            } else {
                // 중복 없음 → 성공 메시지 표시, checked = true (제출 허용)
                updateFieldError(fieldName, "");
                setCheckStatus((prev) => ({
                    ...prev,
                    [fieldName]: {
                        checked: true, // 이 필드는 중복체크 완료
                        message:
                            fieldName === "userId"
                                ? "사용 가능한 아이디입니다."
                                : "사용 가능한 닉네임입니다.",
                    },
                }));
            }
        } catch (error) {
            console.error("중복체크 요청 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    /**
     * handleSubmit - 폼 제출 핸들러
     *
     * <form onSubmit>에 연결 → 버튼 클릭 및 Enter 키 모두 동작
     *
     * 처리 순서:
     *   1. e.preventDefault()로 페이지 이동 방지
     *   2. 전체 필드 일괄 유효성 검사
     *   3. 아이디/닉네임 중복체크 완료 여부 확인
     *   4. 에러가 하나라도 있으면 제출 중단 (setFieldErrors로 모든 에러 표시)
     *   5. 모두 통과 시 Express POST /signup 요청
     *   6. 성공 시 로그인 페이지로 이동
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // 브라우저 기본 폼 제출 동작(페이지 이동/새로고침) 방지

        // 전체 필드 일괄 유효성 검사 (제출 시 빠진 항목 모두 표시)
        const nextErrors = {
            userId: validateField("userId"),
            password: validateField("password"),
            confirmPassword: validateField("confirmPassword"),
            nickname: validateField("nickname"),
            email: validateField("email"),
            birth: validateField("birth"),
            gender: validateField("gender"),
        };

        // 중복체크 미완료 시 에러 추가 (기존 유효성 에러가 없는 경우에만)
        if (!checkStatus.userId.checked) {
            nextErrors.userId = nextErrors.userId || "아이디 중복체크를 완료하세요.";
        }
        if (!checkStatus.nickname.checked) {
            nextErrors.nickname = nextErrors.nickname || "닉네임 중복체크를 완료하세요.";
        }

        // 모든 에러를 한 번에 상태 업데이트 (리렌더 최소화)
        setFieldErrors(nextErrors);

        // 에러가 하나라도 있으면 제출 중단
        // Object.values로 에러 메시지 배열 추출 → some(Boolean)으로 비어있지 않은 값 확인
        const hasError = Object.values(nextErrors).some(Boolean);
        if (hasError) return;

        // Express POST /signup 요청
        try {
            const response = await fetch("http://localhost:3000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    id: formData.userId.trim(),
                    password: formData.password,
                    nickname: formData.nickname.trim(),
                    email: formData.email.trim(),
                    // 성별: HTML option value(영문) → DB ENUM 값(한글)으로 변환
                    gender: formData.gender === "male" ? "남"
                           : formData.gender === "female" ? "여"
                           : "기타",
                    // 생년월일: Express에서 "YYYY-MM-DD" 형식으로 조합
                    birth: {
                        year: selectedYear,
                        month: selectedMonth,
                        day: selectedDay,
                    },
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert("회원가입 성공!");
                onBackToLogin(); // 로그인 페이지("/login")으로 이동
            } else {
                // 서버에서 내려준 에러 메시지 표시 (예: 중복 아이디)
                alert(result.message || "회원가입 실패");
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="signup-container">
            <div className="signup-box">
                <h1 className="signup-title">회원가입</h1>
                <p className="login-subtitle">루틴 메이트와 함께 갓생을 시작해보세요</p>

                {/* onSubmit: Enter 키 입력 또는 type="submit" 버튼 클릭 시 handleSubmit 실행 */}
                <form className="login-form signup-form" onSubmit={handleSubmit}>

                    {/* ── 아이디 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">아이디</label>
                            {/* 에러 메시지 우선 표시, 없으면 중복체크 성공 메시지 표시 */}
                            {fieldErrors.userId ? (
                                <span className="signup-error">{fieldErrors.userId}</span>
                            ) : checkStatus.userId.checked ? (
                                <span className="signup-success">{checkStatus.userId.message}</span>
                            ) : null}
                        </div>
                        <div className="input-with-button">
                            <input
                                type="text"
                                placeholder="5~15자 영문 소문자, 숫자"
                                value={formData.userId}
                                onChange={(e) => handleInputChange("userId", e.target.value)}
                                onBlur={() => handleBlur("userId")}
                                maxLength={15} // 브라우저 레벨 최대 길이 제한
                                className={fieldErrors.userId ? "input-error" : ""}
                            />
                            {/* 중복체크 완료 시 버튼 스타일 변경 (check-btn-success) */}
                            <button
                                type="button" // form 제출 방지 (type="submit"이 기본값)
                                className={`check-btn ${checkStatus.userId.checked ? "check-btn-success" : ""}`}
                                onClick={() => handleDuplicateCheck("userId")}
                            >
                                중복체크
                            </button>
                        </div>
                        <p className="signup-hint">특수문자와 대문자는 사용할 수 없습니다.</p>
                    </div>

                    {/* ── 비밀번호 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">비밀번호</label>
                            {fieldErrors.password && (
                                <span className="signup-error">{fieldErrors.password}</span>
                            )}
                        </div>
                        <input
                            type="password"
                            placeholder="8~16자 영문, 숫자, 특수문자 조합"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            onBlur={() => handleBlur("password")}
                            maxLength={16}
                            className={fieldErrors.password ? "input-error" : ""}
                        />
                    </div>

                    {/* ── 비밀번호 확인 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">비밀번호 확인</label>
                            {fieldErrors.confirmPassword && (
                                <span className="signup-error">{fieldErrors.confirmPassword}</span>
                            )}
                        </div>
                        <input
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            onBlur={() => handleBlur("confirmPassword")}
                            maxLength={16}
                            className={fieldErrors.confirmPassword ? "input-error" : ""}
                        />
                    </div>

                    {/* ── 닉네임 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">닉네임</label>
                            {fieldErrors.nickname ? (
                                <span className="signup-error">{fieldErrors.nickname}</span>
                            ) : checkStatus.nickname.checked ? (
                                <span className="signup-success">{checkStatus.nickname.message}</span>
                            ) : null}
                        </div>
                        <div className="input-with-button">
                            <input
                                type="text"
                                placeholder="2~10자 한글, 영문, 숫자"
                                value={formData.nickname}
                                onChange={(e) => handleInputChange("nickname", e.target.value)}
                                onBlur={() => handleBlur("nickname")}
                                maxLength={10}
                                className={fieldErrors.nickname ? "input-error" : ""}
                            />
                            <button
                                type="button"
                                className={`check-btn ${checkStatus.nickname.checked ? "check-btn-success" : ""}`}
                                onClick={() => handleDuplicateCheck("nickname")}
                            >
                                중복체크
                            </button>
                        </div>
                        <p className="signup-hint">공백과 특수문자는 사용할 수 없습니다.</p>
                    </div>

                    {/* ── 생년월일 필드 (년/월/일 3개 select) ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">생년월일</label>
                            {fieldErrors.birth && (
                                <span className="signup-error">{fieldErrors.birth}</span>
                            )}
                        </div>
                        <div className="birth-row">
                            {/* 년도 선택: 변경 시 일(day) 초기화 (월별 일수 재계산) */}
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value)
                                    setSelectedDay('') // 년도 변경 시 일 초기화
                                    if (fieldErrors.birth) updateFieldError("birth", "")
                                }}
                                className={fieldErrors.birth ? "input-error" : ""}
                            >
                                <option value="" hidden>년</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* 월 선택: 변경 시 일(day) 초기화 (해당 월의 일수 재계산) */}
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value)
                                    setSelectedDay('') // 월 변경 시 일 초기화
                                    if (fieldErrors.birth) updateFieldError("birth", "")
                                }}
                                className={fieldErrors.birth ? "input-error" : ""}
                            >
                                <option value="" hidden>월</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>

                            {/* 일 선택: 선택된 년/월에 따라 lastDay가 자동 계산됨 */}
                            <select
                                value={selectedDay}
                                onChange={(e) => {
                                    setSelectedDay(e.target.value)
                                    if (fieldErrors.birth) updateFieldError("birth", "")
                                }}
                                className={fieldErrors.birth ? "input-error" : ""}
                            >
                                <option value="" hidden>일</option>
                                {days.map((day) => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── 성별 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">성별</label>
                            {fieldErrors.gender && (
                                <span className="signup-error">{fieldErrors.gender}</span>
                            )}
                        </div>
                        {/* option value는 영문(male/female), 제출 시 한글("남"/"여")로 변환 */}
                        <select
                            className={`gender-select ${fieldErrors.gender ? "input-error" : ""}`}
                            value={formData.gender}
                            onChange={(e) => handleInputChange("gender", e.target.value)}
                            onBlur={() => handleBlur("gender")}
                        >
                            <option value="" hidden>성별</option>
                            <option value="male">남</option>
                            <option value="female">여</option>
                        </select>
                    </div>

                    {/* ── 이메일 필드 ── */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">이메일</label>
                            {fieldErrors.email && (
                                <span className="signup-error">{fieldErrors.email}</span>
                            )}
                        </div>
                        <input
                            type="email"   // 브라우저 기본 이메일 형식 검사 추가
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            onBlur={() => handleBlur("email")}
                            maxLength={50}
                            className={fieldErrors.email ? "input-error" : ""}
                        />
                    </div>

                    {/* 제출 버튼: type="submit" → form의 onSubmit 실행 */}
                    <button type="submit">회원가입</button>
                </form>

                {/* 이미 회원이면 로그인 페이지로 이동 */}
                <p className="login-footer">
                    이미 회원이신가요?{" "}
                    <span onClick={onBackToLogin} style={{ cursor: "pointer" }}>
                        로그인
                    </span>
                </p>
            </div>
        </div>
    )
}

export default SignupPage
