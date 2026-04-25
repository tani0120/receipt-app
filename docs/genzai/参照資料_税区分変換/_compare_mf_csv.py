#!/usr/bin/env python3
"""MF税区分設定CSV vs TS税区分マスタ 完全突合"""
import csv
import re

# === MF実機CSV ===
mf_csv_names = {}
with open("docs/genzai/税区分設定.csv", encoding="cp932", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["名称"]
        active = row["使用"] == "1"
        mf_csv_names[name] = active

# === TS側マスタ ===
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    ts_content = f.read()

ts_entries = []
for m in re.finditer(
    r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',.*?active:\s*(true|false)",
    ts_content, re.DOTALL
):
    ts_entries.append({
        "id": m.group(1),
        "name": m.group(2),
        "active": m.group(3) == "true"
    })

ts_names = {e["name"]: e for e in ts_entries}

print("=" * 70)
print("MF税区分設定CSV vs TS税区分マスタ 突合結果")
print("=" * 70)

print(f"\nMF CSV: {len(mf_csv_names)}件")
print(f"TS マスタ: {len(ts_entries)}件")

# --- 1. 名称一致チェック ---
print("\n━━━ 1. CSV→TS 突合（CSVにあってTSにないもの）━━━")
csv_only = []
for name, active in sorted(mf_csv_names.items()):
    if name not in ts_names:
        csv_only.append((name, active))
        mark = "有効" if active else "無効"
        print(f"  [CSVのみ] {name} ({mark})")
if not csv_only:
    print("  なし ✅")
print(f"  計: {len(csv_only)}件")

print("\n━━━ 2. TS→CSV 突合（TSにあってCSVにないもの）━━━")
ts_only = []
for name in sorted(ts_names.keys()):
    if name not in mf_csv_names:
        ts_only.append(name)
        print(f"  [TSのみ] {name} (id={ts_names[name]['id']})")
if not ts_only:
    print("  なし ✅")
print(f"  計: {len(ts_only)}件")

# --- 3. active状態の差異 ---
print("\n━━━ 3. 使用フラグ差異（両方にあるが active が違う）━━━")
diff_active = 0
for name in sorted(mf_csv_names.keys()):
    if name in ts_names:
        csv_active = mf_csv_names[name]
        ts_active = ts_names[name]["active"]
        if csv_active != ts_active:
            diff_active += 1
            print(f"  [{name}] CSV={csv_active} TS={ts_active}")
if diff_active == 0:
    print("  なし ✅")
print(f"  計: {diff_active}件")

# --- 4. サマリ ---
print("\n━━━ 4. サマリ ━━━")
both = len(mf_csv_names) - len(csv_only)
print(f"  両方に存在: {both}件")
print(f"  CSVのみ: {len(csv_only)}件")
print(f"  TSのみ: {len(ts_only)}件")
print(f"  active差異: {diff_active}件")

if len(csv_only) == 0 and len(ts_only) == 0 and diff_active == 0:
    print("\n  ✅ 完全一致!")
else:
    print("\n  ⚠️ 差異あり — 対応が必要")
