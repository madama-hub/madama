from __future__ import annotations

import argparse
import time

from backend.app.services.snapshot_service import build_snapshot


def main() -> None:
    parser = argparse.ArgumentParser(description='Collect MADAMA snapshots on a fixed interval.')
    parser.add_argument('--interval', type=int, default=300, help='Seconds between collections (default: 300)')
    parser.add_argument('--iterations', type=int, default=0, help='How many iterations to run (0 = infinite)')
    args = parser.parse_args()

    completed = 0

    try:
        while True:
            bundle = build_snapshot(force_refresh=True)
            completed += 1
            print(
                f"[{bundle.generated_at.isoformat()}] collected snapshot with "
                f"{len(bundle.features)} regions and {len(bundle.alerts)} alerts"
            )

            if args.iterations and completed >= args.iterations:
                break

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print('Collector stopped by user.')


if __name__ == '__main__':
    main()