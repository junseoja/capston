import { useState } from 'react'

function SignupPage({ onBackToLogin }) {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedDay, setSelectedDay] = useState('')

    const [id, setId] = useState('')
    const [password, setPassword] = useState('')
    const [passwordCheck, setPasswordCheck] = useState('')
    const [nickname, setNickname] = useState('')
    const [gender, setGender] = useState('')
    const [email, setEmail] = useState('')

    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate()
            : 31

    const days = Array.from({ length: lastDay }, (_, i) => i + 1)

    const handleSignup = async () => {
        if (!id || !password) {
            alert('아이디와 비밀번호를 입력하세요.')
            return
        }

        if (password !== passwordCheck) {
            alert('비밀번호 확인이 일치하지 않습니다.')
            return
        }

        try {
            const response = await fetch('http://localhost:3000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    id,
                    password,
                    nickname,
                    birth: {
                        year: selectedYear,
                        month: selectedMonth,
                        day: selectedDay,
                    },
                    gender,
                    email,
                }),
            })

            const result = await response.json()

            if (result.success) {
                alert('회원가입 성공')
                onBackToLogin()
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error(error)
            alert('서버 오류가 발생했습니다.')
        }
    }

    return (
        <div className="signup-container">
            <div className="signup-box">
                <h1 className="signup-title">회원가입</h1>
                <p className="login-subtitle">루틴 메이트와 함께 갓생을 시작해보세요</p>

                <form
                    className="login-form signup-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="form-group">
                        <label className="signup-label">아이디</label>
                        <div className="input-with-button">
                            <input
                                type="text"
                                placeholder="아이디를 입력하세요"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                            />
                            <button type="button" className="check-btn">중복체크</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="signup-label">비밀번호 확인</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={passwordCheck}
                            onChange={(e) => setPasswordCheck(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="signup-label">닉네임</label>
                        <div className="input-with-button">
                            <input
                                type="text"
                                placeholder="닉네임을 입력하세요"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                            <button type="button" className="check-btn">중복체크</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">생년월일</label>
                        <div className="birth-row">
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value)
                                    setSelectedDay('')
                                }}
                            >
                                <option value="" hidden>년</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
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
                        <select
                            className="gender-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                        >
                            <option value="" hidden>성별</option>
                            <option value="male">남</option>
                            <option value="female">여</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="signup-label">이메일</label>
                        <input
                            type="email"
                            placeholder="이메일을 입력하세요"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="button" onClick={handleSignup}>회원가입</button>
                </form>

                <p className="login-footer">
                    이미 회원이신가요? <span onClick={onBackToLogin}>로그인</span>
                </p>
            </div>
        </div>
    )
}

export default SignupPage