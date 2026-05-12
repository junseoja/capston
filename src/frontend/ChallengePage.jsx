import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 나중에 백엔드 API와 연결할 때 이 서비스 객체만 교체하면 됩니다.
 *
 * 예상 API:
 * - GET /challenge
 * - GET /challenge/my
 * - POST /challenge/:challengeId/join
 * - GET /challenge/:challengeId
 * - POST /challenge/:challengeId/proof
 */
const mockChallenges = [
  {
    id: 1,
    title: "7일 미라클 모닝 챌린지",
    description: "매일 아침 정해진 시간에 일어나 하루를 시작하는 챌린지입니다.",
    category: "미라클 모닝",
    startDate: "2026-05-10",
    endDate: "2026-05-16",
    participants: 42,
    totalDays: 7,
  },
  {
    id: 2,
    title: "하루 30분 운동 챌린지",
    description: "매일 30분 이상 운동하며 건강한 습관을 만드는 챌린지입니다.",
    category: "운동",
    startDate: "2026-05-10",
    endDate: "2026-05-30",
    participants: 108,
    totalDays: 21,
  },
  {
    id: 3,
    title: "물 2L 마시기 챌린지",
    description:
      "매일 충분한 수분을 섭취하며 생활 습관을 개선하는 챌린지입니다.",
    category: "건강",
    startDate: "2026-05-12",
    endDate: "2026-05-25",
    participants: 67,
    totalDays: 14,
  },
  {
    id: 4,
    title: "하루 1시간 집중 공부 챌린지",
    description:
      "매일 1시간 이상 집중해서 공부하는 습관을 만드는 챌린지입니다.",
    category: "공부",
    startDate: "2026-05-11",
    endDate: "2026-05-24",
    participants: 89,
    totalDays: 14,
  },
];

const mockJoinedChallenges = [
  {
    id: 1,
    totalDays: 7,
  },
];

// 챌린지 인증 내역 mock 데이터
// 진행도는 이 인증 내역 개수를 기준으로 계산하도록 변경합니다.
const mockChallengeProofs = [
  {
    id: 101,
    challengeId: 1,
    content: "오늘 아침 7시에 기상해서 스트레칭까지 완료했습니다.",
    files: [],
    createdAt: "2026-05-10T07:10:00",
  },
  {
    id: 102,
    challengeId: 1,
    content: "둘째 날도 같은 시간에 일어나서 독서 20분을 했습니다.",
    files: [],
    createdAt: "2026-05-11T07:05:00",
  },
  {
    id: 103,
    challengeId: 1,
    content: "오늘도 미라클 모닝 성공! 산책까지 마쳤습니다.",
    files: [],
    createdAt: "2026-05-12T07:02:00",
  },
];

const challengeService = {
  async fetchChallenges() {
    // TODO: 백엔드 연결 시 GET /challenge 호출
    return mockChallenges;
  },

  async fetchMyChallenges() {
    // TODO: 백엔드 연결 시 GET /challenge/my 호출
    return mockJoinedChallenges;
  },

  async fetchChallengeProofs() {
    // TODO: 백엔드 연결 시 GET /challenge/:challengeId/proofs 호출 또는
    // 사용자 참여 챌린지 인증 내역 API로 대체
    return mockChallengeProofs;
  },

  async joinChallenge(challenge) {
    // TODO: 백엔드 연결 시 POST /challenge/:challengeId/join 호출
    return {
      id: challenge.id,
      totalDays: challenge.totalDays,
    };
  },

  async submitChallengeProof(proofPayload) {
    // TODO: 백엔드 연결 시 POST /challenge/:challengeId/proof 로 FormData 전송
    return proofPayload;
  },
};

const formatChallengeDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const formatChallengeDateTime = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

// 홈의 루틴 완료 판정처럼 "오늘" 기준을 로컬 날짜로 맞추기 위한 helper
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 완료 시간 표시용 helper (홈의 completedAt 느낌을 맞추기 위함)
const formatChallengeCompletedTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const calculateProgressRate = (completedDays, totalDays) => {
  if (!totalDays) return 0;
  return Math.round((completedDays / totalDays) * 100);
};

function ChallengePage() {
  const [allChallenges, setAllChallenges] = useState([]);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  // 챌린지 인증 업로드용 상태
  const [selectedProofChallenge, setSelectedProofChallenge] = useState(null);
  const [challengeProofText, setChallengeProofText] = useState("");
  const [challengeProofFiles, setChallengeProofFiles] = useState([]);
  const [challengeProofs, setChallengeProofs] = useState([]);

  // draft 미리보기 URL 정리용 ref
  const challengeProofObjectUrlsRef = useRef([]);

  useEffect(() => {
    const initializeChallenges = async () => {
      const [challengeList, myJoinedList, proofList] = await Promise.all([
        challengeService.fetchChallenges(),
        challengeService.fetchMyChallenges(),
        challengeService.fetchChallengeProofs(),
      ]);

      setAllChallenges(challengeList);
      setJoinedChallenges(myJoinedList);
      setChallengeProofs(proofList);

      const initialSelectedId =
        myJoinedList[0]?.id ?? challengeList[0]?.id ?? null;

      setSelectedChallengeId(initialSelectedId);
    };

    initializeChallenges();
  }, []);

  useEffect(() => {
    // 컴포넌트가 사라질 때 생성한 preview URL 정리
    return () => {
      challengeProofObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const isJoinedChallenge = (challengeId) => {
    return joinedChallenges.some((challenge) => challenge.id === challengeId);
  };

  // 특정 챌린지의 "오늘 인증한 내역" 1개를 찾아 반환
  // 나중에 백엔드 연결 시 proofDate를 내려주면 createdAt fallback 없이 그대로 비교하면 됩니다.
  const getTodayChallengeProof = (challengeId) => {
    const today = getLocalDateString();

    return (
      challengeProofs.find((proof) => {
        const proofDate =
          proof.proofDate || getLocalDateString(new Date(proof.createdAt));

        return proof.challengeId === challengeId && proofDate === today;
      }) || null
    );
  };

  // 오늘 이미 인증했는지 true/false로 판단
  const hasTodayChallengeProof = (challengeId) => {
    return Boolean(getTodayChallengeProof(challengeId));
  };

  const getCompletedDaysByProofs = (challengeId, totalDays) => {
    const proofCount = challengeProofs.filter(
      (proof) => proof.challengeId === challengeId,
    ).length;

    // completedDays가 totalDays를 넘지 않도록 제한
    return Math.min(proofCount, totalDays);
  };

  const myChallengeCards = useMemo(() => {
    return joinedChallenges
      .map((joinedItem) => {
        const challengeInfo = allChallenges.find(
          (challenge) => challenge.id === joinedItem.id,
        );

        if (!challengeInfo) return null;

        const totalDays = joinedItem.totalDays ?? challengeInfo.totalDays;
        const completedDays = getCompletedDaysByProofs(
          joinedItem.id,
          totalDays,
        );
        const progressRate = calculateProgressRate(completedDays, totalDays);

        return {
          ...challengeInfo,
          completedDays,
          totalDays,
          progressRate,
        };
      })
      .filter(Boolean);
  }, [allChallenges, joinedChallenges, challengeProofs]);

  const selectedChallenge = useMemo(() => {
    const challengeInfo = allChallenges.find(
      (challenge) => challenge.id === selectedChallengeId,
    );

    if (!challengeInfo) return null;

    const joinedInfo = joinedChallenges.find(
      (challenge) => challenge.id === selectedChallengeId,
    );

    const totalDays = joinedInfo?.totalDays ?? challengeInfo.totalDays;
    const completedDays = joinedInfo
      ? getCompletedDaysByProofs(selectedChallengeId, totalDays)
      : 0;
    const progressRate = calculateProgressRate(completedDays, totalDays);

    return {
      ...challengeInfo,
      isJoined: Boolean(joinedInfo),
      completedDays,
      totalDays,
      progressRate,
    };
  }, [allChallenges, joinedChallenges, selectedChallengeId, challengeProofs]);

  const selectedChallengeProofs = useMemo(() => {
    if (!selectedChallengeId) return [];

    return challengeProofs
      .filter((proof) => proof.challengeId === selectedChallengeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [challengeProofs, selectedChallengeId]);

  const handleSelectChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
  };

  const handleJoinChallenge = async (challenge) => {
    if (isJoinedChallenge(challenge.id)) {
      setSelectedChallengeId(challenge.id);
      return;
    }

    const joinedChallenge = await challengeService.joinChallenge(challenge);

    setJoinedChallenges((prev) => [...prev, joinedChallenge]);

    setAllChallenges((prev) =>
      prev.map((item) =>
        item.id === challenge.id
          ? { ...item, participants: item.participants + 1 }
          : item,
      ),
    );

    setSelectedChallengeId(challenge.id);
  };

  // draft 파일만 정리하는 헬퍼
  const clearChallengeProofDraftFiles = () => {
    challengeProofFiles.forEach((file) => {
      URL.revokeObjectURL(file.previewUrl);
      challengeProofObjectUrlsRef.current =
        challengeProofObjectUrlsRef.current.filter(
          (url) => url !== file.previewUrl,
        );
    });

    setChallengeProofFiles([]);
  };

  const handleOpenChallengeProof = (challenge) => {
    // 홈의 루틴 완료처럼 하루 1회만 인증 가능하도록 한 번 더 방어
    if (hasTodayChallengeProof(challenge.id)) {
      return;
    }

    // 챌린지 페이지 내부에서만 인증 업로드 UI를 열도록 처리
    setSelectedProofChallenge(challenge);
    setChallengeProofText("");
    clearChallengeProofDraftFiles();
  };

  const handleCloseChallengeProof = () => {
    clearChallengeProofDraftFiles();
    setChallengeProofText("");
    setSelectedProofChallenge(null);
  };

  const handleChallengeProofFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    const availableSlots = 3 - challengeProofFiles.length;

    if (availableSlots <= 0) {
      alert("사진/영상은 최대 3개까지만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    const nextFiles = selectedFiles
      .slice(0, availableSlots)
      .map((file, index) => {
        const previewUrl = URL.createObjectURL(file);

        challengeProofObjectUrlsRef.current.push(previewUrl);

        return {
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          file,
          previewUrl,
        };
      });

    // TODO: 영상 길이 제한이 필요해지면 여기서 metadata 검사 추가
    setChallengeProofFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleRemoveChallengeProofFile = (fileId) => {
    setChallengeProofFiles((prev) => {
      const targetFile = prev.find((file) => file.id === fileId);

      if (targetFile) {
        URL.revokeObjectURL(targetFile.previewUrl);
        challengeProofObjectUrlsRef.current =
          challengeProofObjectUrlsRef.current.filter(
            (url) => url !== targetFile.previewUrl,
          );
      }

      return prev.filter((file) => file.id !== fileId);
    });
  };

  const handleSubmitChallengeProof = async (event) => {
    event.preventDefault();

    if (!selectedProofChallenge) return;

    // 함수 내부에서도 하루 1회 제한을 한 번 더 확인
    if (hasTodayChallengeProof(selectedProofChallenge.id)) {
      return;
    }

    if (!challengeProofText.trim() && challengeProofFiles.length === 0) {
      alert("인증 글 또는 사진/영상을 하나 이상 입력해주세요.");
      return;
    }

    const proofPayload = {
      id: Date.now(),
      challengeId: selectedProofChallenge.id,
      content: challengeProofText.trim(),
      files: challengeProofFiles,
      proofDate: getLocalDateString(), // 오늘 날짜를 별도 저장
      createdAt: new Date().toISOString(),
    };

    // TODO: 백엔드 연결 시 POST /challenge/:challengeId/proof 로 FormData 전송
    const savedProof =
      await challengeService.submitChallengeProof(proofPayload);

    setChallengeProofs((prev) => [savedProof, ...prev]);
    setChallengeProofText("");
    setChallengeProofFiles([]);
    setSelectedProofChallenge(null);
  };

  return (
    <div className="challenge-page">
      <section className="routine-content challenge-hero">
        <p className="challenge-eyebrow">Challenge</p>
        <h1 className="challenge-page-title">챌린지</h1>
        <p className="challenge-page-description">
          다양한 챌린지에 참여하여 새로운 습관을 만들어보세요. 나에게 맞는
          챌린지를 선택하고, 꾸준히 실천하며 성장하는 경험을 할 수 있습니다.
        </p>
      </section>

      <div className="challenge-layout">
        <section className="challenge-section challenge-my-section">
          <div className="challenge-section-head">
            <div>
              <h2 className="challenge-section-title">내가 참여한 챌린지</h2>
              <p className="challenge-section-subtitle">
                현재 참여 중인 챌린지의 진행도를 한눈에 확인할 수 있습니다.
              </p>
            </div>
            <span className="challenge-count-pill">
              {myChallengeCards.length}개
            </span>
          </div>

          {myChallengeCards.length === 0 ? (
            <div className="challenge-empty-card">
              <p className="challenge-empty-title">
                아직 참여 중인 챌린지가 없습니다.
              </p>
              <p className="challenge-empty-text">
                아래 전체 챌린지에서 원하는 챌린지에 참여해보세요.
              </p>
            </div>
          ) : (
            <div className="challenge-my-list">
              {myChallengeCards.map((challenge) => {
                const todayProof = getTodayChallengeProof(challenge.id);
                const isProofDoneToday = Boolean(todayProof);

                return (
                  <button
                    key={challenge.id}
                    type="button"
                    className={`challenge-my-card ${selectedChallengeId === challenge.id ? "active" : ""}`}
                    onClick={() => handleSelectChallenge(challenge.id)}
                  >
                    <div className="challenge-card-top">
                      <div>
                        <h3 className="challenge-card-title">
                          {challenge.title}
                        </h3>
                        <p className="challenge-card-period">
                          기간: {formatChallengeDate(challenge.startDate)} ~{" "}
                          {formatChallengeDate(challenge.endDate)}
                        </p>
                      </div>
                      <span className="challenge-status-pill joined">
                        참여 중
                      </span>
                    </div>

                    <p className="challenge-progress-text">
                      진행도: {challenge.completedDays} / {challenge.totalDays}
                      일
                    </p>

                    <div className="challenge-progress-track">
                      <div
                        className="challenge-progress-fill"
                        style={{ width: `${challenge.progressRate}%` }}
                      />
                    </div>

                    <p className="challenge-progress-rate">
                      {challenge.progressRate}%
                    </p>

                    <div className="challenge-my-card-actions">
                      {todayProof && (
                        <p className="challenge-complete-time">
                          완료 시간:{" "}
                          {formatChallengeCompletedTime(todayProof.createdAt)}
                        </p>
                      )}

                      <button
                        type="button"
                        className="challenge-button challenge-button-outline challenge-proof-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenChallengeProof(challenge);
                        }}
                        disabled={isProofDoneToday}
                      >
                        {isProofDoneToday ? "오늘 인증 완료" : "오늘 인증하기"}
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="challenge-detail-panel">
          <div className="challenge-section-head">
            <div>
              <h2 className="challenge-section-title">챌린지 상세 보기</h2>
              <p className="challenge-section-subtitle">
                선택한 챌린지의 상세 정보와 진행 상태를 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {selectedChallenge ? (
            <div className="challenge-detail-card">
              <div className="challenge-detail-header">
                <div>
                  <p className="challenge-detail-category">
                    {selectedChallenge.category}
                  </p>
                  <h3 className="challenge-detail-title">
                    {selectedChallenge.title}
                  </h3>
                </div>

                <span
                  className={`challenge-status-pill ${
                    selectedChallenge.isJoined ? "joined" : "open"
                  }`}
                >
                  {selectedChallenge.isJoined ? "참여 중" : "참여 가능"}
                </span>
              </div>

              <p className="challenge-detail-description">
                {selectedChallenge.description}
              </p>

              <div className="challenge-detail-summary">
                <div className="challenge-summary-item">
                  <span>기간</span>
                  <strong>
                    {formatChallengeDate(selectedChallenge.startDate)} ~{" "}
                    {formatChallengeDate(selectedChallenge.endDate)}
                  </strong>
                </div>

                <div className="challenge-summary-item">
                  <span>참여자 수</span>
                  <strong>{selectedChallenge.participants}명</strong>
                </div>

                <div className="challenge-summary-item">
                  <span>카테고리</span>
                  <strong>{selectedChallenge.category}</strong>
                </div>

                <div className="challenge-summary-item">
                  <span>진행도</span>
                  <strong>
                    {selectedChallenge.completedDays} /{" "}
                    {selectedChallenge.totalDays}일
                  </strong>
                </div>
              </div>

              <div className="challenge-detail-progress">
                <div className="challenge-progress-label-row">
                  <span>진행률</span>
                  <strong>{selectedChallenge.progressRate}%</strong>
                </div>
                <div className="challenge-progress-track large">
                  <div
                    className="challenge-progress-fill"
                    style={{ width: `${selectedChallenge.progressRate}%` }}
                  />
                </div>
              </div>

              <div className="challenge-detail-actions">
                {selectedChallenge.isJoined ? (
                  <button
                    type="button"
                    className="challenge-button challenge-button-secondary"
                    onClick={() => handleSelectChallenge(selectedChallenge.id)}
                  >
                    참여 중
                  </button>
                ) : (
                  <button
                    type="button"
                    className="challenge-button"
                    onClick={() => handleJoinChallenge(selectedChallenge)}
                  >
                    참여하기
                  </button>
                )}

                {selectedChallenge.isJoined &&
                  (() => {
                    const todayProof = getTodayChallengeProof(
                      selectedChallenge.id,
                    );
                    const isProofDoneToday = Boolean(todayProof);

                    return (
                      <div className="challenge-proof-action-group">
                        {todayProof && (
                          <p className="challenge-complete-time">
                            완료 시간:{" "}
                            {formatChallengeCompletedTime(todayProof.createdAt)}
                          </p>
                        )}

                        <button
                          type="button"
                          className="challenge-button challenge-button-outline challenge-proof-button"
                          onClick={() =>
                            handleOpenChallengeProof(selectedChallenge)
                          }
                          disabled={isProofDoneToday}
                        >
                          {isProofDoneToday
                            ? "오늘 인증 완료"
                            : "오늘 인증하기"}
                        </button>
                      </div>
                    );
                  })()}
              </div>

              <p className="challenge-proof-note">
                챌린지 인증은 현재 프론트 mock 상태로 동작하며, 추후 백엔드
                API와 연결될 예정입니다.
              </p>

              {selectedChallenge.isJoined &&
                selectedProofChallenge?.id === selectedChallenge.id && (
                  <div className="challenge-proof-panel">
                    <h4 className="challenge-proof-panel-title">
                      오늘 챌린지 인증
                    </h4>

                    <form
                      className="challenge-proof-form"
                      onSubmit={handleSubmitChallengeProof}
                    >
                      <textarea
                        value={challengeProofText}
                        onChange={(event) =>
                          setChallengeProofText(event.target.value)
                        }
                        placeholder="오늘 챌린지 인증 내용을 입력하세요."
                      />

                      <label className="proof-file-label">
                        사진/영상 추가
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleChallengeProofFileChange}
                        />
                      </label>

                      <p className="challenge-proof-help">
                        사진/영상은 최대 3개까지 업로드할 수 있습니다.
                      </p>

                      {challengeProofFiles.length > 0 && (
                        <div className="proof-preview-list">
                          {challengeProofFiles.map((file) => (
                            <div
                              key={file.id}
                              className="challenge-proof-preview-wrap"
                            >
                              <div className="proof-preview-item">
                                {file.type.startsWith("image/") ? (
                                  <img
                                    src={file.previewUrl}
                                    alt={file.name}
                                    className="proof-preview-media"
                                  />
                                ) : (
                                  <video
                                    src={file.previewUrl}
                                    className="proof-preview-media"
                                    controls
                                  />
                                )}
                              </div>

                              <button
                                type="button"
                                className="challenge-proof-remove-btn"
                                onClick={() =>
                                  handleRemoveChallengeProofFile(file.id)
                                }
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="challenge-proof-actions">
                        <button type="submit" className="challenge-button">
                          인증 등록
                        </button>
                        <button
                          type="button"
                          className="challenge-button challenge-button-outline"
                          onClick={handleCloseChallengeProof}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              <div className="challenge-proof-history">
                <h4 className="challenge-proof-history-title">내 인증 내역</h4>

                {selectedChallengeProofs.length === 0 ? (
                  <p className="challenge-proof-empty">
                    아직 등록한 인증이 없습니다.
                  </p>
                ) : (
                  <div className="challenge-proof-history-list">
                    {selectedChallengeProofs.map((proof) => (
                      <article key={proof.id} className="challenge-proof-entry">
                        <p className="challenge-proof-history-date">
                          {formatChallengeDateTime(proof.createdAt)}
                        </p>

                        {proof.content && (
                          <p className="challenge-proof-history-content">
                            {proof.content}
                          </p>
                        )}

                        {proof.files.length > 0 && (
                          <div className="challenge-proof-media-list">
                            {proof.files.map((file) => (
                              <div
                                key={file.id}
                                className="challenge-proof-media-item"
                              >
                                {file.type.startsWith("image/") ? (
                                  <img
                                    src={file.previewUrl}
                                    alt={file.name}
                                    className="challenge-proof-media"
                                  />
                                ) : (
                                  <video
                                    src={file.previewUrl}
                                    className="challenge-proof-media"
                                    controls
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="challenge-empty-card">
              <p className="challenge-empty-title">선택된 챌린지가 없습니다.</p>
              <p className="challenge-empty-text">
                참여한 챌린지 또는 전체 챌린지 카드를 선택해보세요.
              </p>
            </div>
          )}
        </aside>
      </div>

      <section className="challenge-section">
        <div className="challenge-section-head challenge-section-head-centered">
          <div>
            <h2 className="challenge-section-title">전체 챌린지</h2>
            <p className="challenge-section-subtitle">
              현재 참여 가능한 챌린지 목록입니다. 추후 관리자 페이지에서 등록한
              챌린지가 이 영역에 표시될 수 있습니다.
            </p>
          </div>
        </div>

        <div className="challenge-grid">
          {allChallenges.map((challenge) => {
            const joined = isJoinedChallenge(challenge.id);

            return (
              <article
                key={challenge.id}
                className={`challenge-card ${selectedChallengeId === challenge.id ? "selected" : ""}`}
                onClick={() => handleSelectChallenge(challenge.id)}
              >
                <div className="challenge-card-top">
                  <div>
                    <span className="challenge-badge">
                      {challenge.category}
                    </span>
                    <h3 className="challenge-card-title">{challenge.title}</h3>
                  </div>
                  <span className="challenge-participant-count">
                    {challenge.participants}명 참여
                  </span>
                </div>

                <p className="challenge-card-description">
                  {challenge.description}
                </p>

                <div className="challenge-card-meta">
                  <span>
                    기간: {formatChallengeDate(challenge.startDate)} ~{" "}
                    {formatChallengeDate(challenge.endDate)}
                  </span>
                  <span>총 {challenge.totalDays}일</span>
                </div>

                <div className="challenge-card-actions">
                  {joined ? (
                    <button
                      type="button"
                      className="challenge-button challenge-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChallenge(challenge.id);
                      }}
                    >
                      상세 보기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="challenge-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChallenge(challenge);
                      }}
                    >
                      참여하기
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ChallengePage;
