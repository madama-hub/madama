from __future__ import annotations

from backend.app.services.snapshot_service import build_snapshot


def main() -> None:
    bundle = build_snapshot(force_refresh=True)
    print(bundle.metrics.model_dump_json(indent=2))


if __name__ == '__main__':
    main()
