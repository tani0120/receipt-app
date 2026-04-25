#!/usr/bin/env python3
"""
tax-category-master.ts を一括修正:
1. active: false → active: true（全78件）
2. effectiveFrom/effectiveTo を正しい施行日に修正
"""
import re

with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    content = f.read()

# === 1. active: false → active: true（全件） ===
content = content.replace("active: false,", "active: true,")

# === 2. effectiveFrom/effectiveTo を正しい施行日に修正 ===
# 税率→施行日の対応表
# 5%: 1997-04-01 〜 2014-03-31
# 8%(旧・非軽減）: 2014-04-01 〜 2019-09-30
# (軽)8%: 2019-10-01 〜 null
# 10%: 2019-10-01 〜 null
# 0%（輸出）: 1989-04-01 〜 null
# 対象外/非課税/不明: 1989-04-01 〜 null
# 簡易一種〜五種: 1997-04-01 〜 null（五種は1997追加）
# 簡易六種: 2015-04-01 〜 null（2015年追加）

def fix_effective_dates(line):
    """1行ごとに適切なeffectiveFrom/effectiveToを設定"""
    # name を抽出
    name_match = re.search(r"name:\s*'([^']+)'", line)
    if not name_match:
        return line
    name = name_match.group(1)
    
    # id を抽出
    id_match = re.search(r"id:\s*'([^']+)'", line)
    if not id_match:
        return line
    tid = id_match.group(1)
    
    # デフォルト（現行税率）
    from_date = '2019-10-01'
    to_date = 'null'
    
    # --- 対象外/不明/非課税（税率なし）→ 消費税導入時から ---
    if tid in ('COMMON_UNKNOWN', 'COMMON_EXEMPT'):
        from_date = '1989-04-01'
        to_date = 'null'
    elif 'NON_TAXABLE' in tid or 'EXEMPT' in tid or 'EXPORT' in tid:
        from_date = '1989-04-01'
        to_date = 'null'
    # --- 5%系 ---
    elif ' 5%' in name or '_5' in tid:
        from_date = '1997-04-01'
        to_date = '2014-03-31'
    # --- 旧8%（軽減でない8%）---
    elif ('8%' in name and '(軽)' not in name) or ('_8' in tid and 'REDUCED' not in tid):
        from_date = '2014-04-01'
        to_date = '2019-09-30'
    # --- 軽減8% ---
    elif '(軽)8%' in name or 'REDUCED_8' in tid:
        from_date = '2019-10-01'
        to_date = 'null'
    # --- 10% ---
    elif '10%' in name or '_10' in tid:
        from_date = '2019-10-01'
        to_date = 'null'
    # --- 輸入仕入（税率は本体の税率に依存）---
    # 地方消費税額 1%/1.7%/2.2%/1.76% → 率で判断
    elif '1%' in name or '4%' in name:
        # 旧地方消費税/旧国税
        from_date = '1997-04-01'
        to_date = '2014-03-31'
    elif '1.7%' in name or '6.3%' in name:
        from_date = '2014-04-01'
        to_date = '2019-09-30'
    elif '2.2%' in name or '7.8%' in name:
        from_date = '2019-10-01'
        to_date = 'null'
    elif '1.76%' in name or '6.24%' in name:
        from_date = '2019-10-01'
        to_date = 'null'
    
    # --- 簡易課税六種の特別対応（2015年追加） ---
    if '_T6' in tid:
        from_date = '2015-04-01'
        to_date = 'null'
    
    # effectiveFromを置換
    line = re.sub(
        r"effectiveFrom:\s*'[^']*'",
        f"effectiveFrom: '{from_date}'",
        line
    )
    # effectiveToを置換
    if to_date == 'null':
        line = re.sub(
            r"effectiveTo:\s*(?:'[^']*'|null)",
            "effectiveTo: null",
            line
        )
    else:
        line = re.sub(
            r"effectiveTo:\s*(?:'[^']*'|null)",
            f"effectiveTo: '{to_date}'",
            line
        )
    
    return line

# 行ごとに処理
lines = content.split('\n')
new_lines = []
for line in lines:
    if 'effectiveFrom:' in line:
        line = fix_effective_dates(line)
    new_lines.append(line)

content = '\n'.join(new_lines)

# === 3. コメントのactive説明を更新 ===
content = content.replace(
    " * active: 「使用」列が1のものtrue",
    " * active: MF実機CSV（使用列=1）準拠。全151件true。UI表示はdefaultVisibleで制御"
)

with open("src/shared/data/tax-category-master.ts", "w", encoding="utf-8") as f:
    f.write(content)

# === 検証 ===
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    result = f.read()

active_false = result.count("active: false")
active_true = result.count("active: true")
print(f"active=true: {active_true}件")
print(f"active=false: {active_false}件")

# effectiveDatesの分布
dates = {}
for m in re.finditer(r"effectiveFrom:\s*'([^']+)'", result):
    d = m.group(1)
    dates[d] = dates.get(d, 0) + 1
print("\neffectiveFrom分布:")
for d in sorted(dates.keys()):
    print(f"  {d}: {dates[d]}件")

to_dates = {}
for m in re.finditer(r"effectiveTo:\s*(?:'([^']+)'|(null))", result):
    d = m.group(1) or 'null'
    to_dates[d] = to_dates.get(d, 0) + 1
print("\neffectiveTo分布:")
for d in sorted(to_dates.keys()):
    print(f"  {d}: {to_dates[d]}件")

# 5%の例を出力
print("\n=== 5%系のサンプル ===")
for line in result.split('\n'):
    if " 5%" in line and "name:" in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        if name and ef:
            print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et.group(1) else 'null'}")
        if sum(1 for _ in []) > 3:
            break
