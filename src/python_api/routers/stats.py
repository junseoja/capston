# ============================================================
# 통계(Stats) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   GET /stats/{user_id}?mode=weekly|monthly&start=YYYY-MM-DD&end=YYYY-MM-DD
#
# 계산 정책:
#   repeat_cycle 이 현재 자유 문자열("매일", "월, 수" 등)이므로 요일 스케줄을
#   DB에서 안전하게 정규화하기 전까지는 "활성 루틴 전체 × 기간 일수"를 목표량으로 계산한다.
# ============================================================
# 조회 실패 경로도 rollback 후 커넥션을 반환해 풀 재사용 상태를 깨끗하게 유지한다.

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from datetime import date, datetime, timedelta, timezone
from typing import Optional

router = APIRouter(prefix="/stats", tags=["stats"])

TIME_SLOTS = ["morning", "lunch", "dinner"]
CATEGORY_COLORS = ["#4f46e5", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4"]
KST = timezone(timedelta(hours=9))


def _kst_today() -> date:
    """KST 기준 오늘 날짜.

    서비스 화면과 루틴 달성 판단은 한국 사용자 기준 날짜로 통일한다.
    기본 기간 계산, 최신 streak 비교, 365일 조회 기준이 모두 이 값을 사용한다.
    """
    return datetime.now(KST).date()


def _rate(done: int, total: int) -> int:
    if total <= 0:
        return 0
    return min(100, round((done / total) * 100))


def _parse_date(value: Optional[str], fallback: date) -> date:
    if not value:
        return fallback
    return datetime.strptime(value, "%Y-%m-%d").date()


def _date_range(start: date, end: date):
    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def _to_iso_date(value):
    if hasattr(value, "date"):
        return value.date().isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _calculate_streaks(completion_dates):
    sorted_dates = sorted({datetime.strptime(d, "%Y-%m-%d").date() for d in completion_dates})
    if not sorted_dates:
        return {"best_streak": 0, "latest_streak": 0}

    best = 1
    current = 1
    for idx in range(1, len(sorted_dates)):
        if sorted_dates[idx] == sorted_dates[idx - 1] + timedelta(days=1):
            current += 1
        else:
            best = max(best, current)
            current = 1
    best = max(best, current)

    latest = current if sorted_dates[-1] == _kst_today() else 0
    return {"best_streak": best, "latest_streak": latest}


def _build_chart(mode, days, completion_keys, routine_count):
    if mode == "monthly":
        chart = []
        for index in range(0, len(days), 7):
            chunk = days[index:index + 7]
            done = sum(1 for key in completion_keys if key[1] in {d.isoformat() for d in chunk})
            chart.append({
                "label": f"{(index // 7) + 1}주",
                "rate": _rate(done, routine_count * len(chunk)),
            })
        return chart

    labels = ["월", "화", "수", "목", "금", "토", "일"]
    return [
        {
            "label": labels[day.weekday()],
            "rate": _rate(
                sum(1 for key in completion_keys if key[1] == day.isoformat()),
                routine_count,
            ),
        }
        for day in days
    ]


@router.get("/{user_id}")
def get_stats(
    user_id: str,
    mode: str = Query("weekly", pattern="^(weekly|monthly)$"),
    start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    """상세 통계 조회.

    반환:
        total, chart, routine_stats, category_stats, best_streak/latest_streak.
    """
    # 주간/월간 기본 범위 산정 기준은 KST 오늘 날짜다.
    today = _kst_today()
    default_start = today - timedelta(days=today.weekday()) if mode == "weekly" else today.replace(day=1)
    default_end = default_start + timedelta(days=6) if mode == "weekly" else (
        today.replace(day=28) + timedelta(days=4)
    ).replace(day=1) - timedelta(days=1)

    start_date = _parse_date(start, default_start)
    end_date = _parse_date(end, default_end)
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end는 start보다 빠를 수 없습니다.")

    days = _date_range(start_date, end_date)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT routine_id, title, time_slot, category
                FROM routines
                WHERE user_id = %s
                  AND deleted_at IS NULL
                ORDER BY created_at DESC""",
                (user_id,)
            )
            routines = cursor.fetchall()

            routine_ids = {row["routine_id"] for row in routines}
            routine_by_id = {row["routine_id"]: row for row in routines}

            cursor.execute(
                """SELECT rc.routine_id, DATE(rc.completed_at) AS completed_date
                FROM routine_completions rc
                JOIN routines r ON rc.routine_id = r.routine_id
                WHERE rc.user_id = %s
                  AND rc.deleted_at IS NULL
                  AND r.deleted_at IS NULL
                  AND DATE(rc.completed_at) BETWEEN %s AND %s""",
                (user_id, start_date.isoformat(), end_date.isoformat())
            )
            completion_rows = cursor.fetchall()

            # streak 계산용 최근 365일 조회도 화면의 "오늘"과 같은 KST 기준을 쓴다.
            streak_cutoff = today - timedelta(days=365)
            cursor.execute(
                """SELECT DISTINCT DATE(completed_at) AS completed_date
                FROM routine_completions
                WHERE user_id = %s
                  AND deleted_at IS NULL
                  AND completed_at >= %s
                ORDER BY completed_date ASC""",
                (user_id, streak_cutoff.isoformat())
            )
            streak_dates = [_to_iso_date(row["completed_date"]) for row in cursor.fetchall()]

        completion_keys = {
            (row["routine_id"], _to_iso_date(row["completed_date"]))
            for row in completion_rows
            if row["routine_id"] in routine_ids
        }

        routine_count = len(routines)
        day_count = len(days)
        total = _rate(len(completion_keys), routine_count * day_count)

        routine_stats = {slot: [] for slot in TIME_SLOTS}
        for routine in routines:
            done_days = sum(1 for day in days if (routine["routine_id"], day.isoformat()) in completion_keys)
            routine_stats[routine["time_slot"]].append({
                "name": routine["title"],
                "rate": _rate(done_days, day_count),
            })

        category_map = {}
        for routine in routines:
            category = routine["category"] or "기타"
            category_map.setdefault(category, {"routine_ids": set(), "done": 0})
            category_map[category]["routine_ids"].add(routine["routine_id"])

        for routine_id, completed_date in completion_keys:
            routine = routine_by_id.get(routine_id)
            if not routine:
                continue
            category = routine["category"] or "기타"
            category_map[category]["done"] += 1

        category_stats = []
        for index, (category, data) in enumerate(category_map.items()):
            category_stats.append({
                "name": category,
                "rate": _rate(data["done"], len(data["routine_ids"]) * day_count),
                "color": CATEGORY_COLORS[index % len(CATEGORY_COLORS)],
            })

        streaks = _calculate_streaks(streak_dates)

        return {
            "mode": mode,
            "range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total": total,
            "chart": _build_chart(mode, days, completion_keys, routine_count),
            "routine_stats": routine_stats,
            "category_stats": category_stats,
            "best_streak": streaks["best_streak"],
            "latest_streak": streaks["latest_streak"],
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
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
