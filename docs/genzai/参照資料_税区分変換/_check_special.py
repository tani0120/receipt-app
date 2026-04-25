#!/usr/bin/env python3
import re
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    content = f.read()

sp = [m.group(1) for m in re.finditer(r"name:\s*'([^']*特定[^']*)',", content)]
print("=== 特定課税仕入（法人特有の可能性）===")
for s in sp: print(f"  {s}")
print(f"  計: {len(sp)}件")

kantan = [m.group(1) for m in re.finditer(r"name:\s*'([^']*[一二三四五六]種[^']*)',", content)]
print(f"\n=== 簡易課税区分（一種〜六種）===")
print(f"  計: {len(kantan)}件")

yunyu = [m.group(1) for m in re.finditer(r"name:\s*'([^']*輸入[^']*)',", content)]
print(f"\n=== 輸入仕入 ===")
print(f"  計: {len(yunyu)}件")

yushutsu = [m.group(1) for m in re.finditer(r"name:\s*'([^']*輸出[^']*|[^']*非課税資産[^']*)',", content)]
print(f"\n=== 輸出/非課税資産 ===")
for s in yushutsu: print(f"  {s}")
print(f"  計: {len(yushutsu)}件")
