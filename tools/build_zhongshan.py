"""由 data/source/ 生成 data/zhongshan.js。

输入：
- data/source/zhongshan.txt：维基文库《山海經/中山經》原文，一段一行（繁体，未改动）。
- data/source/zhongshan_products.txt：人工整理的有名物产。
输出的原文转为简体（用 Windows 自带的 LCMapStringEx，所以本脚本只能在 Windows 上跑），
“穀/榖”不转，免得构树的“穀”变成山谷的“谷”。
"""
import ctypes
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source"
OUT = ROOT / "data" / "zhongshan.js"

# 维基文库底本中明显的录入错误：(段落号, 错, 对)
FIXES = [
    (15, "白甘棗", "自甘棗"),
    (208, "凡十萬山", "凡十五山"),
]

# 物产关键词（长词在前，命中后从文本里去掉，避免“黄金”再算一次“金”）
RES_WORDS = [
    "黃金", "赤金", "白金", "赤銅", "赤錫", "白錫", "青雄黃", "雄黃", "青雘", "丹雘", "丹粟", "㻬琈之玉",
    "蒼玉", "白玉", "美玉", "水玉", "金", "玉", "銀", "銅", "鐵", "錫", "堊", "赭", "砥礪", "礪石", "文石",
    "松柏", "梓枏", "桃枝", "竹箭", "竹", "桑", "漆", "橘櫾", "芍藥", "韭",
    "犀", "兕", "象", "虎", "豹", "麋", "鹿", "羬羊", "㸲牛", "人魚", "蛟", "鴆", "白鷮",
]
DIGITS = {c: i for i, c in enumerate("零一二三四五六七八九")}
UNITS = {"十": 10, "百": 100, "千": 1000}


def cn_int(s: str) -> int:
    """二十、百二十、千一百八十四、十有九、二萬一千……"""
    s = s.replace("有", "").replace("又", "")
    if "萬" in s:
        head, tail = s.split("萬", 1)
        return cn_int(head or "一") * 10000 + (cn_int(tail) if tail else 0)
    total, cur = 0, None
    for c in s:
        if c in UNITS:
            total += (1 if cur is None else cur) * UNITS[c]
            cur = None
        else:
            cur = DIGITS[c]
    return total + (cur or 0)


def to_simplified(s: str) -> str:
    keep = {"穀": "", "榖": ""}
    for k, v in keep.items():
        s = s.replace(k, v)
    LCMAP_SIMPLIFIED_CHINESE = 0x02000000
    fn = ctypes.windll.kernel32.LCMapStringEx
    n = fn("zh-CN", LCMAP_SIMPLIFIED_CHINESE, s, -1, None, 0, None, None, None)
    buf = ctypes.create_unicode_buffer(n)
    fn("zh-CN", LCMAP_SIMPLIFIED_CHINESE, s, -1, buf, n, None, None, None)
    out = buf.value
    for k, v in keep.items():
        out = out.replace(v, k)
    return out


CHAIN_HEAD = re.compile(r"^《(.+?)》(.*?)之首，曰(.+?)[，。]")
STEP = re.compile(r"^又?([東南西北]{1,2})([一二三四五六七八九十百千]+)里，?[曰有](.+?)[，。]")
TOTAL = re.compile(r"，凡([一二三四五六七八九十百千有萬]+)山，([一二三四五六七八九十百千萬]+)里")
GOD = re.compile(r"其神狀皆(.+?)。|其神皆(.+?)。|神者，皆(.+?)。")


def resources(text: str, name: str) -> list[str]:
    body = text.replace(name, "", 1)
    found = []
    for w in RES_WORDS:
        if w in body:
            found.append(w)
            body = body.replace(w, "")
    return found


def load_products() -> dict[int, list[dict]]:
    out: dict[int, list[dict]] = {}
    for line in (SRC / "zhongshan_products.txt").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        idx, name, kind, desc, effect, plain, tags = line.split("|")
        out.setdefault(int(idx), []).append({
            "name": name, "kind": kind, "desc": desc, "effect": effect, "plain": plain,
            "tags": [t for t in tags.split(",") if t],
        })
    return out


def main() -> int:
    paras = (SRC / "zhongshan.txt").read_text(encoding="utf-8").splitlines()
    for i, wrong, right in FIXES:
        assert wrong in paras[i], (i, wrong)
        paras[i] = paras[i].replace(wrong, right)
    products = load_products()

    chains, cur, used, errors = [], None, set(), []
    for i, p in enumerate(paras):
        head = CHAIN_HEAD.match(p)
        step = STEP.match(p)
        if head:
            n = len(chains) + 1
            title = "中山首經" if head[1] == "中山經" else head[1]
            cur = {"id": f"zhong{n}", "name": title, "alias": head[2] or "首陽山", "mountains": []}
            chains.append(cur)
            name, direction, li = head[3], None, 0
        elif step:
            direction, li, name = step[1], cn_int(step[2]), step[3]
        elif p.startswith("凡"):
            m, g = TOTAL.search(p), GOD.search(p)
            if not m:
                errors.append(f"{i}: 总结句解析失败")
                continue
            cur["stated"] = {"count": cn_int(m[1]), "li": cn_int(m[2])}
            cur["summary"] = p
            cur["god"] = next((x for x in g.groups() if x), "") if g else ""
            continue
        elif p.startswith("右中經"):
            closing = p
            continue
        elif p.startswith("大凡"):
            continue
        else:
            errors.append(f"{i}: 无法解析 {p[:20]}")
            continue
        used.add(i)
        cur["mountains"].append({
            "id": f"z{i}", "name": name, "dir": direction, "li": li, "text": p,
            "res": resources(p, name), "products": products.get(i, []),
        })

    orphans = sorted(set(products) - used)
    if orphans:
        errors.append(f"物产段落号不是山：{orphans}")
    if errors:
        print("\n".join(errors))
        return 1

    book = {"name": "中山經", "closing": closing, "chains": chains}
    js = "// 由 tools/build_zhongshan.py 生成，勿手改。\nwindow.ZHONGSHAN = " + json.dumps(book, ensure_ascii=False, indent=1) + ";\n"
    OUT.write_text(to_simplified(js), encoding="utf-8", newline="\n")
    total = sum(len(c["mountains"]) for c in chains)
    print(f"chains={len(chains)} mountains={total} products={sum(len(v) for v in products.values())}")
    for c in chains:
        print(c["id"], len(c["mountains"]), c["stated"], sum(m["li"] for m in c["mountains"]), repr(c["god"]).encode("unicode_escape").decode())
    return 0


if __name__ == "__main__":
    sys.exit(main())
