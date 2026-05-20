import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EXPRESS_URL } from "./config";

async function parseApiResponse(response, defaultMessage) {
  const rawText = await response.text();
  const trimmed = rawText.trim();

  let result = null;
  if (trimmed) {
    try {
      result = JSON.parse(trimmed);
    } catch {
      if (
        trimmed.startsWith("<!DOCTYPE") ||
        trimmed.startsWith("<html") ||
        trimmed.startsWith("<HTML")
      ) {
        throw new Error(
          "챌린지 API가 JSON 대신 HTML을 반환했습니다. Express 서버 실행 상태와 VITE_EXPRESS_URL 설정을 확인해 주세요.",
        );
      }

      throw new Error(defaultMessage);
    }
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || result?.detail || defaultMessage);
  }

  return result;
}

const challengeService = {
  async fetchChallenges() {
    const response = await fetch(`${EXPRESS_URL}/challenge`, {
      credentials: "include",
    });
    const result = await parseApiResponse(
      response,
      "챌린지 목록을 불러오지 못했습니다.",
    );
    return result.challenges || [];
  },

  async fetchMyChallenges() {
    const response = await fetch(`${EXPRESS_URL}/challenge/my`, {
      credentials: "include",
    });
    const result = await parseApiResponse(
      response,
      "참여 중인 챌린지를 불러오지 못했습니다.",
    );
    return result.challenges || [];
  },

  async fetchChallengeProofs() {
    const response = await fetch(`${EXPRESS_URL}/challenge/proofs`, {
      credentials: "include",
    });
    const result = await parseApiResponse(
      response,
      "챌린지 인증 내역을 불러오지 못했습니다.",
    );
    return result.proofs || [];
  },

  async joinChallenge(challengeId) {
    const response = await fetch(`${EXPRESS_URL}/challenge/${challengeId}/join`, {
      method: "POST",
      credentials: "include",
    });
    const result = await parseApiResponse(
      response,
      "챌린지 참여에 실패했습니다.",
    );
    return result.challenge;
  },

  async submitChallengeProof({
    challengeId,
    content,
    proofDate,
    files,
    shareToFeed,
  }) {
    const formData = new FormData();

    if (content) {
      formData.append("content", content);
    }
    if (proofDate) {
      formData.append("proof_date", proofDate);
    }

    formData.append("share_to_feed", shareToFeed ? "true" : "false");

    for (const file of files) {
      if (file.file) {
        formData.append("files", file.file);
      }
    }

    const response = await fetch(`${EXPRESS_URL}/challenge/${challengeId}/proof`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const result = await parseApiResponse(
      response,
      "챌린지 인증 등록에 실패했습니다.",
    );
    return result.proof;
  },

  async cancelTodayChallengeProof(challengeId) {
    const response = await fetch(
      `${EXPRESS_URL}/challenge/${challengeId}/proof/today`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    return parseApiResponse(
      response,
      "오늘 챌린지 인증 취소에 실패했습니다.",
    );
  },
};

const formatChallengeDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const formatChallengeDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const formatChallengeCompletedTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateProgressRate = (completedDays, totalDays) => {
  if (!totalDays) return 0;
  return Math.round((completedDays / totalDays) * 100);
};

function ChallengePage() {
  const [allChallenges, setAllChallenges] = useState([]);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [challengeProofs, setChallengeProofs] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  const [selectedProofChallenge, setSelectedProofChallenge] = useState(null);
  const [challengeProofText, setChallengeProofText] = useState("");
  const [challengeProofFiles, setChallengeProofFiles] = useState([]);
  const [challengeUploadToFeed, setChallengeUploadToFeed] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const challengeProofObjectUrlsRef = useRef([]);

  const loadChallenges = useCallback(async (preferredChallengeId = null) => {
    const [challengeList, myJoinedList, proofList] = await Promise.all([
      challengeService.fetchChallenges(),
      challengeService.fetchMyChallenges(),
      challengeService.fetchChallengeProofs(),
    ]);

    setAllChallenges(challengeList);
    setJoinedChallenges(myJoinedList);
    setChallengeProofs(proofList);
    setSelectedChallengeId((currentId) => {
      if (preferredChallengeId) {
        return preferredChallengeId;
      }
      return currentId ?? myJoinedList[0]?.id ?? challengeList[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    const initializeChallenges = async () => {
      try {
        await loadChallenges();
      } catch (error) {
        console.error("챌린지 초기화에 실패했습니다:", error);
        alert(error.message || "챌린지 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    return () => {
      challengeProofObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const isJoinedChallenge = (challengeId) =>
    joinedChallenges.some((challenge) => challenge.id === challengeId);

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

  const getCompletedDaysByProofs = (challengeId, totalDays) => {
    const proofCount = challengeProofs.filter(
      (proof) => proof.challengeId === challengeId,
    ).length;
    return Math.min(proofCount, totalDays);
  };

  const myChallengeCards = useMemo(() => {
    return joinedChallenges
      .map((joinedChallenge) => {
        const challengeInfo = allChallenges.find(
          (challenge) => challenge.id === joinedChallenge.id,
        );
        if (!challengeInfo) return null;

        const totalDays = joinedChallenge.totalDays ?? challengeInfo.totalDays;
        const completedDays = getCompletedDaysByProofs(
          joinedChallenge.id,
          totalDays,
        );

        return {
          ...challengeInfo,
          completedDays,
          totalDays,
          progressRate: calculateProgressRate(completedDays, totalDays),
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

    return {
      ...challengeInfo,
      isJoined: Boolean(joinedInfo),
      completedDays,
      totalDays,
      progressRate: calculateProgressRate(completedDays, totalDays),
    };
  }, [allChallenges, joinedChallenges, selectedChallengeId, challengeProofs]);

  const selectedChallengeProofs = useMemo(() => {
    if (!selectedChallengeId) return [];
    return challengeProofs
      .filter((proof) => proof.challengeId === selectedChallengeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [challengeProofs, selectedChallengeId]);

  const revokeChallengeProofPreviewUrl = (previewUrl) => {
    if (!previewUrl?.startsWith("blob:")) return;
    URL.revokeObjectURL(previewUrl);
    challengeProofObjectUrlsRef.current =
      challengeProofObjectUrlsRef.current.filter((url) => url !== previewUrl);
  };

  const revokeChallengeProofFiles = (files = []) => {
    files.forEach((file) => revokeChallengeProofPreviewUrl(file.previewUrl));
  };

  const clearChallengeProofDraftFiles = useCallback(() => {
    revokeChallengeProofFiles(challengeProofFiles);
    setChallengeProofFiles([]);
  }, [challengeProofFiles]);

  const handleSelectChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
  };

  const handleJoinChallenge = async (challenge) => {
    if (isJoinedChallenge(challenge.id)) {
      setSelectedChallengeId(challenge.id);
      return;
    }

    try {
      await challengeService.joinChallenge(challenge.id);
      await loadChallenges(challenge.id);
      setSelectedChallengeId(challenge.id);
    } catch (error) {
      console.error("챌린지 참여에 실패했습니다:", error);
      alert(error.message || "챌린지 참여에 실패했습니다.");
    }
  };

  const handleOpenChallengeProof = (challenge) => {
    if (getTodayChallengeProof(challenge.id)) return;

    setSelectedProofChallenge(challenge);
    setChallengeProofText("");
    setChallengeUploadToFeed(false);
    clearChallengeProofDraftFiles();
  };

  const handleCloseChallengeProof = useCallback(() => {
    clearChallengeProofDraftFiles();
    setChallengeProofText("");
    setChallengeUploadToFeed(false);
    setSelectedProofChallenge(null);
  }, [clearChallengeProofDraftFiles]);

  const handleCancelTodayChallengeProof = async (challengeId) => {
    const todayProof = getTodayChallengeProof(challengeId);
    if (!todayProof) return;

    const isConfirmed = window.confirm("오늘 챌린지 인증을 취소할까요?");
    if (!isConfirmed) return;

    try {
      await challengeService.cancelTodayChallengeProof(challengeId);
      setChallengeProofs((prev) =>
        prev.filter((proof) => proof.id !== todayProof.id),
      );

      if (selectedProofChallenge?.id === challengeId) {
        handleCloseChallengeProof();
      }
    } catch (error) {
      console.error("챌린지 인증 취소에 실패했습니다:", error);
      alert(error.message || "오늘 챌린지 인증 취소에 실패했습니다.");
    }
  };

  const handleChallengeProofFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = 3 - challengeProofFiles.length;
    if (availableSlots <= 0) {
      alert("사진이나 영상은 최대 3개까지 업로드할 수 있습니다.");
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

    setChallengeProofFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleRemoveChallengeProofFile = (fileId) => {
    setChallengeProofFiles((prev) => {
      const targetFile = prev.find((file) => file.id === fileId);
      if (targetFile) {
        revokeChallengeProofPreviewUrl(targetFile.previewUrl);
      }
      return prev.filter((file) => file.id !== fileId);
    });
  };

  const handleSubmitChallengeProof = async (event) => {
    event.preventDefault();

    if (!selectedProofChallenge || isSubmitting) return;
    if (getTodayChallengeProof(selectedProofChallenge.id)) return;

    const trimmedContent = challengeProofText.trim();
    if (!trimmedContent && challengeProofFiles.length === 0) {
      alert("인증 글이나 사진/영상을 하나 이상 입력해 주세요.");
      return;
    }

    if (challengeUploadToFeed && challengeProofFiles.length === 0) {
      alert("피드에도 업로드하려면 사진이나 영상을 하나 이상 추가해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const savedProof = await challengeService.submitChallengeProof({
        challengeId: selectedProofChallenge.id,
        content: trimmedContent,
        files: challengeProofFiles,
        proofDate: getLocalDateString(),
        shareToFeed: challengeUploadToFeed,
      });

      setChallengeProofs((prev) => [savedProof, ...prev]);
      handleCloseChallengeProof();
    } catch (error) {
      console.error("챌린지 인증 등록에 실패했습니다:", error);
      alert(error.message || "챌린지 인증 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="challenge-page">
        <section className="routine-content challenge-hero">
          <p className="challenge-eyebrow">Challenge</p>
          <h1 className="challenge-page-title">챌린지</h1>
          <p className="challenge-page-description">
            챌린지 정보를 불러오는 중입니다.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="challenge-page">
      <section className="routine-content challenge-hero">
        <p className="challenge-eyebrow">Challenge</p>
        <h1 className="challenge-page-title">챌린지</h1>
        <p className="challenge-page-description">
          다양한 챌린지에 참여하고 매일 인증을 쌓아가며 루틴을 확장해 보세요.
        </p>
      </section>

      <div className="challenge-layout">
        <section className="challenge-section challenge-my-section">
          <div className="challenge-section-head">
            <div>
              <h2 className="challenge-section-title">내가 참여한 챌린지</h2>
              <p className="challenge-section-subtitle">
                참여 중인 챌린지의 오늘 인증 상태와 진행률을 확인할 수 있습니다.
              </p>
            </div>
            <span className="challenge-count-pill">{myChallengeCards.length}개</span>
          </div>

          {myChallengeCards.length === 0 ? (
            <div className="challenge-empty-card">
              <p className="challenge-empty-title">
                참여 중인 챌린지가 없습니다.
              </p>
              <p className="challenge-empty-text">
                아래 전체 챌린지에서 원하는 항목을 골라 참여해 보세요.
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
                        <h3 className="challenge-card-title">{challenge.title}</h3>
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
                      진행일 {challenge.completedDays} / {challenge.totalDays}일
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
                      {isProofDoneToday ? (
                        <button
                          type="button"
                          className="challenge-complete-box challenge-complete-box-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancelTodayChallengeProof(challenge.id);
                          }}
                        >
                          <span className="challenge-complete-icon">완료</span>
                          <span className="challenge-complete-text">
                            완료 시간:{" "}
                            {formatChallengeCompletedTime(todayProof.createdAt)}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="challenge-button challenge-button-outline challenge-proof-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenChallengeProof(challenge);
                          }}
                        >
                          오늘 인증하기
                        </button>
                      )}
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
                선택한 챌린지의 기간, 진행률, 인증 내역을 확인할 수 있습니다.
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
                  className={`challenge-status-pill ${selectedChallenge.isJoined ? "joined" : "open"}`}
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
                  <span>참여자</span>
                  <strong>{selectedChallenge.participants}명</strong>
                </div>

                <div className="challenge-summary-item">
                  <span>카테고리</span>
                  <strong>{selectedChallenge.category}</strong>
                </div>

                <div className="challenge-summary-item">
                  <span>진행일</span>
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
                    const todayProof = getTodayChallengeProof(selectedChallenge.id);
                    const isProofDoneToday = Boolean(todayProof);

                    return (
                      <div className="challenge-proof-action-group">
                        {isProofDoneToday ? (
                          <button
                            type="button"
                            className="challenge-complete-box challenge-complete-box-button"
                            onClick={() =>
                              handleCancelTodayChallengeProof(selectedChallenge.id)
                            }
                          >
                            <span className="challenge-complete-icon">완료</span>
                            <span className="challenge-complete-text">
                              완료 시간:{" "}
                              {formatChallengeCompletedTime(todayProof.createdAt)}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="challenge-button challenge-button-outline challenge-proof-button"
                            onClick={() => handleOpenChallengeProof(selectedChallenge)}
                          >
                            오늘 인증하기
                          </button>
                        )}
                      </div>
                    );
                  })()}
              </div>

              <p className="challenge-proof-note">
                챌린지 인증은 실제 백엔드 API와 연결되어 저장됩니다.
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
                        placeholder="오늘 챌린지 인증 내용을 입력해 주세요."
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
                        사진이나 영상은 최대 3개까지 업로드할 수 있습니다.
                      </p>

                      <label className="feed-upload-check">
                        <input
                          type="checkbox"
                          checked={challengeUploadToFeed}
                          onChange={(event) =>
                            setChallengeUploadToFeed(event.target.checked)
                          }
                        />
                        <span>피드에도 업로드하기</span>
                      </label>

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
                        <button
                          type="submit"
                          className="challenge-button"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "등록 중..." : "인증 등록"}
                        </button>
                        <button
                          type="button"
                          className="challenge-button challenge-button-outline"
                          onClick={handleCloseChallengeProof}
                          disabled={isSubmitting}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              <div className="challenge-proof-history">
                <h4 className="challenge-proof-history-title">전체 인증 내역</h4>

                {selectedChallengeProofs.length === 0 ? (
                  <p className="challenge-proof-empty">
                    아직 등록된 인증이 없습니다.
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
                                {(file.type || "").startsWith("image/") ? (
                                  <img
                                    src={file.previewUrl || file.fileUrl}
                                    alt={file.name || "챌린지 인증"}
                                    className="challenge-proof-media"
                                  />
                                ) : (
                                  <video
                                    src={file.previewUrl || file.fileUrl}
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
              <p className="challenge-empty-title">
                선택된 챌린지가 없습니다.
              </p>
              <p className="challenge-empty-text">
                참여 중인 챌린지나 전체 챌린지 목록에서 하나를 선택해 주세요.
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
              현재 참여 가능한 챌린지 목록입니다.
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
                    <span className="challenge-badge">{challenge.category}</span>
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
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectChallenge(challenge.id);
                      }}
                    >
                      상세 보기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="challenge-button"
                      onClick={(event) => {
                        event.stopPropagation();
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
