from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel, Field
from typing import List, Optional
import pymysql

from uuid_extensions import uuid7str


router = APIRouter(prefix="/challenge", tags=["challenge"])


class ChallengeJoin(BaseModel):
    user_id: str


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
