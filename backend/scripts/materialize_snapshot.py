from __future__ import annotations

from backend.app.services.snapshot_service import build_snapshot


def main() -> None:
    bundle = build_snapshot(force_refresh=True)
    print(f'Materialized snapshot at {bundle.generated_at.isoformat()} with {len(bundle.alerts)} alerts.')


if __name__ == '__main__':
    main()
