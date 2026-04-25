#!/usr/bin/env python3
"""TS側とPython側のMF税区分名称突合スクリプト"""
import re

# Python側: converter.pyのTaxCodeMaster._TABLEからmf列を全抽出
with open("docs/genzai/converter.py", encoding="utf-8") as f:
    content = f.read()
py_mf_names = set()
for m in re.finditer(r'"mf":\s*"([^"]+)"', content):
    py_mf_names.add(m.group(1))

# TS側: tax-category-master.tsのnameを全抽出
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    ts_content = f.read()
ts_names = set()
for m in re.finditer(r"name:\s*'([^']+)'", ts_content):
    ts_names.add(m.group(1))

print("=== Python側 MF税区分名 vs TS側マスタ ===")
for n in sorted(py_mf_names):
    mark = "OK" if n in ts_names else "MISSING_IN_TS"
    print(f"  [{mark}] {n}")

print()
print("=== TS側にあってPython側にないMF税区分 ===")
diff = ts_names - py_mf_names
for n in sorted(diff):
    print(f"  {n}")

print()
print(f"Python側: {len(py_mf_names)}件")
print(f"TS側: {len(ts_names)}件")
print(f"Python→TSで不一致: {len(py_mf_names - ts_names)}件")
print(f"TS→Pythonで不足: {len(diff)}件")
