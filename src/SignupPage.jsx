// 회원가입 페이지 컴포넌트
// - 아이디/비밀번호/닉네임/생년월일/성별/이메일 입력 및 유효성 검사
// - 아이디/닉네임 중복체크 (Express /check-duplicate API 호출)
// - 모든 검사 통과 후 Express /signup API로 POST
// - 폼 제출은 버튼 클릭 및 Enter 키 모두 동작 (<form onSubmit> 구조)

import { useState } from 'react'

// ── 입력값 유효성 검사 정규식 ──────────────────────────────────────────────
const ID_REGEX = /^[a-z0-9]+$/;                          // 아이디: 영문 소문자 + 숫자만 허용
const NICKNAME_REGEX = /^[A-Za-z0-9가-힣]+$/;            // 닉네임: 한글, 영문, 숫자만 허용
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;        // 이메일: @와 . 포함 기본 형식 검사
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/; // 비밀번호 특수문자 포함 여부

// ── 각 필드 유효성 검사 함수 ───────────────────────────────────────────────
// 유효하면 "" 반환, 에러 있으면 에러 메시지 반환

// 아이디: 5~15자, 영문 소문자 + 숫자만
function validateUserId(userId) {
    const trimmedId = userId.trim();
    if (!trimmedId) return "아이디를 입력하세요.";
    if (trimmedId.length < 5 || trimmedId.length > 15) {
        return "아이디는 5자 이상 15자 이하로 입력하세요.";
    }
    if (!ID_REGEX.test(trimmedId)) {
        return "아이디는 영문 소문자와 숫자만 사용할 수 있습니다.";
    }
    return "";
}

// 닉네임: 2~10자, 한글/영문/숫자만
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

// 비밀번호: 8~16자, 영문/숫자/특수문자 각 1개 이상, 공백 불허
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

// 비밀번호 확인: password와 confirmPassword 일치 여부
function validatePasswordConfirm(password, confirmPassword) {
    if (!confirmPassword) return "비밀번호 확인을 입력하세요.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";
    return "";
}

// 이메일: 기본 형식 검사 (@, . 포함)
function validateEmail(email) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "이메일을 입력하세요.";
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return "올바른 이메일 형식으로 입력하세요.";
    }
    return "";
}

// props:
//   onBackToLogin - 로그인 페이지로 이동 (App.jsx의 navigate("/login"))
function SignupPage({ onBackToLogin }) {
    const currentYear = new Date().getFullYear()
    // 선택 옵션 배열 생성
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i) // 올해부터 100년 전까지
    const months = Array.from({ length: 12 }, (_, i) => i + 1)            // 1 ~ 12

    // 생년월일 선택 상태 (년/월/일 분리 관리)
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedDay, setSelectedDay] = useState('')

    // 폼 입력값 상태 (한 객체로 통합 관리)
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        gender: '',
    })

    // 각 필드별 에러 메시지 상태 (빈 문자열이면 에러 없음)
    const [fieldErrors, setFieldErrors] = useState({})

    // 아이디/닉네임 중복체크 완료 상태
    // checked: true여야 최종 제출 가능
    const [checkStatus, setCheckStatus] = useState({
        userId: { checked: false, message: '' },
        nickname: { checked: false, message: '' },
    })

    // 선택된 년/월에 따라 일수 계산 (예: 2월은 28 or 29일)
    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate() // month는 1-based이므로 0일 = 전달 마지막 날
            : 31

    const days = Array.from({ length: lastDay }, (_, i) => i + 1)

    // 특정 필드의 유효성 검사 실행 → 에러 메시지 반환
    // fieldValue 미전달 시 현재 formData 값으로 검사
    const validateField = (fieldName, fieldValue = formData[fieldName]) => {
        if (fieldName === "userId") return validateUserId(fieldValue);
        if (fieldName === "password") return validatePassword(fieldValue);
        if (fieldName === "confirmPassword") {
            return validatePasswordConfirm(formData.password, fieldValue);
        }
        if (fieldName === "nickname") return validateNickname(fieldValue);
        if (fieldName === "email") return validateEmail(fieldValue);
        if (fieldName === "birth") {
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

    // 특정 필드의 에러 메시지 업데이트 (빈 문자열이면 에러 제거)
    const updateFieldError = (fieldName, message) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: message,
        }));
    };

    // 입력값 변경 핸들러
    // - formData 업데이트
    // - 입력 중 기존 에러 메시지 제거
    // - 아이디/닉네임 변경 시 중복체크 상태 초기화 (다시 체크해야 함)
    const handleInputChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

        // 해당 필드 에러 메시지 즉시 제거 (입력 시작하면 에러 숨김)
        if (fieldErrors[fieldName]) {
            updateFieldError(fieldName, "");
        }

        // 비밀번호 변경 시 비밀번호 확인 에러도 함께 제거
        if (fieldName === "password" && fieldErrors.confirmPassword) {
            updateFieldError("confirmPassword", "");
        }

        // 아이디/닉네임 값 변경 시 중복체크 초기화 (다시 중복체크 필요)
        if (fieldName === "userId" || fieldName === "nickname") {
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
        }
    };

    // 포커스 아웃(blur) 시 해당 필드 유효성 검사 실행 → 에러 메시지 표시
    const handleBlur = (fieldName) => {
        updateFieldError(fieldName, validateField(fieldName));
    };

    // 중복체크 버튼 핸들러
    // 1. 로컬 유효성 검사 먼저 수행
    // 2. 통과 시 Express /check-duplicate API 호출
    // 3. 결과에 따라 에러 메시지 또는 성공 메시지 표시
    const handleDuplicateCheck = async (fieldName) => {
        const value = formData[fieldName];
        const validationMessage = validateField(fieldName, value);

        // 로컬 유효성 검사 실패 시 API 호출 안 함
        if (validationMessage) {
            updateFieldError(fieldName, validationMessage);
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
            return;
        }

        // Express /check-duplicate?field=userId&value=입력값
        try {
            const response = await fetch(
                `http://localhost:3000/check-duplicate?field=${fieldName}&value=${value.trim()}`,
                { credentials: "include" }
            );
            const result = await response.json();

            if (result.isDuplicate) {
                // 중복 존재 → 에러 메시지 표시, 중복체크 상태 초기화
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
                // 중복 없음 → 성공 메시지 표시, checked: true (제출 허용)
                updateFieldError(fieldName, "");
                setCheckStatus((prev) => ({
                    ...prev,
                    [fieldName]: {
                        checked: true,
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

    // 폼 제출 핸들러 (<form onSubmit> → 버튼 클릭 및 Enter 키 모두 동작)
    // 1. 전체 필드 유효성 검사
    // 2. 중복체크 완료 여부 확인
    // 3. 모두 통과 시 Express /signup POST
    const handleSubmit = async (e) => {
        e.preventDefault(); // 폼 기본 제출 동작(페이지 이동) 방지

        // 전체 필드 일괄 유효성 검사
        const nextErrors = {
            userId: validateField("userId"),
            password: validateField("password"),
            confirmPassword: validateField("confirmPassword"),
            nickname: validateField("nickname"),
            email: validateField("email"),
            birth: validateField("birth"),
            gender: validateField("gender"),
        };

        // 중복체크 미완료 시 에러 추가
        if (!checkStatus.userId.checked) {
            nextErrors.userId = nextErrors.userId || "아이디 중복체크를 완료하세요.";
        }
        if (!checkStatus.nickname.checked) {
            nextErrors.nickname = nextErrors.nickname || "닉네임 중복체크를 완료하세요.";
        }

        setFieldErrors(nextErrors);

        // 에러가 하나라도 있으면 제출 중단
        const hasError = Object.values(nextErrors).some(Boolean);
        if (hasError) return;

        // Express /signup POST 요청
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
                    // DB ENUM("남","여","기타")에 맞게 변환
                    gender: formData.gender === "male" ? "남" : formData.gender === "female" ? "여" : "기타",
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
                onBackToLogin(); // 로그인 페이지로 이동
            } else {
                alert(result.message || "회원가입 실패");
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-box">
                <h1 className="signup-title">회원가입</h1>
                <p className="login-subtitle">루틴 메이트와 함께 갓생을 시작해보세요</p>

                <form className="login-form signup-form" onSubmit={handleSubmit}>
                    {/* 아이디 */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">아이디</label>
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
                                maxLength={15}
                                className={fieldErrors.userId ? "input-error" : ""}
                            />
                            <button
                                type="button"
                                className={`check-btn ${checkStatus.userId.checked ? "check-btn-success" : ""}`}
                                onClick={() => handleDuplicateCheck("userId")}
                            >
                                중복체크
                            </button>
                        </div>
                        <p className="signup-hint">특수문자와 대문자는 사용할 수 없습니다.</p>
                    </div>

                    {/* 비밀번호 */}
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

                    {/* 비밀번호 확인 */}
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

                    {/* 닉네임 */}
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

                    {/* 생년월일 */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">생년월일</label>
                            {fieldErrors.birth && (
                                <span className="signup-error">{fieldErrors.birth}</span>
                            )}
                        </div>
                        <div className="birth-row">
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value)
                                    setSelectedDay('')
                                    if (fieldErrors.birth) updateFieldError("birth", "")
                                }}
                                className={fieldErrors.birth ? "input-error" : ""}
                            >
                                <option value="" hidden>년</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value)
                                    setSelectedDay('')
                                    if (fieldErrors.birth) updateFieldError("birth", "")
                                }}
                                className={fieldErrors.birth ? "input-error" : ""}
                            >
                                <option value="" hidden>월</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
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

                    {/* 성별 */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">성별</label>
                            {fieldErrors.gender && (
                                <span className="signup-error">{fieldErrors.gender}</span>
                            )}
                        </div>
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

                    {/* 이메일 */}
                    <div className="form-group">
                        <div className="signup-label-row">
                            <label className="signup-label">이메일</label>
                            {fieldErrors.email && (
                                <span className="signup-error">{fieldErrors.email}</span>
                            )}
                        </div>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            onBlur={() => handleBlur("email")}
                            maxLength={50}
                            className={fieldErrors.email ? "input-error" : ""}
                        />
                    </div>

                    <button type="submit">회원가입</button>
                </form>

                <p className="login-footer">
                    이미 회원이신가요? <span onClick={onBackToLogin}>로그인</span>
                </p>
            </div>
        </div>
    )
}

export default SignupPage