"""Challenge domain API.

Express의 challenge.js 라우터가 내부 키를 붙여 호출하는 데이터 계층이다.
사용자 기능은 챌린지 목록/참여/인증 등록/오늘 인증 취소를 담당하고,
관리자 기능은 챌린지 CRUD와 참여자/인증 현황 조회를 담당한다.

인증 파일 자체는 Express가 S3에 업로드하며, 이 라우터는 DB에 URL/key/type
메타데이터와 챌린지 참여/인증 관계만 저장한다.
"""

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel, Field
from typing import List, Optional
import pymysql

from uuid_extensions import uuid7str


router = APIRouter(prefix="/challenge", tags=["challenge"])


class ChallengeJoin(BaseModel):
    user_id: str


# ────────────────────────────────────────────────────────────────────
# [추가 2026-05-20] 관리자 챌린지 CRUD Pydantic 모델
# ────────────────────────────────────────────────────────────────────
# 오류 번호: P1 (관리자 챌린지 백엔드 미연결)
# 날짜: 2026-05-20
# 기대 효과:
#   - AdminPage 의 "새 챌린지 등록 / 수정 / 삭제" 가 DB 영속화
# 장점:
#   - title/description/category/start_date/end_date 만 받고 total_days 는
#     서버에서 계산 → 클라이언트 변조 불가
# ────────────────────────────────────────────────────────────────────
class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    start_date: str
    end_date: str
    created_by: Optional[str] = None


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ChallengeProofFilePayload(BaseModel):
    file_url: str
    file_type: Optional[str] = ""


class ChallengeProofCreate(BaseModel):
    user_id: str
    content: Optional[str] = ""
    proof_date: Optional[str] = None
    share_to_feed: bool = False
    files: List[ChallengeProofFilePayload] = Field(default_factory=list)


def _to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _serialize_challenge(row):
    return {
        "id": row["challenge_id"],
        "title": row["title"],
        "description": row["description"] or "",
        "category": row["category"] or "",
        "startDate": _to_iso(row["start_date"]),
        "endDate": _to_iso(row["end_date"]),
        "participants": int(row["participant_count"] or 0),
        "totalDays": int(row["total_days"] or 0),
    }


def _load_active_challenge(cursor, challenge_id: str):
    cursor.execute(
        """SELECT challenge_id, title, description, category,
                  start_date, end_date, total_days, participant_count
           FROM challenges
           WHERE challenge_id = %s
             AND deleted_at IS NULL""",
        (challenge_id,),
    )
    return cursor.fetchone()


def _has_share_to_feed_column(cursor) -> bool:
    cursor.execute("SHOW COLUMNS FROM challenge_proofs LIKE 'share_to_feed'")
    return cursor.fetchone() is not None


@router.get("/")
def get_challenges():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT challenge_id, title, description, category,
                          start_date, end_date, total_days, participant_count
                   FROM challenges
                   WHERE deleted_at IS NULL
                   ORDER BY start_date DESC, created_at DESC"""
            )
            rows = cursor.fetchall()
        return [_serialize_challenge(row) for row in rows]
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/my/{user_id}")
def get_my_challenges(user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT cp.challenge_id, c.total_days, cp.status, cp.joined_at
                   FROM challenge_participants cp
                   JOIN challenges c ON cp.challenge_id = c.challenge_id
                   WHERE cp.user_id = %s
                     AND cp.status = 'ACTIVE'
                     AND c.deleted_at IS NULL
                   ORDER BY cp.joined_at DESC""",
                (user_id,),
            )
            rows = cursor.fetchall()
        return [
            {
                "id": row["challenge_id"],
                "totalDays": int(row["total_days"] or 0),
                "status": row["status"],
                "joinedAt": _to_iso(row["joined_at"]),
            }
            for row in rows
        ]
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/proofs/{user_id}")
def get_challenge_proofs(user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            has_share_to_feed = _has_share_to_feed_column(cursor)
            share_to_feed_sql = (
                "cp.share_to_feed AS share_to_feed"
                if has_share_to_feed
                else "0 AS share_to_feed"
            )
            cursor.execute(
                f"""SELECT cp.proof_id,
                          cp.challenge_id,
                          cp.content,
                          cp.proof_date,
                          cp.created_at,
                          {share_to_feed_sql},
                          cpf.proof_file_id,
                          cpf.file_url,
                          cpf.file_type,
                          cpf.file_order
                   FROM challenge_proofs cp
                   LEFT JOIN challenge_proof_files cpf
                     ON cp.proof_id = cpf.proof_id
                   WHERE cp.user_id = %s
                     AND cp.deleted_at IS NULL
                   ORDER BY cp.created_at DESC, cpf.file_order ASC, cpf.created_at ASC""",
                (user_id,),
            )
            rows = cursor.fetchall()

        proofs = []
        proof_map = {}
        for row in rows:
            proof = proof_map.get(row["proof_id"])
            if not proof:
                proof = {
                    "id": row["proof_id"],
                    "challengeId": row["challenge_id"],
                    "content": row["content"] or "",
                    "proofDate": _to_iso(row["proof_date"]),
                    "createdAt": _to_iso(row["created_at"]),
                    "shareToFeed": bool(row.get("share_to_feed")),
                    "files": [],
                }
                proof_map[row["proof_id"]] = proof
                proofs.append(proof)

            if row.get("proof_file_id"):
                file_url = row["file_url"]
                proof["files"].append(
                    {
                        "id": row["proof_file_id"],
                        "name": (file_url.rsplit("/", 1)[-1] if file_url else ""),
                        "type": row["file_type"] or "",
                        "fileUrl": file_url,
                        "previewUrl": file_url,
                    }
                )

        return proofs
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/{challenge_id}/join")
def join_challenge(challenge_id: str, body: ChallengeJoin):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            challenge = _load_active_challenge(cursor, challenge_id)
            if not challenge:
                raise HTTPException(status_code=404, detail="존재하지 않는 챌린지입니다.")

            cursor.execute(
                """SELECT participant_id, status
                   FROM challenge_participants
                   WHERE challenge_id = %s
                     AND user_id = %s""",
                (challenge_id, body.user_id),
            )
            existing = cursor.fetchone()

            if existing and existing["status"] == "ACTIVE":
                conn.commit()
                return {
                    "success": True,
                    "already_joined": True,
                    "challenge": {
                        "id": challenge_id,
                        "totalDays": int(challenge["total_days"] or 0),
                    },
                }

            if existing:
                cursor.execute(
                    """UPDATE challenge_participants
                       SET status = 'ACTIVE',
                           joined_at = NOW(),
                           updated_at = NOW()
                       WHERE participant_id = %s""",
                    (existing["participant_id"],),
                )
            else:
                cursor.execute(
                    """INSERT INTO challenge_participants
                          (participant_id, challenge_id, user_id)
                       VALUES (%s, %s, %s)""",
                    (uuid7str(), challenge_id, body.user_id),
                )

            cursor.execute(
                """UPDATE challenges
                   SET participant_count = participant_count + 1
                   WHERE challenge_id = %s""",
                (challenge_id,),
            )

        conn.commit()
        return {
            "success": True,
            "challenge": {
                "id": challenge_id,
                "totalDays": int(challenge["total_days"] or 0),
            },
        }
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/{challenge_id}/proof")
def create_challenge_proof(challenge_id: str, body: ChallengeProofCreate):
    content = (body.content or "").strip()
    if not content and not body.files:
        raise HTTPException(status_code=400, detail="인증 내용 또는 첨부 파일이 필요합니다.")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            has_share_to_feed = _has_share_to_feed_column(cursor)
            challenge = _load_active_challenge(cursor, challenge_id)
            if not challenge:
                raise HTTPException(status_code=404, detail="존재하지 않는 챌린지입니다.")

            cursor.execute(
                """SELECT participant_id
                   FROM challenge_participants
                   WHERE challenge_id = %s
                     AND user_id = %s
                     AND status = 'ACTIVE'""",
                (challenge_id, body.user_id),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="참여 중인 챌린지에서만 인증할 수 있습니다.")

            proof_date = body.proof_date
            if not proof_date:
                cursor.execute("SELECT CURDATE() AS today")
                proof_date = _to_iso(cursor.fetchone()["today"])

            cursor.execute(
                """SELECT proof_id
                   FROM challenge_proofs
                   WHERE challenge_id = %s
                     AND user_id = %s
                     AND proof_date = %s
                     AND deleted_at IS NULL""",
                (challenge_id, body.user_id, proof_date),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="오늘 인증은 이미 등록되었습니다.")

            proof_id = uuid7str()
            if body.share_to_feed and not has_share_to_feed:
                raise HTTPException(
                    status_code=503,
                    detail="share_to_feed migration is required before challenge proofs can be uploaded to feed.",
                )

            if has_share_to_feed:
                cursor.execute(
                    """INSERT INTO challenge_proofs
                          (proof_id, challenge_id, user_id, content, proof_date, share_to_feed)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        proof_id,
                        challenge_id,
                        body.user_id,
                        content,
                        proof_date,
                        1 if body.share_to_feed else 0,
                    ),
                )
            else:
                cursor.execute(
                    """INSERT INTO challenge_proofs
                          (proof_id, challenge_id, user_id, content, proof_date)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (proof_id, challenge_id, body.user_id, content, proof_date),
                )

            created_files = []
            for index, file in enumerate(body.files):
                proof_file_id = uuid7str()
                cursor.execute(
                    """INSERT INTO challenge_proof_files
                          (proof_file_id, proof_id, file_url, file_type, file_order)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (proof_file_id, proof_id, file.file_url, file.file_type or "", index),
                )
                created_files.append(
                    {
                        "id": proof_file_id,
                        "name": (file.file_url.rsplit("/", 1)[-1] if file.file_url else ""),
                        "type": file.file_type or "",
                        "fileUrl": file.file_url,
                        "previewUrl": file.file_url,
                    }
                )

            cursor.execute(
                """SELECT created_at
                   FROM challenge_proofs
                   WHERE proof_id = %s""",
                (proof_id,),
            )
            created_at = cursor.fetchone()["created_at"]

        conn.commit()
        return {
            "success": True,
            "proof": {
                "id": proof_id,
                "challengeId": challenge_id,
                "content": content,
                "proofDate": proof_date,
                "createdAt": _to_iso(created_at),
                "shareToFeed": body.share_to_feed,
                "files": created_files,
            },
        }
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except pymysql.err.IntegrityError:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=409, detail="오늘 인증은 이미 등록되었습니다.")
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{challenge_id}/proof/today")
def cancel_today_challenge_proof(
    challenge_id: str,
    user_id: str = Query(..., description="로그인 사용자 ID"),
):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT proof_id
                   FROM challenge_proofs
                   WHERE challenge_id = %s
                     AND user_id = %s
                     AND proof_date = CURDATE()
                     AND deleted_at IS NULL""",
                (challenge_id, user_id),
            )
            proof = cursor.fetchone()
            if not proof:
                conn.commit()
                return {"success": False, "message": "오늘 인증 기록이 없습니다."}

            cursor.execute(
                """SELECT file_url
                   FROM challenge_proof_files
                   WHERE proof_id = %s
                   ORDER BY file_order ASC, created_at ASC""",
                (proof["proof_id"],),
            )
            file_urls = [row["file_url"] for row in cursor.fetchall() if row["file_url"]]

            cursor.execute(
                "DELETE FROM challenge_proof_files WHERE proof_id = %s",
                (proof["proof_id"],),
            )
            cursor.execute(
                """UPDATE challenge_proofs
                   SET deleted_at = NOW()
                   WHERE proof_id = %s""",
                (proof["proof_id"],),
            )

        conn.commit()
        return {"success": True, "proof_id": proof["proof_id"], "file_urls": file_urls}
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ============================================================
# [추가 2026-05-20] 관리자 챌린지 CRUD + 참여자/인증 현황 (5개)
# ============================================================
# 오류 번호: P1 (AdminPage 챌린지 관리 mock state → 백엔드 연결)
# 날짜: 2026-05-20
# 기대 효과:
#   - POST   /challenge/                  : 챌린지 신규 등록 (관리자)
#   - PATCH  /challenge/{challenge_id}    : 챌린지 정보 수정 (관리자)
#   - DELETE /challenge/{challenge_id}    : 챌린지 Soft Delete (관리자)
#   - GET    /challenge/{id}/participants : 참여자 + 인증 일수
#   - GET    /challenge/{id}/proofs       : 전체 인증 (실시간 인증 현황)
# 장점:
#   - 기존 _load_active_challenge / _serialize_challenge 재사용 → 표준화
#   - total_days 는 (end_date - start_date + 1) 로 서버 계산 → 변조 불가
#   - participants 응답은 닉네임/프로필/인증일수 까지 포함 → 프론트가 추가 호출 불필요
# ============================================================
from datetime import date as _date


def _parse_date(value: str, field: str) -> _date:
    """YYYY-MM-DD 문자열을 date 로 변환. 실패 시 400."""
    try:
        return _date.fromisoformat(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"{field} 는 YYYY-MM-DD 형식이어야 합니다.")


@router.post("/")
def create_challenge(body: ChallengeCreate):
    title = (body.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="챌린지 제목을 입력해주세요.")
    if len(title) > 100:
        raise HTTPException(status_code=400, detail="제목은 100자 이내여야 합니다.")

    start_date = _parse_date(body.start_date, "start_date")
    end_date = _parse_date(body.end_date, "end_date")
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="종료일은 시작일 이후여야 합니다.")

    total_days = (end_date - start_date).days + 1

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            challenge_id = uuid7str()
            cursor.execute(
                """INSERT INTO challenges
                      (challenge_id, title, description, category,
                       start_date, end_date, total_days, created_by)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    challenge_id,
                    title,
                    (body.description or "").strip() or None,
                    (body.category or "").strip() or None,
                    start_date.isoformat(),
                    end_date.isoformat(),
                    total_days,
                    body.created_by,
                ),
            )
            challenge = _load_active_challenge(cursor, challenge_id)
        conn.commit()
        return {"success": True, "challenge": _serialize_challenge(challenge)}
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.patch("/{challenge_id}")
def update_challenge(challenge_id: str, body: ChallengeUpdate):
    updates = []
    params: List = []

    if body.title is not None:
        title = body.title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="제목은 빈 값일 수 없습니다.")
        if len(title) > 100:
            raise HTTPException(status_code=400, detail="제목은 100자 이내여야 합니다.")
        updates.append("title = %s")
        params.append(title)

    if body.description is not None:
        updates.append("description = %s")
        params.append(body.description.strip() or None)

    if body.category is not None:
        updates.append("category = %s")
        params.append(body.category.strip() or None)

    new_start = _parse_date(body.start_date, "start_date") if body.start_date is not None else None
    new_end = _parse_date(body.end_date, "end_date") if body.end_date is not None else None

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            existing = _load_active_challenge(cursor, challenge_id)
            if not existing:
                raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

            final_start = new_start or existing["start_date"]
            final_end = new_end or existing["end_date"]
            if final_start > final_end:
                raise HTTPException(status_code=400, detail="종료일은 시작일 이후여야 합니다.")

            if new_start is not None:
                updates.append("start_date = %s")
                params.append(final_start.isoformat() if hasattr(final_start, "isoformat") else final_start)
            if new_end is not None:
                updates.append("end_date = %s")
                params.append(final_end.isoformat() if hasattr(final_end, "isoformat") else final_end)
            if new_start is not None or new_end is not None:
                total_days = (final_end - final_start).days + 1 if hasattr(final_end, "__sub__") else (
                    _date.fromisoformat(str(final_end)) - _date.fromisoformat(str(final_start))
                ).days + 1
                updates.append("total_days = %s")
                params.append(total_days)

            if not updates:
                return {"success": True, "challenge": _serialize_challenge(existing)}

            params.append(challenge_id)
            cursor.execute(
                f"UPDATE challenges SET {', '.join(updates)} WHERE challenge_id = %s",
                tuple(params),
            )

            updated = _load_active_challenge(cursor, challenge_id)
        conn.commit()
        return {"success": True, "challenge": _serialize_challenge(updated)}
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{challenge_id}")
def delete_challenge(challenge_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            existing = _load_active_challenge(cursor, challenge_id)
            if not existing:
                raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")
            cursor.execute(
                """UPDATE challenges
                   SET deleted_at = NOW()
                   WHERE challenge_id = %s""",
                (challenge_id,),
            )
        conn.commit()
        return {"success": True, "challenge_id": challenge_id}
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{challenge_id}/participants")
def get_challenge_participants(challenge_id: str):
    """관리자 상세 모달: 참여자 + 인증 일수."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            challenge = _load_active_challenge(cursor, challenge_id)
            if not challenge:
                raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

            cursor.execute(
                """SELECT cp.participant_id,
                          cp.user_id,
                          cp.status,
                          cp.joined_at,
                          u.nickname,
                          u.profile_img,
                          COALESCE(pc.proof_days, 0) AS proof_days
                   FROM challenge_participants cp
                   LEFT JOIN users u
                          ON cp.user_id = u.user_id
                         AND u.deleted_at IS NULL
                   LEFT JOIN (
                       SELECT user_id, COUNT(DISTINCT proof_date) AS proof_days
                       FROM challenge_proofs
                       WHERE challenge_id = %s
                         AND deleted_at IS NULL
                       GROUP BY user_id
                   ) pc ON pc.user_id = cp.user_id
                   WHERE cp.challenge_id = %s
                   ORDER BY cp.joined_at ASC""",
                (challenge_id, challenge_id),
            )
            rows = cursor.fetchall()

        return {
            "total_days": int(challenge["total_days"] or 0),
            "participants": [
                {
                    "participant_id": r["participant_id"],
                    "user_id": r["user_id"],
                    "nickname": r["nickname"] or "(탈퇴한 회원)",
                    "profile_img": r["profile_img"],
                    "status": r["status"],
                    "joined_at": _to_iso(r["joined_at"]),
                    "proof_days": int(r["proof_days"] or 0),
                }
                for r in rows
            ],
        }
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{challenge_id}/proofs")
def get_challenge_all_proofs(
    challenge_id: str,
    limit: int = Query(60, ge=1, le=200, description="최대 인증 건수"),
):
    """관리자 상세 모달: 실시간 인증 현황 (모든 참여자)."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            challenge = _load_active_challenge(cursor, challenge_id)
            if not challenge:
                raise HTTPException(status_code=404, detail="챌린지를 찾을 수 없습니다.")

            cursor.execute(
                """SELECT cp.proof_id,
                          cp.user_id,
                          cp.content,
                          cp.proof_date,
                          cp.created_at,
                          u.nickname,
                          u.profile_img,
                          cpf.proof_file_id,
                          cpf.file_url,
                          cpf.file_type,
                          cpf.file_order
                   FROM challenge_proofs cp
                   LEFT JOIN users u
                          ON cp.user_id = u.user_id
                         AND u.deleted_at IS NULL
                   LEFT JOIN challenge_proof_files cpf
                          ON cp.proof_id = cpf.proof_id
                   WHERE cp.challenge_id = %s
                     AND cp.deleted_at IS NULL
                   ORDER BY cp.created_at DESC, cpf.file_order ASC, cpf.created_at ASC
                   LIMIT %s""",
                (challenge_id, limit * 10),
            )
            rows = cursor.fetchall()

        proofs = []
        proof_map = {}
        for row in rows:
            proof = proof_map.get(row["proof_id"])
            if not proof:
                if len(proofs) >= limit:
                    continue
                proof = {
                    "id": row["proof_id"],
                    "user_id": row["user_id"],
                    "nickname": row["nickname"] or "(탈퇴한 회원)",
                    "profile_img": row["profile_img"],
                    "content": row["content"] or "",
                    "proof_date": _to_iso(row["proof_date"]),
                    "created_at": _to_iso(row["created_at"]),
                    "files": [],
                }
                proof_map[row["proof_id"]] = proof
                proofs.append(proof)

            if row.get("proof_file_id"):
                proof["files"].append(
                    {
                        "id": row["proof_file_id"],
                        "file_url": row["file_url"],
                        "file_type": row["file_type"] or "",
                    }
                )

        return {"proofs": proofs}
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
