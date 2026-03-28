import { useState } from 'react'

function HomePage({ routines, onCompleteCheck, onCompleteDetail }) {
  const today = new Date()
  const dayIndex = today.getDay()
  const date = today.getDate()
  const days = ['일', '월', '화', '수', '목', '금', '토']

  const [time, setTime] = useState('morning')
  const [proofInputs, setProofInputs] = useState({})
  const [openProofId, setOpenProofId] = useState(null)

  const filteredRoutines = routines.filter((routine) => routine.time === time)

  const getTimeTitle = () => {
    if (time === 'morning') {
      return {
        title: '🌅 아침 루틴',
        range: '06:00 ~ 11:59',
      }
    }

    if (time === 'lunch') {
      return {
        title: '🍱 점심 루틴',
        range: '12:00 ~ 17:59',
      }
    }

    return {
      title: '🌙 저녁 루틴',
      range: '18:00 ~ 05:59',
    }
  }

  const getModeText = (mode) => {
    return mode === 'check' ? '체크 루틴' : '상세 루틴'
  }

  const handleProofChange = (id, value) => {
    setProofInputs((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleDetailSubmit = (id) => {
    const proofText = proofInputs[id]?.trim()

    if (!proofText) {
      alert('인증 내용을 입력해주세요.')
      return
    }

    onCompleteDetail(id, proofText)
    setOpenProofId(null)
  }

  const currentSection = getTimeTitle()

  return (
    <div className="home">
      <div className="week">
        {days.map((day, index) => (
          <div
            key={index}
            className={index === dayIndex ? 'day active' : 'day'}
          >
            <p>{day}</p>
            <p>{date - dayIndex + index}</p>
          </div>
        ))}
      </div>

      <div className="time-tabs">
        <button
          className={time === 'morning' ? 'active-time-tab' : ''}
          onClick={() => setTime('morning')}
        >
          아침
        </button>
        <button
          className={time === 'lunch' ? 'active-time-tab' : ''}
          onClick={() => setTime('lunch')}
        >
          점심
        </button>
        <button
          className={time === 'dinner' ? 'active-time-tab' : ''}
          onClick={() => setTime('dinner')}
        >
          저녁
        </button>
      </div>

      <div className="routine-content">
        <h2 className="home-section-title">
          {currentSection.title}
          <span className="home-section-time"> {currentSection.range}</span>
        </h2>

        {filteredRoutines.length === 0 ? (
          <p className="empty-routine-text">이 시간대에 등록된 루틴이 아직 없어요.</p>
        ) : (
          <div className="home-routine-list">
            {filteredRoutines.map((routine) => (
              <div
                className={`home-routine-card ${routine.completed ? 'home-routine-card-completed' : ''}`}
                key={routine.id}
              >
                <div className="home-routine-card-left">
                  <div className="home-routine-card-top">
                    <h3>{routine.title}</h3>
                    <span className="home-routine-badge">{routine.category}</span>
                  </div>

                  <p className="home-routine-type">
                    {getModeText(routine.routineMode)}
                  </p>

                  <p className="home-routine-desc">
                    {routine.description || '루틴 설명이 아직 없습니다.'}
                  </p>

                  <div className="home-routine-meta">
                    {routine.goal && <span>{routine.goal}</span>}
                    {routine.repeat && <span>{routine.repeat}</span>}
                  </div>
                </div>

                <div className="home-routine-card-right">
                  {routine.completed ? (
                    <div className="home-complete-box">
                      <p className="home-complete-text">
                        완료 시간: {routine.completedAt}
                      </p>
                      {routine.proofText && (
                        <p className="home-proof-text">
                          인증 내용: {routine.proofText}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {routine.routineMode === 'check' ? (
                        <button
                          className="routine-check-btn home-action-btn"
                          onClick={() => onCompleteCheck(routine.id)}
                        >
                          오늘 완료
                        </button>
                      ) : (
                        <div className="home-detail-action">
                          <button
                            className="routine-detail-btn home-action-btn"
                            onClick={() =>
                              setOpenProofId(
                                openProofId === routine.id ? null : routine.id
                              )
                            }
                          >
                            인증하기
                          </button>

                          {openProofId === routine.id && (
                            <div className="proof-box">
                              <textarea
                                placeholder="오늘 어떻게 실천했는지 적어주세요"
                                value={proofInputs[routine.id] || ''}
                                onChange={(e) =>
                                  handleProofChange(routine.id, e.target.value)
                                }
                              ></textarea>
                              <button
                                className="proof-save-btn"
                                onClick={() => handleDetailSubmit(routine.id)}
                              >
                                인증 완료
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage