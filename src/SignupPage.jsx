import { useState } from 'react' // 리액트의 useState 훅을 사용하여 상태 관리를 위해 import

// 검사용 정규식 및 함수
// 아이디: 영문 소문자 + 숫자만 허용
const ID_REGEX = /^[a-z0-9]+$/;

// 닉네임: 한글, 영문, 숫자만 허용
const NICKNAME_REGEX = /^[A-Za-z0-9가-힣]+$/;

// 이메일 형식 검사
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 특수문자 검사
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/;

// 아이디 검사 함수
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

// 닉네임 검사 함수
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

// 비밀번호 검사 함수
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

// 비밀번호 확인 검사 함수
function validatePasswordConfirm(password, confirmPassword) {
    if (!confirmPassword) return "비밀번호 확인을 입력하세요.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";
    return "";
}

// 이메일 검사 함수
function validateEmail(email) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "이메일을 입력하세요.";
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return "올바른 이메일 형식으로 입력하세요.";
    }
    return "";
}

function SignupPage({ onBackToLogin }) {
    // ✅ onSignup 제거 - 직접 fetch 처리로 변경
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedDay, setSelectedDay] = useState('')

    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        gender: '',
    })

    const [fieldErrors, setFieldErrors] = useState({})

    const [checkStatus, setCheckStatus] = useState({
        userId: { checked: false, message: '' },
        nickname: { checked: false, message: '' },
    })

    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate()
            : 31

    const days = Array.from({ length: lastDay }, (_, i) => i + 1)

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

    const updateFieldError = (fieldName, message) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: message,
        }));
    };

    const handleInputChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

        if (fieldErrors[fieldName]) {
            updateFieldError(fieldName, "");
        }

        if (fieldName === "password" && fieldErrors.confirmPassword) {
            updateFieldError("confirmPassword", "");
        }

        if (fieldName === "userId" || fieldName === "nickname") {
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
        }
    };

    const handleBlur = (fieldName) => {
        updateFieldError(fieldName, validateField(fieldName));
    };

    const handleDuplicateCheck = async (fieldName) => {
        // ✅ async 추가 - 백엔드로 중복체크 요청
        const value = formData[fieldName];
        const validationMessage = validateField(fieldName, value);

        if (validationMessage) {
            updateFieldError(fieldName, validationMessage);
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
            return;
        }

        // ✅ 변경 - 백엔드로 중복체크 요청
        try {
            const response = await fetch(
                `http://localhost:3000/check-duplicate?field=${fieldName}&value=${value.trim()}`,
                { credentials: "include" }
            );
            const result = await response.json();

            if (result.isDuplicate) {
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
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    const handleSubmit = async (e) => {
        // ✅ async 추가 - 백엔드로 회원가입 요청
        e.preventDefault();

        const nextErrors = {
            userId: validateField("userId"),
            password: validateField("password"),
            confirmPassword: validateField("confirmPassword"),
            nickname: validateField("nickname"),
            email: validateField("email"),
            birth: validateField("birth"),
            gender: validateField("gender"),
        };

        if (!checkStatus.userId.checked) {
            nextErrors.userId = nextErrors.userId || "아이디 중복체크를 완료하세요.";
        }
        if (!checkStatus.nickname.checked) {
            nextErrors.nickname = nextErrors.nickname || "닉네임 중복체크를 완료하세요.";
        }

        setFieldErrors(nextErrors);
        const hasError = Object.values(nextErrors).some(Boolean);
        if (hasError) return;

        // ✅ 추가 - 백엔드로 회원가입 요청
        try {
            const response = await fetch("http://localhost:3000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 쿠키 포함
                body: JSON.stringify({
                    id: formData.userId.trim(),
                    password: formData.password,
                    nickname: formData.nickname.trim(),
                    email: formData.email.trim(),
                    // ✅ 추가 - male/female → 남/여 변환 (DB ENUM 형식에 맞게)
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