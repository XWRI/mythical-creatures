"""把 data/illustrations.js 里引用的 Commons 插图下载到 assets/illustrations/。

用法：python tools/fetch_illustrations.py [--width 480] [--force]
本地文件名 = local_name(Commons 文件名)，与 app.js 的 localImg() 保持一致。
"""
import argparse
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "illustrations.js"
OUT = ROOT / "assets" / "illustrations"
UA = "ShanHaiJingAtlas/0.1 (personal prototype; contact via repo owner)"


def local_name(file: str) -> str:
    # 与 app.js 一致：空格换成下划线，SVG 由 Commons 渲染成 PNG
    name = file.replace(" ", "_")
    return re.sub(r"\.svg$", ".png", name, flags=re.I)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=480)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    files = sorted(set(re.findall(r'"([^"]+\.(?:jpg|jpeg|png|svg))"', DATA.read_text(encoding="utf-8"), re.I)))
    OUT.mkdir(parents=True, exist_ok=True)
    failed = 0
    for i, f in enumerate(files, 1):
        dest = OUT / local_name(f)
        if dest.exists() and not args.force:
            print(f"[{i}/{len(files)}] skip (exists)")
            continue
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(f) + f"?width={args.width}"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            dest.write_bytes(data)
            print(f"[{i}/{len(files)}] ok {len(data) // 1024} KB")
        except Exception as e:  # noqa: BLE001 — 打印后继续下一张
            failed += 1
            print(f"[{i}/{len(files)}] FAIL {e}")
        time.sleep(0.5)  # 对 Commons 客气一点
    print(f"done: {len(files) - failed}/{len(files)} in {OUT.relative_to(ROOT)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
