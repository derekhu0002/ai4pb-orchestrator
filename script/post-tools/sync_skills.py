from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def sync_directory(source_dir: Path, target_dir: Path) -> None:
    if not source_dir.is_dir():
        raise FileNotFoundError(f"Skill source directory not found: {source_dir}")

    if target_dir.exists():
        shutil.rmtree(target_dir)

    target_dir.mkdir(parents=True, exist_ok=True)

    for item in source_dir.iterdir():
        destination = target_dir / item.name
        if item.is_dir():
            shutil.copytree(item, destination)
        else:
            shutil.copy2(item, destination)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Synchronize source skills into .github/skills and .opencode/skills."
    )
    parser.add_argument(
        "--workspace",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Workspace root directory. Defaults to the repository root.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    workspace = args.workspace.resolve()
    source_dir = workspace / "skills"
    targets = [workspace / ".github" / "skills", workspace / ".opencode" / "skills"]

    print(f"Workspace: {workspace}")
    print(f"Source: {source_dir}")

    for target_dir in targets:
        sync_directory(source_dir, target_dir)
        print(f"Synchronized: {target_dir}")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())