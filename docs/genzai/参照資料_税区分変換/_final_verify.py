#!/usr/bin/env python3
"""
tax-category-master.ts の最終検証
MF実機CSV（税区分設定.csv）と突合して正確性を確認
"""
import re
import csv

# === TS側読み込み ===
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    ts_content = f.read()

ts_entries = []
for m in re.finditer(
    r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*shortName:\s*'([^']+)',\s*direction:\s*'([^']+)',\s*qualified:\s*(true|false),\s*aiSelectable:\s*(true|false),\s*active:\s*(true|false),\s*defaultVisible:\s*(true|false),\s*deprecated:\s*(true|false),\s*effectiveFrom:\s*'([^']+)',\s*effectiveTo:\s*(?:'([^']+)'|(null)),\s*displayOrder:\s*(\d+)",
    ts_content
):
    ts_entries.append({
        "id": m.group(1),
        "name": m.group(2),
        "direction": m.group(4),
        "active": m.group(7),
        "defaultVisible": m.group(8),
        "effectiveFrom": m.group(10),
        "effectiveTo": m.group(11) or "null",
        "displayOrder": int(m.group(13)),
    })

# === MF実機CSV読み込み ===
mf_entries = []
with open("docs/genzai/税区分設定.csv", encoding="cp932") as f:
    reader = csv.DictReader(f)
    for row in reader:
        mf_entries.append({
            "name": row.get("名称", "").strip(),
            "active": row.get("使用", "").strip(),
        })

print(f"=== 件数 ===")
print(f"TS側: {len(ts_entries)}件")
print(f"MF実機CSV: {len(mf_entries)}件")

# === 1. 名称突合 ===
ts_names = set(e["name"] for e in ts_entries)
mf_names = set(e["name"] for e in mf_entries)

ts_only = ts_names - mf_names
mf_only = mf_names - ts_names

print(f"\n=== 名称突合 ===")
print(f"一致: {len(ts_names & mf_names)}件")
print(f"TS側のみ: {len(ts_only)}件 {ts_only if ts_only else ''}")
print(f"MF側のみ: {len(mf_only)}件 {mf_only if mf_only else ''}")

# === 2. active全件true確認 ===
active_false = [e for e in ts_entries if e["active"] != "true"]
print(f"\n=== active ===")
print(f"active=true: {len([e for e in ts_entries if e['active'] == 'true'])}件")
print(f"active=false: {len(active_false)}件")
if active_false:
    for e in active_false:
        print(f"  ❌ {e['id']}: {e['name']}")

# === 3. effectiveFrom/To の整合性 ===
print(f"\n=== effectiveFrom/To 整合性 ===")
errors = []
for e in ts_entries:
    name = e["name"]
    ef = e["effectiveFrom"]
    et = e["effectiveTo"]
    
    # 5%は1997-04-01 〜 2014-03-31
    if " 5%" in name and "_T6" not in e["id"]:
        if ef != "1997-04-01": errors.append(f"❌ {name}: effectiveFrom={ef} (期待: 1997-04-01)")
        if et != "2014-03-31": errors.append(f"❌ {name}: effectiveTo={et} (期待: 2014-03-31)")
    
    # 旧8%（軽減でない）は2014-04-01 〜 2019-09-30
    elif "8%" in name and "(軽)" not in name and "_T6" not in e["id"] and "7.8%" not in name and "1.76%" not in name and "6.24%" not in name:
        if " 8%" in name or name.endswith("8%"):
            if ef != "2014-04-01": errors.append(f"❌ {name}: effectiveFrom={ef} (期待: 2014-04-01)")
            if et != "2019-09-30": errors.append(f"❌ {name}: effectiveTo={et} (期待: 2019-09-30)")
    
    # 10%と軽減8%は2019-10-01 〜 null
    elif "10%" in name or "(軽)8%" in name or "7.8%" in name or "2.2%" in name or "6.24%" in name or "1.76%" in name:
        if "_T6" not in e["id"]:
            if ef != "2019-10-01": errors.append(f"❌ {name}: effectiveFrom={ef} (期待: 2019-10-01)")
            if et != "null": errors.append(f"❌ {name}: effectiveTo={et} (期待: null)")
    
    # 非課税/対象外/不明は1989-04-01 〜 null
    elif any(k in name for k in ["非課税", "対象外", "不明", "輸出"]) and "%" not in name:
        if ef != "1989-04-01": errors.append(f"❌ {name}: effectiveFrom={ef} (期待: 1989-04-01)")
        if et != "null": errors.append(f"❌ {name}: effectiveTo={et} (期待: null)")

if errors:
    print(f"エラー: {len(errors)}件")
    for err in errors:
        print(f"  {err}")
else:
    print("✅ 全件OK")

# === 4. displayOrder重複チェック ===
orders = [e["displayOrder"] for e in ts_entries]
dupes = [o for o in set(orders) if orders.count(o) > 1]
print(f"\n=== displayOrder重複 ===")
if dupes:
    print(f"❌ 重複あり: {dupes}")
else:
    print(f"✅ 重複なし（1〜{max(orders)}）")

# === 5. defaultVisible件数 ===
dv_true = len([e for e in ts_entries if e["defaultVisible"] == "true"])
dv_false = len([e for e in ts_entries if e["defaultVisible"] == "false"])
print(f"\n=== defaultVisible ===")
print(f"true: {dv_true}件（UIに表示）")
print(f"false: {dv_false}件（UIで非表示）")

# === 6. direction分布 ===
dirs = {}
for e in ts_entries:
    d = e["direction"]
    dirs[d] = dirs.get(d, 0) + 1
print(f"\n=== direction分布 ===")
for d, c in sorted(dirs.items()):
    print(f"  {d}: {c}件")

# === 7. MF実機CSVの使用フラグとの一致 ===
print(f"\n=== MF実機CSV使用フラグ ===")
mf_active_map = {e["name"]: e["active"] for e in mf_entries}
mismatch = []
for e in ts_entries:
    mf_active = mf_active_map.get(e["name"])
    if mf_active is not None:
        if mf_active != "1" and e["active"] == "true":
            mismatch.append(f"❌ {e['name']}: MF使用={mf_active}, TS active=true")
        elif mf_active == "1" and e["active"] != "true":
            mismatch.append(f"❌ {e['name']}: MF使用=1, TS active={e['active']}")

if mismatch:
    print(f"不一致: {len(mismatch)}件")
    for m in mismatch:
        print(f"  {m}")
else:
    print("✅ MF実機CSVとactive完全一致")

print(f"\n{'='*50}")
print(f"最終判定: ", end="")
if not active_false and not ts_only and not mf_only and not errors and not dupes and not mismatch:
    print("✅ 全検証パス")
else:
    issues = []
    if active_false: issues.append(f"active不正{len(active_false)}件")
    if ts_only: issues.append(f"TS側余剰{len(ts_only)}件")
    if mf_only: issues.append(f"MF側欠損{len(mf_only)}件")
    if errors: issues.append(f"日付不整合{len(errors)}件")
    if dupes: issues.append(f"displayOrder重複")
    if mismatch: issues.append(f"使用フラグ不一致{len(mismatch)}件")
    print(f"⚠️ 要確認: {', '.join(issues)}")
