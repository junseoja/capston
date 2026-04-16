# ============================================================
# 루틴 완료 기록(Completion) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /completion/                   : 루틴 완료 기록 생성
#   GET    /completion/today/{user_id}    : 오늘 완료한 루틴 목록 조회
#   DELETE /completion/{completion_id}    : 완료 기록 삭제 (완료 취소)
#   GET    /completion/history/{user_id}  : 전체 완료 이력 조회 (마이페이지용)
#
# DB 테이블: routine_completions
#   - completion_id : UUID v7 (PK)
#   - routine_id    : UUID v7 (FK → routines.routine_id)
#   - user_id       : UUID v7 (FK → users.user_id)
#   - proof_text    : 인증 글 (상세 루틴에서 입력)
#   - completed_at  : 완료 일시 (자동)
#
# 현재 상태:
#   React 프론트에서 아직 이 API를 직접 호출하지 않음
#   (완료 처리는 React state에서만 관리 중)
#   추후 홈 화면 완료 버튼 클릭 시 이 API 연결 예정
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /completion 접두사 라우터 생성
router = APIRouter(prefix="/completion", tags=["completion"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class CompletionCreate(BaseModel):
    """루틴 완료 생성 요청 데이터 스키마"""
    routine_id: str               # UUID v7 (routines.routine_id FK)
    user_id: str                  # UUID v7 (users.user_id FK)
    proof_text: Optional[str] = ""  # 인증 글 (상세 루틴 시 입력값, 체크 루틴은 빈 문자열)

# ── 루틴 완료 기록 생성 (POST /completion/) ───────────────────────────────────

@router.post("/")
def create_completion(body: CompletionCreate):
    """루틴 완료 기록 생성

    홈 화면에서 루틴을 완료할 때 호출 예정.
    UUID v7로 completion_id를 생성하고 routine_completions 테이블에 INSERT.
    피드 업로드 시에도 이 completion_id가 feeds 테이블에 FK로 연결됨.

    Args:
        body (CompletionCreate): 완료 데이터 (routine_id, user_id, proof_text)

    Returns:
        dict: {"success": True, "completion_id": "uuid-v7-..."}
              completion_id는 피드 생성 시 feeds.completion_id FK로 사용됨

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 완료 기록 고유 ID 생성
            cursor.execute(
                """INSERT INTO routine_completions
                    (completion_id, routine_id, user_id, proof_text)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.routine_id, body.user_id, body.proof_text)
                # completed_at은 DB DEFAULT CURRENT_TIMESTAMP으로 자동 입력됨
            )
        conn.commit()
        # completion_id를 반환해야 피드 생성 시 FK로 사용 가능
        return {"success": True, "completion_id": new_uuid}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 오늘 완료 기록 조회 (GET /completion/today/{user_id}) ─────────────────────

@router.get("/today/{user_id}")
def get_today_completions(user_id: str):
    """오늘 완료한 루틴 목록 조회

    홈 화면 초기 로드 시 오늘 이미 완료한 루틴을 표시하기 위해 사용 예정.
    DATE(completed_at) = CURDATE() 조건으로 오늘 날짜의 기록만 필터링.

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 오늘 완료한 루틴 기록 목록 (최신순)
                    각 항목: completion_id, routine_id, user_id, proof_text, completed_at

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT * FROM routine_completions
                WHERE user_id = %s
                AND DATE(completed_at) = CURDATE()
                ORDER BY completed_at DESC""",
                # DATE(completed_at) = CURDATE(): 서버 시간 기준 오늘 날짜만 조회
                (user_id,)
            )
            completions = cursor.fetchall()  # 오늘 완료 기록 전체 (없으면 빈 리스트)
        return completions
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 완료 기록 삭제 (DELETE /completion/{completion_id}) ───────────────────────

@router.delete("/{completion_id}")
def delete_completion(
    completion_id: str,
    user_id: str = Query(..., description="요청한 유저의 UUID v7 — 본인 완료 기록만 삭제 가능")
):
    """루틴 완료 취소 (완료 기록 삭제)

    홈 화면에서 완료된 루틴 카드를 클릭해 완료 취소할 때 호출 예정.
    피드에 올라간 게시물도 함께 삭제해야 하므로
    feeds 테이블의 ON DELETE CASCADE 설정 여부 확인 필요.

    [수정] 기존에는 completion_id만으로 삭제했으나,
    이제 user_id까지 함께 검증하여 본인 완료 기록만 삭제 가능하도록 강화.

    Args:
        completion_id (str): 삭제할 완료 기록의 UUID v7 (URL 경로 파라미터)
        user_id (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
              {"success": False, "message": "..."} → 권한 없음 또는 대상 없음

    Raises:
        HTTPException 500: DB 삭제 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM routine_completions WHERE completion_id = %s AND user_id = %s",
                (completion_id, user_id)
            )
            affected = cursor.rowcount
        conn.commit()

        # [추가] 삭제된 행이 없으면 존재하지 않거나 본인 소유가 아님
        if affected == 0:
            return {"success": False, "message": "삭제 권한이 없거나 존재하지 않는 완료 기록입니다."}

        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 전체 완료 이력 조회 (GET /completion/history/{user_id}) ──────────────────

@router.get("/history/{user_id}")
def get_completion_history(user_id: str):
    """유저 전체 완료 이력 조회 (마이페이지용)

    마이페이지의 "최근 활동" 섹션에서 사용 예정.
    현재 MyPage.jsx에는 하드코딩된 더미 데이터가 표시되고 있으며,
    이 API가 연결되면 실제 완료 기록으로 대체 가능.

    routines 테이블과 JOIN하여 루틴 제목, 카테고리, 완료 방식도 함께 반환.
    최신 20건만 조회 (LIMIT 20).

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 완료 이력 목록 (최신 20건, 최신순)
                    각 항목: completion_id, routine_id, user_id, proof_text,
                             completed_at, title(루틴), category, routine_mode

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT rc.*, r.title, r.category, r.routine_mode
                FROM routine_completions rc
                JOIN routines r ON rc.routine_id = r.routine_id
                WHERE rc.user_id = %s
                ORDER BY rc.completed_at DESC
                LIMIT 20""",
                # JOIN으로 루틴 제목/카테고리도 함께 조회
                # LIMIT 20: 최근 20건만 반환 (성능 + 페이지 분량)
                (user_id,)
            )
            history = cursor.fetchall()
        return history
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
