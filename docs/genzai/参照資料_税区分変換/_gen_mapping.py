#!/usr/bin/env python3
"""
TS税区分マスタ151件から3ソフト間対応表を自動生成する

MF名（正本）→ 弥生名（税込/税抜）、freee名を命名規則から導出
"""
import re
import json

with open("src/shared/data/tax-category-master.ts", encoding="utf-8") as f:
    content = f.read()

entries = []
for m in re.finditer(
    r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*shortName:\s*'([^']+)',\s*direction:\s*'([^']+)'",
    content
):
    entries.append({
        "id": m.group(1),
        "mf_name": m.group(2),
        "short_name": m.group(3),
        "direction": m.group(4),
    })

print(f"TS税区分マスタ: {len(entries)}件\n")

def mf_to_yayoi_tax_incl(mf_name):
    """MF名 → 弥生名（税込）の変換規則"""
    n = mf_name
    # 対象外/不明 → そのまま
    if n in ("対象外", "不明"): return n
    # 非課税売上系
    if n == "非課税売上": return "非課売上"
    if n == "非課税売上-有価証券譲渡": return "非課売上-有証"
    if n == "非課税売上-返還等": return "非課売返"
    if n == "非課税売上-貸倒": return "非課貸倒"
    if n == "非課税仕入": return "非課仕入"
    if n == "非課税資産輸出": return "非課輸出"
    if n == "非課税資産輸出-返還等": return "非課輸出-返還"
    if n == "非課税資産輸出-貸倒": return "非課輸出-貸倒"
    if n == "対象外売上": return "対外売上"
    if n == "対象外仕入": return "対外仕入"
    if n.startswith("輸出売上"): return n.replace("輸出売上", "輸出売上")
    
    # 課税売上 → 課税売上込
    if n.startswith("課税売上-返還等"):
        return n.replace("課税売上-返還等", "課税売返込")
    if n.startswith("課税売上-貸倒回収"):
        return n.replace("課税売上-貸倒回収", "貸倒回収込")
    if n.startswith("課税売上-貸倒"):
        return n.replace("課税売上-貸倒", "課税貸倒込")
    if n.startswith("課税売上"):
        return n.replace("課税売上", "課税売上込")
    
    # 課税仕入 → 課対仕入込
    if n.startswith("課税仕入-返還等"):
        return n.replace("課税仕入-返還等", "課対仕返込")
    if n.startswith("課税仕入"):
        return n.replace("課税仕入", "課対仕入込")
    
    # 共通課税仕入 → 共対仕入込
    if n.startswith("共通課税仕入-返還等"):
        return n.replace("共通課税仕入-返還等", "共対仕返込")
    if n.startswith("共通課税仕入"):
        return n.replace("共通課税仕入", "共対仕入込")
    
    # 非課税対応仕入 → 非対仕入込
    if n.startswith("非課税対応仕入-返還等"):
        return n.replace("非課税対応仕入-返還等", "非対仕返込")
    if n.startswith("非課税対応仕入"):
        return n.replace("非課税対応仕入", "非対仕入込")
    
    # 特定課税仕入（リバースチャージ）
    if n.startswith("共通特定課税仕入-返還等"):
        return n.replace("共通特定課税仕入-返還等", "共特定仕返")
    if n.startswith("共通特定課税仕入"):
        return n.replace("共通特定課税仕入", "共特定仕入")
    if n.startswith("非課税対応特定課税仕入-返還等"):
        return n.replace("非課税対応特定課税仕入-返還等", "非特定仕返")
    if n.startswith("非課税対応特定課税仕入"):
        return n.replace("非課税対応特定課税仕入", "非特定仕入")
    if n.startswith("特定課税仕入-返還等"):
        return n.replace("特定課税仕入-返還等", "特定仕返")
    if n.startswith("特定課税仕入"):
        return n.replace("特定課税仕入", "特定仕入")
    
    # 輸入仕入
    if "輸入仕入" in n:
        r = n
        r = r.replace("共通輸入仕入", "共対輸")
        r = r.replace("非課税対応輸入", "非対輸")
        r = r.replace("輸入仕入", "課対輸")
        r = r.replace("-本体", "本込")
        r = r.replace("-消費税額", "税込")
        r = r.replace("-地方消費税額", "地込")
        return r
    
    # 軽減税率表記の変換: (軽)8% → 軽減8%
    # 弥生では「軽減8%」と表記
    
    return n  # フォールバック

def yayoi_incl_to_excl(yayoi_incl):
    """弥生税込 → 弥生税抜への変換"""
    return yayoi_incl.replace("込", "内")

def mf_to_freee(mf_name):
    """MF名 → freee名の変換規則"""
    n = mf_name
    if n in ("対象外", "不明"): return n
    if n == "非課税売上": return "非課売上"
    if n == "非課税仕入": return "非課仕入"
    if n == "対象外売上": return "対外売上"
    if n == "対象外仕入": return "対外仕入"
    
    # 課税売上 → 課売
    if n.startswith("課税売上-返還等"):
        return n.replace("課税売上-返還等", "課売返還")
    if n.startswith("課税売上-貸倒回収"):
        return n.replace("課税売上-貸倒回収", "貸倒回収")
    if n.startswith("課税売上-貸倒"):
        return n.replace("課税売上-貸倒", "貸倒")
    if n.startswith("課税売上"):
        return n.replace("課税売上", "課売")
    
    # 課税仕入 → 課対仕入
    if n.startswith("課税仕入-返還等"):
        return n.replace("課税仕入-返還等", "課対仕返")
    if n.startswith("課税仕入"):
        return n.replace("課税仕入", "課対仕入")
    
    # 共通課税仕入 → 共対仕入
    if n.startswith("共通課税仕入-返還等"):
        return n.replace("共通課税仕入-返還等", "共対仕返")
    if n.startswith("共通課税仕入"):
        return n.replace("共通課税仕入", "共対仕入")
    
    # 非課税対応仕入 → 非対仕入
    if n.startswith("非課税対応仕入-返還等"):
        return n.replace("非課税対応仕入-返還等", "非対仕返")
    if n.startswith("非課税対応仕入"):
        return n.replace("非課税対応仕入", "非対仕入")
    
    # 特定課税仕入
    if "特定課税仕入" in n:
        r = n.replace("共通特定課税仕入", "共特定仕入")
        r = r.replace("非課税対応特定課税仕入", "非特定仕入")
        r = r.replace("特定課税仕入", "特定仕入")
        r = r.replace("-返還等", "返還")
        return r
    
    # 輸入
    if "輸入" in n:
        r = n
        r = r.replace("共通輸入仕入", "共対輸")
        r = r.replace("非課税対応輸入", "非対輸")
        r = r.replace("輸入仕入", "課対輸")
        r = r.replace("-本体", "本")
        r = r.replace("-消費税額", "税")
        r = r.replace("-地方消費税額", "地")
        return r
    
    return n

# 生成
results = []
for e in entries:
    yayoi_incl = mf_to_yayoi_tax_incl(e["mf_name"])
    # 軽減税率表記変換
    yayoi_incl = yayoi_incl.replace("(軽)", "軽減")
    yayoi_excl = yayoi_incl_to_excl(yayoi_incl)
    freee = mf_to_freee(e["mf_name"])
    
    results.append({
        "id": e["id"],
        "mf": e["mf_name"],
        "yayoi_incl": yayoi_incl,
        "yayoi_excl": yayoi_excl,
        "freee": freee,
        "direction": e["direction"],
    })

# TSファイル出力
ts_lines = []
ts_lines.append("/**")
ts_lines.append(" * 3ソフト間 税区分名称対応表（自動生成）")
ts_lines.append(" *")
ts_lines.append(" * 正本: MF名（tax-category-master.ts）")
ts_lines.append(" * 弥生: 税込(込)/税抜(内) の2パターン")
ts_lines.append(" * freee: 1パターン")
ts_lines.append(f" * 全{len(results)}件")
ts_lines.append(" */")
ts_lines.append("")
ts_lines.append("export interface TaxCategoryMapping {")
ts_lines.append("  /** 内部ID（tax-category-master.tsのid） */")
ts_lines.append("  id: string")
ts_lines.append("  /** MFクラウド会計の税区分名（正本） */")
ts_lines.append("  mf: string")
ts_lines.append("  /** 弥生会計の税区分名（税込経理） */")
ts_lines.append("  yayoi_incl: string")
ts_lines.append("  /** 弥生会計の税区分名（税抜経理） */")
ts_lines.append("  yayoi_excl: string")
ts_lines.append("  /** freee会計の税区分名 */")
ts_lines.append("  freee: string")
ts_lines.append("  /** 取引方向 */")
ts_lines.append("  direction: 'sales' | 'purchase' | 'common'")
ts_lines.append("}")
ts_lines.append("")
ts_lines.append("export const TAX_CATEGORY_MAPPING: readonly TaxCategoryMapping[] = [")
for r in results:
    ts_lines.append(f"  {{ id: '{r['id']}', mf: '{r['mf']}', yayoi_incl: '{r['yayoi_incl']}', yayoi_excl: '{r['yayoi_excl']}', freee: '{r['freee']}', direction: '{r['direction']}' }},")
ts_lines.append("]")
ts_lines.append("")
ts_lines.append("// === ユーティリティ関数 ===")
ts_lines.append("")
ts_lines.append("/** MF名から弥生名(税込)を取得 */")
ts_lines.append("export function mfToYayoi(mfName: string, taxIncluded = true): string {")
ts_lines.append("  const entry = TAX_CATEGORY_MAPPING.find(m => m.mf === mfName)")
ts_lines.append("  if (!entry) return mfName // フォールバック: そのまま返す")
ts_lines.append("  return taxIncluded ? entry.yayoi_incl : entry.yayoi_excl")
ts_lines.append("}")
ts_lines.append("")
ts_lines.append("/** MF名からfreee名を取得 */")
ts_lines.append("export function mfToFreee(mfName: string): string {")
ts_lines.append("  const entry = TAX_CATEGORY_MAPPING.find(m => m.mf === mfName)")
ts_lines.append("  if (!entry) return mfName")
ts_lines.append("  return entry.freee")
ts_lines.append("}")
ts_lines.append("")
ts_lines.append("/** 弥生名(税込)からMF名を取得 */")
ts_lines.append("export function yayoiToMf(yayoiName: string): string {")
ts_lines.append("  const entry = TAX_CATEGORY_MAPPING.find(m => m.yayoi_incl === yayoiName || m.yayoi_excl === yayoiName)")
ts_lines.append("  if (!entry) return yayoiName")
ts_lines.append("  return entry.mf")
ts_lines.append("}")
ts_lines.append("")
ts_lines.append("/** freee名からMF名を取得 */")
ts_lines.append("export function freeeToMf(freeeName: string): string {")
ts_lines.append("  const entry = TAX_CATEGORY_MAPPING.find(m => m.freee === freeeName)")
ts_lines.append("  if (!entry) return freeeName")
ts_lines.append("  return entry.mf")
ts_lines.append("}")
ts_lines.append("")

ts_content = "\n".join(ts_lines)
with open("src/shared/data/tax-category-mapping.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"生成完了: src/shared/data/tax-category-mapping.ts ({len(results)}件)")

# サンプル表示
print("\n=== サンプル（上位15件）===")
print(f"{'ID':<30} {'MF名':<25} {'弥生(税込)':<25} {'freee':<25}")
print("-" * 105)
for r in results[:15]:
    print(f"{r['id']:<30} {r['mf']:<25} {r['yayoi_incl']:<25} {r['freee']:<25}")
