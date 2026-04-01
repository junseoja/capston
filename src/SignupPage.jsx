import { useState } from 'react' //리액트의 useState 훅을 사용하여 상태 관리를 위해 import

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

function SignupPage({ onBackToLogin, onSignup, existingUsers = [] }) {
    const currentYear = new Date().getFullYear() // 현재 연도 계산
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i) // 100년 전부터 현재까지의 연도 배열 생성
    const months = Array.from({ length: 12 }, (_, i) => i + 1) // 1월부터 12월까지의 월 배열 생성

    const [selectedYear, setSelectedYear] = useState('') // 선택된 연도 상태 관리
    const [selectedMonth, setSelectedMonth] = useState('') // 선택된 월 상태 관리
    const [selectedDay, setSelectedDay] = useState('') // 선택된 일 상태 관리

    // 회원가입 입력값 전체 상태
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        email: '',
        gender: '',
    })

    // 각 입력칸 에러 메시지 저장
    const [fieldErrors, setFieldErrors] = useState({})

    // 아이디/닉네임 중복체크 상태 저장
    const [checkStatus, setCheckStatus] = useState({
        userId: { checked: false, message: '' },
        nickname: { checked: false, message: '' },
    })

    // 년, 월이 선택되면 해당 월의 마지막 날짜 계산
    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate() // 해당 월의 마지막 날짜 계산
            : 31

    const days = Array.from({ length: lastDay }, (_, i) => i + 1) // 1일부터 마지막 날짜까지의 일 배열 생성
    // 필드별 검사 함수 통합
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
    // 특정 칸에 에러 메시지 업데이트
    const updateFieldError = (fieldName, message) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: message,
        }));
    };
    
    // 입력값 변경 처리
    const handleInputChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

        // 입력 중이면 기존 에러 메시지 제거
        if (fieldErrors[fieldName]) {
            updateFieldError(fieldName, "");
        }

        // 비밀번호가 바뀌면 비밀번호 확인 에러도 초기화
        if (fieldName === "password" && fieldErrors.confirmPassword) {
            updateFieldError("confirmPassword", "");
        }

        // 아이디/닉네임을 수정하면 중복체크 다시 해야 하므로 초기화
        if (fieldName === "userId" || fieldName === "nickname") {
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
        }
    };
    // 입력창에 포커스가 빠질 떄 검사
    const handleBlur = (fieldName) => {
        updateFieldError(fieldName, validateField(fieldName));
    };

    //아이디 / 닉네임 중복체크 
    const handleDuplicateCheck = (fieldName) => {
        const value = formData[fieldName];
        const validationMessage = validateField(fieldName, value);

        //  형식이 틀리면 중복체크 전에 막기
        if (validationMessage) {
            updateFieldError(fieldName, validationMessage);
            setCheckStatus((prev) => ({
                ...prev,
                [fieldName]: { checked: false, message: "" },
            }));
            return;
        }

        const normalizedValue = value.trim().toLowerCase();

        const isDuplicate = existingUsers.some((user) => {
            const compareValue = fieldName === "userId" ? user.userId : user.nickname;
            return compareValue.toLowerCase() === normalizedValue;
        });

        if (isDuplicate) {
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
            return;
        }

        //  중복이 아니면 성공 상태 저장
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
    };

    const handleSubmit = (e) => {
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

        //  중복체크 안 했으면 제출 막기
        if (!checkStatus.userId.checked) {
            nextErrors.userId = nextErrors.userId || "아이디 중복체크를 완료하세요.";
        }

        if (!checkStatus.nickname.checked) {
            nextErrors.nickname =
                nextErrors.nickname || "닉네임 중복체크를 완료하세요.";
        }

        setFieldErrors(nextErrors);

        const hasError = Object.values(nextErrors).some(Boolean);
        if (hasError) return;

        const birth = `${selectedYear}-${String(selectedMonth).padStart(
            2,
            "0"
        )}-${String(selectedDay).padStart(2, "0")}`;

        // 최종 회원가입 데이터 전달
        onSignup({
            userId: formData.userId.trim(),
            password: formData.password,
            nickname: formData.nickname.trim(),
            email: formData.email.trim(),
            gender: formData.gender,
            birth,
        });
    };
    return (
        <div className="signup-container">
            <div className="signup-box">
                <h1 className="signup-title">회원가입</h1>
                <p className="login-subtitle">루틴 메이트와 함께 갓생을 시작해보세요</p>

                <form className="login-form signup-form">
                    <div className="form-group">
                        <label className="signup-label">아이디</label>
                        <div className="input-with-button">
                            <input type="text" placeholder="아이디를 입력하세요" />
                            <button type="button" className="check-btn">중복체크</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">비밀번호</label>
                        <input type="password" placeholder="비밀번호를 입력하세요" />
                    </div>

                    <div className="form-group">
                        <label className="signup-label">비밀번호 확인</label>
                        <input type="password" placeholder="비밀번호를 다시 입력하세요" />
                    </div>

                    <div className="form-group">
                        <label className="signup-label">닉네임</label>
                        <div className="input-with-button">
                            <input type="text" placeholder="닉네임을 입력하세요" />
                            <button type="button" className="check-btn">중복체크</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="signup-label">생년월일</label>
                        <div className="birth-row"> {/*생년월일 선택을 위한 드롭다운 메뉴*/}
                            <select
                                value={selectedYear} // 선택된 연도 값
                                onChange={(e) => { // 년이 변경되면 선택된 연도 상태 업데이트 및 일 선택 초기화
                                    setSelectedYear(e.target.value)
                                    setSelectedDay('')
                                }}
                            >
                                <option value="" hidden>년</option> {/* 기본 옵션으로 '년' 표시, 선택되지 않도록 hidden 속성 추가 */}
                                {years.map((year) => ( // 연도 배열을 순회하며 옵션 생성
                                    <option key={year} value={year}> {/* 옵션의 key와 value는 연도로 설정 */}
                                        {year} {/* 옵션으로 표시되는 텍스트는 연도 */}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value)
                                    setSelectedDay('')
                                }}
                            >
                                <option value="" hidden>월</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                            >
                                <option value="" hidden>일</option>
                                {days.map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">성별</label>
                        <select className="gender-select" defaultValue="">
                            <option value="" hidden>성별</option>
                            <option value="male">남</option>
                            <option value="female">여</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">이메일</label>
                        <input type="email" placeholder="이메일을 입력하세요" />
                    </div>

                    <button type="button">회원가입</button>
                </form>

                <p className="login-footer">
                    이미 회원이신가요? <span onClick={onBackToLogin}>로그인</span>
                </p>
            </div>
        </div>
    )
}

export default SignupPage

/* validateUserId
→ 아이디 규칙 검사
validateNickname
→ 닉네임 규칙 검사
validatePassword
→ 비밀번호 길이/조합 검사
validatePasswordConfirm
→ 비밀번호 확인 일치 검사
validateEmail
→ 이메일 형식 검사
validateField
→ 필드 이름에 따라 적절한 검사 함수 연결
updateFieldError
→ 특정 입력칸의 에러 메시지 갱신
handleInputChange
→ 입력값 변경 + 에러 초기화 + 중복체크 초기화
handleBlur
→ 입력창에서 나갈 때 즉시 검사
handleDuplicateCheck
→ 아이디/닉네임 중복체크
handleSubmit
→ 회원가입 버튼 눌렀을 때 전체 검사 후 부모로 데이터 전달
*/