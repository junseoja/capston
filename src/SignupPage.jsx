import { useState } from 'react' //리액트의 useState 훅을 사용하여 상태 관리를 위해 import

function SignupPage({ onBackToLogin }) {
    const currentYear = new Date().getFullYear() // 현재 연도 계산
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i) // 100년 전부터 현재까지의 연도 배열 생성
    const months = Array.from({ length: 12 }, (_, i) => i + 1) // 1월부터 12월까지의 월 배열 생성

    const [selectedYear, setSelectedYear] = useState('') // 선택된 연도 상태 관리
    const [selectedMonth, setSelectedMonth] = useState('') // 선택된 월 상태 관리
    const [selectedDay, setSelectedDay] = useState('') // 선택된 일 상태 관리

    // 년, 월이 선택되면 해당 월의 마지막 날짜 계산
    const lastDay =
        selectedYear && selectedMonth
            ? new Date(selectedYear, selectedMonth, 0).getDate() // 해당 월의 마지막 날짜 계산
            : 31

    const days = Array.from({ length: lastDay }, (_, i) => i + 1) // 1일부터 마지막 날짜까지의 일 배열 생성

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