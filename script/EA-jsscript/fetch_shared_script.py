import argparse
import os
import re
import ssl
import sys
from urllib import request, error


def normalize_url(url: str):
    url = url.strip()
    m = re.match(r"^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$", url, re.IGNORECASE)
    if not m:
        return [url]

    owner, repo, branch, rel_path = m.group(1), m.group(2), m.group(3), m.group(4)
    candidates = [
        url,
        f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{rel_path}",
        f"https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{rel_path}",
        f"{url}?raw=1",
    ]

    lower_branch = branch.lower()
    if lower_branch == "main":
        candidates.append(f"https://raw.githubusercontent.com/{owner}/{repo}/master/{rel_path}")
        candidates.append(f"https://cdn.jsdelivr.net/gh/{owner}/{repo}@master/{rel_path}")
    elif lower_branch == "master":
        candidates.append(f"https://raw.githubusercontent.com/{owner}/{repo}/main/{rel_path}")
        candidates.append(f"https://cdn.jsdelivr.net/gh/{owner}/{repo}@main/{rel_path}")

    seen = set()
    deduped = []
    for item in candidates:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped


def fetch_text(url: str, timeout: int):
    req = request.Request(url, headers={"User-Agent": "EA-Bootstrap-Fetcher/1.0"})
    context = ssl.create_default_context()
    with request.urlopen(req, timeout=timeout, context=context) as resp:
        status = getattr(resp, "status", 200)
        if status < 200 or status >= 300:
            raise RuntimeError(f"HTTP {status}")
        raw = resp.read()
        return raw.decode("utf-8", errors="replace")


def main():
    parser = argparse.ArgumentParser(description="Fetch shared EA script from URL and save locally")
    parser.add_argument("--url", required=True, help="Shared script URL")
    parser.add_argument("--out", required=True, help="Local output path")
    parser.add_argument("--timeout", type=int, default=20, help="Request timeout seconds")
    args = parser.parse_args()

    out_path = os.path.abspath(args.out)
    out_dir = os.path.dirname(out_path)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    last_error = None
    candidates = normalize_url(args.url)
    for candidate in candidates:
        print(f"TRY {candidate}")
        try:
            text = fetch_text(candidate, args.timeout)
            if not text.strip():
                raise RuntimeError("Empty response body")
            with open(out_path, "w", encoding="utf-8", newline="") as f:
                f.write(text)
            print(f"OK saved to {out_path}")
            return 0
        except Exception as ex:  # noqa: BLE001
            last_error = ex
            print(f"WARN {candidate} -> {ex}")

    print(f"ERROR all candidates failed. last={last_error}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
