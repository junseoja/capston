# ============================================================
# 마이페이지(MyPage) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   GET /mypage/{user_id}         : 유저 + 핵심 지표 + 갤러리 통합 조회
#   GET /mypage/summary/{user_id} : 마이페이지 핵심 지표 조회
#   GET /mypage/gallery/{user_id} : 내 인증 갤러리 이미지/영상 조회
#
# [추가 2026-05-10]
# 이유:
#   MyPage.jsx 가 오늘 달성률, 연속 달성, 인증 게시글 수, 갤러리를
#   mock/Unsplash 데이터로 표시하고 있어 실제 사용자 데이터와 불일치했다.
#
# 설명:
#   Express 의 requireAuth 를 거쳐 세션 user_id 로만 호출되며,
#   FastAPI 전역 X-Internal-Api-Key 미들웨어가 직접 호출을 1차 차단한다.
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from datetime import timedelta

router = APIRouter(prefix="/mypage", tags=["mypage"])


def _rate(done: int, total: int) -> int:
    """0 나누기를 피하면서 정수 퍼센트 달성률을 계산한다."""
    if total <= 0:
        return 0
    return min(100, round((done / total) * 100))


def _to_iso_date(value):
    """PyMySQL date/datetime/string 결과를 YYYY-MM-DD 문자열로 통일한다."""
    if hasattr(value, "date"):
        return value.date().isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _calculate_current_streak(completion_dates, today):
    """오늘부터 거꾸로 하루 이상 완료한 날짜가 연속되는 길이를 계산한다."""
    date_set = set(completion_dates)
    current = today
    streak = 0

    while current.isoformat() in date_set:
        streak += 1
        current -= timedelta(days=1)

    return streak


def _load_user(cursor, user_id: str):
    cursor.execute(
        """SELECT user_id, login_id, nickname, email, gender, birth_date, profile_img
        FROM users
        WHERE user_id = %s
          AND deleted_at IS NULL""",
        (user_id,)
    )
    return cursor.fetchone()


def _load_summary(cursor, user_id: str):
    cursor.execute("SELECT CURDATE() AS today")
    today = cursor.fetchone()["today"]

    cursor.execute(
        """SELECT time_slot, COUNT(*) AS count
        FROM routines
        WHERE user_id = %s
          AND deleted_at IS NULL
        GROUP BY time_slot""",
        (user_id,)
    )
    routine_rows = cursor.fetchall()

    routine_counts = {"morning": 0, "lunch": 0, "dinner": 0}
    for row in routine_rows:
        routine_counts[row["time_slot"]] = int(row["count"])

    routine_total = sum(routine_counts.values())

    cursor.execute(
        """SELECT r.time_slot, COUNT(DISTINCT rc.routine_id) AS count
        FROM routine_completions rc
        JOIN routines r ON rc.routine_id = r.routine_id
        WHERE rc.user_id = %s
          AND rc.deleted_at IS NULL
          AND r.deleted_at IS NULL
          AND DATE(rc.completed_at) = CURDATE()
        GROUP BY r.time_slot""",
        (user_id,)
    )
    completed_rows = cursor.fetchall()

    completed_counts = {"morning": 0, "lunch": 0, "dinner": 0}
    for row in completed_rows:
        completed_counts[row["time_slot"]] = int(row["count"])

    cursor.execute(
        "SELECT COUNT(*) AS count FROM feeds WHERE user_id = %s",
        (user_id,)
    )
    feed_count = int(cursor.fetchone()["count"])

    cursor.execute(
        """SELECT DISTINCT DATE(completed_at) AS completed_date
        FROM routine_completions
        WHERE user_id = %s
          AND deleted_at IS NULL
          AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        ORDER BY completed_date DESC""",
        (user_id,)
    )
    completion_dates = [_to_iso_date(row["completed_date"]) for row in cursor.fetchall()]

    return {
        "routine_count": routine_total,
        "feed_count": feed_count,
        "current_streak": _calculate_current_streak(completion_dates, today),
        "today": {
            "total_rate": _rate(sum(completed_counts.values()), routine_total),
            "time_slots": {
                slot: {
                    "routine_count": routine_counts[slot],
                    "completed_count": completed_counts[slot],
                    "rate": _rate(completed_counts[slot], routine_counts[slot]),
                }
                for slot in ["morning", "lunch", "dinner"]
            },
        },
    }


def _load_gallery(cursor, user_id: str, limit: int):
    cursor.execute(
        """SELECT
               f.feed_id,
               f.content,
               f.created_at,
               fi.image_id,
               fi.file_url,
               fi.file_type
        FROM feeds f
        JOIN feed_images fi ON f.feed_id = fi.feed_id
        WHERE f.user_id = %s
        ORDER BY f.created_at DESC, fi.created_at ASC
        LIMIT %s""",
        (user_id, limit)
    )
    return cursor.fetchall()


@router.get("/{user_id}")
def get_mypage_overview(
    user_id: str,
    gallery_limit: int = Query(9, ge=1, le=30, description="가져올 갤러리 항목 수")
):
    """마이페이지 화면에 필요한 데이터를 한 번에 조회.

    [추가 2026-05-10]
    이유:
        기존 프론트가 /me, /mypage/summary, /mypage/gallery 를 각각 호출하면
        React → Express → FastAPI 왕복이 3번 발생한다. 구조는 유지하되 화면 단위 API로
        합쳐 왕복 횟수와 로딩 조각을 줄인다.

    결과:
        MyPage.jsx 는 GET /mypage 한 번으로 user + summary + gallery 를 받는다.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            user = _load_user(cursor, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="유저 정보를 찾을 수 없습니다.")
            return {
                "user": user,
                "summary": _load_summary(cursor, user_id),
                "gallery": _load_gallery(cursor, user_id, gallery_limit),
            }
    except HTTPException:
        raise
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/summary/{user_id}")
def get_mypage_summary(user_id: str):
    """마이페이지 핵심 지표 조회.

    [추가 2026-05-10]
    이유:
        프론트의 임시 값(오늘의 갓생 지수, 연속 달성, 인증 게시글 수)을
        실제 DB 데이터로 대체하기 위한 단일 summary API.

    계산 기준:
        - 총 루틴 수: deleted_at IS NULL 인 활성 루틴 수
        - 오늘 달성률: 오늘 완료한 distinct routine_id / 활성 루틴 수
        - 시간대별 달성률: 해당 time_slot 활성 루틴 대비 오늘 완료 수
        - 연속 달성: 오늘부터 역순으로 "하루 1개 이상 완료"가 이어진 날짜 수
        - 인증 게시글 수: feeds 테이블에서 현재 user_id가 작성한 게시글 수
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            return _load_summary(cursor, user_id)
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/gallery/{user_id}")
def get_mypage_gallery(
    user_id: str,
    limit: int = Query(9, ge=1, le=30, description="가져올 갤러리 항목 수")
):
    """내 인증 갤러리 조회.

    [추가 2026-05-10]
    이유:
        MyPage.jsx 의 Unsplash placeholder 이미지를 실제 사용자가 올린
        feed_images 데이터로 대체하기 위함.

    동작:
        현재 유저가 작성한 피드의 이미지/영상 파일을 최신 피드 순으로 가져온다.
        file_url 은 S3 퍼블릭 URL 또는 과거 /uploads 경로를 그대로 반환하며,
        프론트는 http 여부에 따라 표시 URL을 결정한다.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            return {"items": _load_gallery(cursor, user_id, limit)}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
