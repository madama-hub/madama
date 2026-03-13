from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv('MADAMA_APP_NAME', 'MADAMA Backend')
    environment: str = os.getenv('MADAMA_ENVIRONMENT', 'development')
    database_url: str = os.getenv(
        'MADAMA_DATABASE_URL',
        'postgresql+psycopg://madama:madama@localhost:5432/madama',
    )
    abuseipdb_api_key: str | None = os.getenv('ABUSEIPDB_API_KEY')
    openai_api_key: str | None = os.getenv('OPENAI_API_KEY')
    snapshot_ttl_seconds: int = int(os.getenv('MADAMA_SNAPSHOT_TTL_SECONDS', '45'))
    snapshot_dir: Path = Path(
        os.getenv(
            'MADAMA_SNAPSHOT_DIR',
            str(Path(__file__).resolve().parents[1] / 'data'),
        )
    )
    default_center_lat: float = float(os.getenv('MADAMA_DEFAULT_CENTER_LAT', '30.2747'))
    default_center_lng: float = float(os.getenv('MADAMA_DEFAULT_CENTER_LNG', '-97.7403'))
    allow_db_bootstrap: bool = os.getenv('MADAMA_ALLOW_DB_BOOTSTRAP', 'true').lower() == 'true'


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.snapshot_dir.mkdir(parents=True, exist_ok=True)
    return settings
