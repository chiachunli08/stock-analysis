from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.stock_list", "tasks.stock_price", "tasks.financial_report", "tasks.indicators"]
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Taipei",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

app.conf.beat_schedule = {
    "fetch-daily-price": {
        "task": "tasks.stock_price.fetch_all_daily_prices",
        "schedule": crontab(hour=18, minute=30),
    },
    "fetch-quarterly-reports": {
        "task": "tasks.financial_report.fetch_all_reports",
        "schedule": crontab(day_of_week=6, hour=2, minute=0),
    },
    "calculate-indicators": {
        "task": "tasks.indicators.calculate_all",
        "schedule": crontab(hour=3, minute=0),
    },
    "update-trend-analysis": {
        "task": "tasks.indicators.update_trend_analysis",
        "schedule": crontab(hour=4, minute=0),
    },
}

if __name__ == "__main__":
    app.start()
