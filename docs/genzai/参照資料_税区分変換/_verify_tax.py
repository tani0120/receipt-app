#!/usr/bin/env python3
"""5%+六種の矛盾修正 & 最終検証"""
import re

with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    content = f.read()

# 5%+六種 → 実際には存在しない組み合わせ。effectiveTo: nullは不正
# MFでは登録されているが使われない。effectiveTo: null→ '2014-03-31' に修正
# ただしT6は2015年追加なので 5%+T6は本来ありえない → effectiveFrom: '2015-04-01', effectiveTo: '2015-04-01'（即無効）
# MFに存在はするので削除はしない。実質使われない設定にする

lines = content.split('\n')
new_lines = []
for line in lines:
    # 5%でT6の行を検出
    if '_T6' in line and (" 5%" in line or "_5_T6" in line or "_5_" in line):
        name_m = re.search(r"name:\s*'([^']+)'", line)
        if name_m and '5%' in name_m.group(1):
            # 5%+六種: MF上の表記上存在するが実運用なし
            # effectiveFrom→2015-04-01(六種追加日)、effectiveTo→2015-04-01(5%は既に廃止済み)
            line = re.sub(r"effectiveTo:\s*null", "effectiveTo: null", line)
            # 実はMFに登録されている以上nullのままにする（MFの仕様通り）
    new_lines.append(line)

content = '\n'.join(new_lines)

# === 最終検証 ===
print("=== 最終検証 ===")

# active確認
at = content.count("active: true")
af = content.count("active: false")
print(f"active: true={at}件 false={af}件")

# 10%系サンプル
print("\n--- 10%系(仕入) ---")
for line in content.split('\n'):
    if '課税仕入 10%' in line and "name:" in line and '_T' not in line and 'RETURN' not in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")

# 軽減8%サンプル
print("\n--- 軽減8% ---")
for line in content.split('\n'):
    if '(軽)8%' in line and "name:" in line and '_T' not in line and 'RETURN' not in line and 'DEBT' not in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")

# 旧8%サンプル
print("\n--- 旧8% ---")
for line in content.split('\n'):
    if '8%' in line and '(軽)' not in line and "name:" in line and '_T' not in line and 'RETURN' not in line and 'DEBT' not in line and '7.8%' not in line and '1.76%' not in line and '6.24%' not in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        if name and ef:
            print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")

# 非課税/対象外サンプル
print("\n--- 非課税/対象外 ---")
for line in content.split('\n'):
    if ('非課税' in line or '対象外' in line or '不明' in line) and "name:" in line and '仕入' not in line and '輸入' not in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        if name and ef:
            print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")

# 六種サンプル
print("\n--- 六種(T6) ---")
for line in content.split('\n'):
    if '_T6' in line and "name:" in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        if name and ef:
            print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")

# 輸入系サンプル
print("\n--- 輸入系 ---")
for line in content.split('\n'):
    if '輸入' in line and "name:" in line and '_T' not in line:
        name = re.search(r"name:\s*'([^']+)'", line)
        ef = re.search(r"effectiveFrom:\s*'([^']+)'", line)
        et = re.search(r"effectiveTo:\s*(?:'([^']+)'|(null))", line)
        if name and ef:
            print(f"  {name.group(1)} → {ef.group(1)} 〜 {et.group(1) if et and et.group(1) else 'null'}")
