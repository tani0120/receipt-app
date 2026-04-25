"""
三者間変換システム 実データ検証テスト
====================================
data/csv_samples/ の実データファイルでパーサーの動作を検証する。
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from converter import *

# データディレクトリ
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "csv_samples")


def divider(title: str):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)


def print_summary(result: ConversionResult, filename: str):
    """パース結果のサマリーを表示"""
    print(f"\n  📁 {filename}")
    if result.errors:
        print(f"  ❌ エラー: {len(result.errors)}件")
        for e in result.errors[:5]:
            print(f"    - {e}")
        if len(result.errors) > 5:
            print(f"    ... 他{len(result.errors)-5}件")
    else:
        print(f"  ✅ エラーなし")

    if result.warnings:
        print(f"  ⚠️  警告: {len(result.warnings)}件")
        for w in result.warnings[:5]:
            print(f"    - {w}")
        if len(result.warnings) > 5:
            print(f"    ... 他{len(result.warnings)-5}件")

    if result.transactions:
        print(f"  📊 取引件数: {len(result.transactions)}")
        balanced = sum(1 for t in result.transactions if t.is_balanced())
        print(f"  ⚖️  貸借一致: {balanced}/{len(result.transactions)}")

        # 税区分集計
        tax_codes = {}
        for tx in result.transactions:
            for e in tx.entries:
                tax_codes[e.tax_code] = tax_codes.get(e.tax_code, 0) + 1
        unknown_count = tax_codes.get("UNKNOWN", 0)
        print(f"  🏷️  税区分: {len(tax_codes)}種類 (UNKNOWN={unknown_count}件)")
        for code, count in sorted(tax_codes.items()):
            marker = "❌" if code == "UNKNOWN" else "  "
            print(f"    {marker} {code}: {count}件")

        # 最初の3件を詳細表示
        for tx in result.transactions[:3]:
            print(f"\n    [伝票 {tx.origin_id}] {tx.date} 摘要: {tx.description[:50]}")
            for e in tx.entries:
                side = "借" if e.side == Side.DEBIT else "貸"
                print(f"      {side} {e.account_name} ¥{e.amount:,} ({e.tax_code})")


def read_file(filename: str) -> bytes:
    """CSVファイルを読み込む（UTF-8/Shift-JIS自動判定）"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "rb") as f:
        return f.read()


def test_yayoi_files():
    """弥生インポート形式ファイルのパーステスト"""
    divider("弥生インポート形式 パーステスト")
    files = [
        "freee_yayoi_import_test.csv",
        "yayoi_import_test_a.csv",
        "yayoi_import_test_b.csv",
        "yayoi_import_test_c.csv",
    ]
    parser = YayoiParser()
    all_ok = True
    for f in files:
        content = read_file(f)
        result = parser.parse(content)
        print_summary(result, f)
        if result.errors:
            all_ok = False
        # UNKNOWNチェック
        for tx in result.transactions:
            for e in tx.entries:
                if e.tax_code == "UNKNOWN":
                    all_ok = False
    return all_ok


def test_mf_journal():
    """MF仕訳帳CSVのパーステスト"""
    divider("MF仕訳帳 パーステスト")
    parser = MFParser()
    content = read_file("mf_journal_test.csv")
    result = parser.parse(content)
    print_summary(result, "mf_journal_test.csv")
    return not result.errors


def test_freee_journal():
    """freee仕訳帳エクスポート（95列）のパーステスト"""
    divider("freee仕訳帳エクスポート（95列）パーステスト")
    parser = FreeeJournalParser()
    content = read_file("freee_journal_test.csv")
    result = parser.parse(content)
    print_summary(result, "freee_journal_test.csv")
    return not result.errors


def test_tax_mapping():
    """税区分変換辞書の検証"""
    divider("税区分変換辞書 検証")
    # 実データに出現する全税区分をテスト
    yayoi_taxes = [
        "課対仕入込10%適格", "課対仕入込10%区分80%",
        "課対仕入込軽減8%適格", "課対仕入込軽減8%区分80%",
        "非課仕入", "対外仕入", "対象外",
        "課税売上10%", "非課売上",
    ]
    freee_taxes = [
        "課対仕入10%", "課売10%", "対象外", "課対仕入8%",
    ]
    mf_taxes = [
        "課税仕入 10%", "課税仕入 8%", "課税売上 10%",
        "非課税仕入", "対象外",
    ]

    print(f"\n  {'ソフト':6s} {'入力':24s} → {'標準コード':10s} | {'弥生':20s} {'MF':16s} {'freee':16s}")
    print(f"  {'-'*100}")

    all_ok = True
    for platform, taxes in [("yayoi", yayoi_taxes), ("freee", freee_taxes), ("mf", mf_taxes)]:
        for tax in taxes:
            code = TaxCodeMaster.to_standard(platform, tax)
            y = TaxCodeMaster.to_platform(code, "yayoi")
            m = TaxCodeMaster.to_platform(code, "mf")
            f = TaxCodeMaster.to_platform(code, "freee")
            marker = "❌" if code == "UNKNOWN" else "✅"
            if code == "UNKNOWN":
                all_ok = False
            print(f"  {marker} {platform:5s} {tax:24s} → {code:10s} | {y:20s} {m:16s} {f}")

    return all_ok


if __name__ == "__main__":
    print("=" * 70)
    print("  弥生・MF・freee 三者間変換 実データ検証テスト")
    print("=" * 70)

    results = {}
    results["弥生パース"] = test_yayoi_files()
    results["MFパース"] = test_mf_journal()
    results["freeeパース"] = test_freee_journal()
    results["税区分辞書"] = test_tax_mapping()

    divider("総合結果")
    for name, ok in results.items():
        print(f"  {'✅' if ok else '❌'} {name}")
    print()
    if all(results.values()):
        print("  🎉 全テスト合格")
    else:
        print("  ⚠️  一部テスト失敗")
    print("=" * 70)
