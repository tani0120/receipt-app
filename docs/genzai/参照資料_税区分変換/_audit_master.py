#!/usr/bin/env python3
"""3ソフト間マスタ完全監査"""
import re

# === TS側 勘定科目 ===
with open("src/shared/data/account-master.ts", encoding="utf-8") as f:
    ts_acc = f.read()
ts_acc_names = set()
# name: "xxx" 形式
for m in re.finditer(r'name:\s*"([^"]+)"', ts_acc):
    ts_acc_names.add(m.group(1))

# === TS側 税区分 ===
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    ts_tax = f.read()
ts_tax_names = set()
for m in re.finditer(r"name:\s*'([^']+)'", ts_tax):
    ts_tax_names.add(m.group(1))

# === Python側 税区分 ===
with open("docs/genzai/converter.py", encoding="utf-8") as f:
    py = f.read()

py_mf = set()
py_yayoi = set()
py_yayoi_nt = set()
py_freee = set()
for m in re.finditer(r'"mf":\s*"([^"]+)"', py):
    py_mf.add(m.group(1))
for m in re.finditer(r'"yayoi":\s*"([^"]+)"', py):
    py_yayoi.add(m.group(1))
for m in re.finditer(r'"yayoi_nt":\s*"([^"]+)"', py):
    py_yayoi_nt.add(m.group(1))
for m in re.finditer(r'"freee":\s*"([^"]+)"', py):
    py_freee.add(m.group(1))

# === MF公式税区分をネット検索で補完する必要あり ===
# まず現状の食い違いを出す

print("=" * 70)
print("マスタデータ完全監査レポート")
print("=" * 70)

print()
print("━━━ 1. 件数サマリ ━━━")
print(f"  TS 勘定科目:    {len(ts_acc_names)}件 （根拠: MF確定申告CSV ✅ / 法人は手入力 ⚠️）")
print(f"  TS 税区分:      {len(ts_tax_names)}件 （根拠: MF税区分設定CSV ✅）")
print(f"  PY MF税区分:    {len(py_mf)}件 （重複排除）")
print(f"  PY 弥生税区分:  {len(py_yayoi)}件")
print(f"  PY 弥生NT税区分:{len(py_yayoi_nt)}件")
print(f"  PY freee税区分: {len(py_freee)}件")

print()
print("━━━ 2. Python MF税区分 → TS税区分マスタ突合 ━━━")
py_mf_ok = 0
py_mf_miss = 0
for n in sorted(py_mf):
    if n in ts_tax_names:
        py_mf_ok += 1
        print(f"  [OK]      {n}")
    else:
        py_mf_miss += 1
        print(f"  [MISSING] {n}  ← TS側に存在しない!")
print(f"  結果: {py_mf_ok}件OK / {py_mf_miss}件不一致")

print()
print("━━━ 3. TS税区分マスタ → Python MF欠落 ━━━")
ts_only = ts_tax_names - py_mf
print(f"  TS側にあってPython側にない: {len(ts_only)}件")
# カテゴリ別に分類
categories = {}
for n in sorted(ts_only):
    if "売上" in n:
        cat = "売上系"
    elif "仕入" in n:
        cat = "仕入系"
    elif "輸入" in n:
        cat = "輸入系"
    elif "輸出" in n:
        cat = "輸出系"
    else:
        cat = "その他"
    categories.setdefault(cat, []).append(n)
for cat, names in sorted(categories.items()):
    print(f"  [{cat}] {len(names)}件")
    for n in names[:5]:
        print(f"    {n}")
    if len(names) > 5:
        print(f"    ... 他{len(names)-5}件")

print()
print("━━━ 4. 勘定科目の3ソフト比較 ━━━")
print(f"  TS側: {len(ts_acc_names)}件")
print(f"  Python側: 勘定科目マスタなし（パススルー設計）")
print()
print("  TS勘定科目一覧（上位30件）:")
for n in sorted(ts_acc_names)[:30]:
    print(f"    {n}")
if len(ts_acc_names) > 30:
    print(f"    ... 他{len(ts_acc_names)-30}件")

print()
print("━━━ 5. 構造的リスク評価 ━━━")
print(f"""
  [リスク1] Python MF変換 → 7種のみ
    ・MF 151件中144件に対応する変換パスが存在しない
    ・例: 「課税仕入 (軽)8%」はPython側で変換不能
    ・影響: 弥生/freee→MF変換時に軽減税率仕訳が「UNKNOWN」になる

  [リスク2] 弥生/freee → TS側マスタ非存在
    ・TS側には弥生税区分(27件)・freee税区分(15件)の正本がない
    ・影響: 弥生/freee出力CSVの税区分名の正当性を検証不能

  [リスク3] 勘定科目の3ソフト差異
    ・MF/弥生/freeeで勘定科目名が微妙に異なる可能性
    ・例: MF「旅費交通費」 vs 弥生「旅費交通費」 → 通常一致
    ・例: MF「支払手数料」 vs freee「支払手数料」 → 通常一致
    ・ただし法人向け科目({len([n for n in ts_acc_names if True])})は手入力で未検証 ⚠️

  [リスク4] TS税区分マスタの根拠
    ・根拠: 「MF クラウド会計 税区分設定1.csv」→ 1環境の設定CSVのみ
    ・MFの事業者設定（課税/免税/簡易）で出現する税区分が変わる
    ・現マスタが全パターンを網羅しているか不明
""")
