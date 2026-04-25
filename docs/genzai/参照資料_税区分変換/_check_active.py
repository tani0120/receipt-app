#!/usr/bin/env python3
import re
with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    c = f.read()
entries = re.findall(r"active:\s*(true|false),\s*defaultVisible:\s*(true|false)", c)
at = sum(1 for a,d in entries if a=='true')
af = sum(1 for a,d in entries if a=='false')
dt = sum(1 for a,d in entries if d=='true')
df = sum(1 for a,d in entries if d=='false')
print(f"全{len(entries)}件")
print(f"active=true: {at}件 / active=false: {af}件")
print(f"defaultVisible=true: {dt}件 / defaultVisible=false: {df}件")
print()
print("=== active=false の税区分（上位20件）===")
count = 0
for m in re.finditer(r"name:\s*'([^']+)'.*?active:\s*(false).*?defaultVisible:\s*(true|false)", c, re.DOTALL):
    count += 1
    if count <= 20:
        print(f"  {m.group(1)}  (defaultVisible={m.group(3)})")
print(f"  ... 計{count}件")
