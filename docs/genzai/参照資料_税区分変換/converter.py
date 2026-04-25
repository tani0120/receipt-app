"""
弥生・マネーフォワード・freee 三者間 会計データ変換システム
============================================================
v2.0 - 批評・修正済み最終版

【原文書の主な誤り・不備（修正済み）】
1. 弥生ファイル制限: 原文「200KB未満」→ 正しくは「5,000行以内」(弥生会計Next)
   旧来の弥生会計では行数制限なく容量制限のみ。混在に注意。
2. freee「4形式」の名称が不正確: 原文「標準形式・拡張形式・単一形式・決済形式」
   → freee公式は「旧CSV(選択出力)」「新CSV(全項目強制)」「freee形式(振替伝票)」
   　 「エクセルインポート」が主形式。「標準/拡張」は非公式な解釈。
3. MF取引No自動補完の説明が曖昧: 「取引日を元に補完」ではなく
   「取引Noが空欄の場合、同一取引日の連続行を複合仕訳として結合」に変更された。
   補完するのではなく、グループ化ルールが変わった。
4. freeeの「取引(Deal)中心」説明が一部誤り: freeeのCSVインポート(振替伝票形式)は
   「伝票番号」で行をグループ化する。「取引」概念は収入/支出取引のUI上の概念で、
   CSVインポートは「振替伝票」として登録される。
5. 弥生「識別子」の値: 原文の値は汎用形式のもの(0,1,3,5,6)だが、
   弥生インポート形式(4桁コード: 2000=仕訳日記帳)と混同しやすい。本コードでは明確化。
6. 勘定科目文字数: MFは「30文字」で切り捨て(原文通り正しい)。
   弥生は制限なしに近いが実務上は全角20文字程度を推奨(原文に明記なし)。
"""

from __future__ import annotations

import csv
import io
import uuid
import re
import unicodedata
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Optional, List, Dict, Tuple
from datetime import date, datetime


# ============================================================
# 1. 列挙型・定数
# ============================================================

class Side(Enum):
    DEBIT = "debit"    # 借方
    CREDIT = "credit"  # 貸方


class SettlementStatus(Enum):
    UNSETTLED = "unsettled"  # 未決済
    SETTLED = "settled"      # 決済済み


class InvoiceStatus(Enum):
    QUALIFIED = "qualified"          # 適格（インボイス対応）
    NON_QUALIFIED = "non_qualified"  # 非適格
    NONE = "none"                    # 該当なし


# ============================================================
# 2. 税区分変換辞書（三者間の「方言」を吸収）
# ============================================================

class TaxCodeMaster:
    """
    標準税区分コード(S10_Q, S8R_Q, S0 等)を介して三者を橋渡しする。
    インボイス制度対応版（2023年10月〜）。

    弥生の命名規則:
      - 「込」= 税込経理、「内」= 税抜経理（本コードでは両方登録）
      - 「適格」= 適格請求書あり（100%控除）
      - 「区分80%」= 経過措置80%控除（2023/10〜2026/9）
      - 「区分50%」= 経過措置50%控除（2026/10〜2029/9）
    MFの命名規則:
      - 税区分列に「課税仕入 10%」等、インボイス列に「適格」「区分記載」等を別列で管理
    freeeの命名規則:
      - 「課対仕入10%」= 適格（デフォルト）
      - 「課対仕入(控80)10%」= 経過措置80%
    """
    # 標準コード → 各社表記
    _TABLE: Dict[str, Dict[str, str]] = {
        # === 仕入系（適格） ===
        "S10_Q":     {"yayoi": "課対仕入込10%適格",       "yayoi_nt": "課対仕入内10%適格",       "mf": "課税仕入 10%",  "freee": "課対仕入10%"},
        "S8R_Q":     {"yayoi": "課対仕入込軽減8%適格",     "yayoi_nt": "課対仕入内軽減8%適格",     "mf": "課税仕入 8%",   "freee": "課対仕入8%"},
        "S8R_F95":   {"yayoi": "課対仕入込軽減8%適格",     "yayoi_nt": "課対仕入内軽減8%適格",     "mf": "課税仕入 8%",   "freee": "課対仕入8%(軽)"},
        # === 仕入系（経過措置80%） ===
        "S10_80":    {"yayoi": "課対仕入込10%区分80%",     "yayoi_nt": "課対仕入内10%区分80%",     "mf": "課税仕入 10%",  "freee": "課対仕入(控80)10%"},
        "S8R_80":    {"yayoi": "課対仕入込軽減8%区分80%",   "yayoi_nt": "課対仕入内軽減8%区分80%",   "mf": "課税仕入 8%",   "freee": "課対仕入(控80)8%"},
        # === 仕入系（経過措置50%） ===
        "S10_50":    {"yayoi": "課対仕入込10%区分50%",     "yayoi_nt": "課対仕入内10%区分50%",     "mf": "課税仕入 10%",  "freee": "課対仕入(控50)10%"},
        "S8R_50":    {"yayoi": "課対仕入込軽減8%区分50%",   "yayoi_nt": "課対仕入内軽減8%区分50%",   "mf": "課税仕入 8%",   "freee": "課対仕入(控50)8%"},
        # === 仕入系（インボイス区分なし / 旧形式互換） ===
        "S10":       {"yayoi": "課対仕入込10%",           "yayoi_nt": "課対仕入内10%",           "mf": "課税仕入 10%",  "freee": "課対仕入10%"},
        "S10_SHORT": {"yayoi": "課対仕入10%",             "yayoi_nt": "課対仕入10%",             "mf": "課税仕入 10%",  "freee": "課対仕入10%"},
        "S8R":       {"yayoi": "課対仕入込軽減8%",         "yayoi_nt": "課対仕入内軽減8%",         "mf": "課税仕入 8%",   "freee": "課対仕入8%"},
        "S10_EX":    {"yayoi": "課対仕入10%外",           "yayoi_nt": "課対仕入10%外",           "mf": "課税仕入 10%",  "freee": "課対仕入10%"},
        # === 非課税・対象外（仕入） ===
        "SNT":       {"yayoi": "非課仕入",               "yayoi_nt": "非課仕入",               "mf": "非課税仕入",    "freee": "非課仕入"},
        "S_OUT":     {"yayoi": "対外仕入",               "yayoi_nt": "対外仕入",               "mf": "対象外",        "freee": "対外仕入"},
        # === 売上系 ===
        "T10":       {"yayoi": "課税売上込10%",           "yayoi_nt": "課税売上内10%",           "mf": "課税売上 10%",  "freee": "課売10%"},
        "T8R":       {"yayoi": "課税売上込軽減8%",         "yayoi_nt": "課税売上内軽減8%",         "mf": "課税売上 8%",   "freee": "課売8%"},
        "T10_EX":    {"yayoi": "課税売上10%",             "yayoi_nt": "課税売上10%",             "mf": "課税売上 10%",  "freee": "課売10%"},
        "T10_F95":   {"yayoi": "課税売上込10%",           "yayoi_nt": "課税売上内10%",           "mf": "課税売上 10%",  "freee": "課税売上10%"},
        "T_NT":      {"yayoi": "非課売上",               "yayoi_nt": "非課売上",               "mf": "非課税売上",    "freee": "非課売上"},
        "T_NT2":     {"yayoi": "非課売上",               "yayoi_nt": "非課売上",               "mf": "非課税売上",    "freee": "非課税売上"},
        # === 共通 ===
        "S0":        {"yayoi": "対象外",                 "yayoi_nt": "対象外",                 "mf": "対象外",        "freee": "対象外"},
    }

    # 逆引き（各社表記 → 標準コード）
    _REVERSE: Dict[str, str] = {}

    @classmethod
    def _build_reverse(cls):
        if not cls._REVERSE:
            for code, names in cls._TABLE.items():
                for platform, name in names.items():
                    key = f"{platform}:{name}"
                    # 最初の登録を優先（同じ名前で複数コードがある場合）
                    if key not in cls._REVERSE:
                        cls._REVERSE[key] = code
            # 弥生の yayoi_nt も yayoi として逆引きに登録
            for code, names in cls._TABLE.items():
                if "yayoi_nt" in names:
                    key = f"yayoi:{names['yayoi_nt']}"
                    if key not in cls._REVERSE:
                        cls._REVERSE[key] = code

    @classmethod
    def to_standard(cls, platform: str, raw_name: str) -> str:
        """各社の税区分名称 → 標準コード"""
        cls._build_reverse()
        name = raw_name.strip()
        if not name:
            return "S0"
        # 全角括弧を半角に正規化（freeeの「課対仕入（控80）10%」→「課対仕入(控80)10%」）
        name = name.replace("（", "(").replace("）", ")")
        key = f"{platform}:{name}"
        return cls._REVERSE.get(key, "UNKNOWN")

    @classmethod
    def to_platform(cls, standard_code: str, platform: str) -> str:
        """標準コード → 各社の税区分名称"""
        row = cls._TABLE.get(standard_code)
        if row is None:
            return standard_code  # フォールバック
        return row.get(platform, standard_code)


# ============================================================
# 3. 中間型データモデル（最終スキーマ v2.0）
# ============================================================

@dataclass
class JournalEntry:
    """仕訳明細行（借方 or 貸方の1行）"""
    entry_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    side: Side = Side.DEBIT
    account_name: str = ""          # 勘定科目名
    sub_account_name: str = ""      # 補助科目名
    dept_name: str = ""             # 部門名
    amount: Decimal = Decimal("0")  # 税込金額（正数）
    tax_amount: Decimal = Decimal("0")  # 消費税額
    tax_code: str = "S0"            # 標準税区分コード
    tax_name_raw: str = ""          # 元の税区分名（デバッグ用）
    description: str = ""           # 行単位の摘要
    invoice_status: InvoiceStatus = InvoiceStatus.NONE
    registration_no: str = ""       # インボイス登録番号 T+13桁
    # freee専用タグ（複数付与可能）
    partner_name: str = ""          # 取引先タグ
    item_name: str = ""             # 品目タグ
    memo_tags: List[str] = field(default_factory=list)  # メモタグ
    segment1: str = ""              # セグメント1（アドバンス以上）
    segment2: str = ""
    segment3: str = ""


@dataclass
class Transaction:
    """1取引（伝票）単位の中間オブジェクト"""
    tx_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    origin_id: str = ""             # 元の伝票番号・取引No・取引ID
    date: Optional[date] = None
    description: str = ""           # 伝票全体摘要
    closing_flag: bool = False      # 決算整理仕訳
    settlement_status: SettlementStatus = SettlementStatus.SETTLED
    entries: List[JournalEntry] = field(default_factory=list)

    def debit_total(self) -> Decimal:
        return sum(e.amount for e in self.entries if e.side == Side.DEBIT)

    def credit_total(self) -> Decimal:
        return sum(e.amount for e in self.entries if e.side == Side.CREDIT)

    def is_balanced(self) -> bool:
        return self.debit_total() == self.credit_total()


# ============================================================
# 4. エラーハンドリング
# ============================================================


# ============================================================
# 4b. テキスト変換ユーティリティ
# ============================================================

def to_sjis_safe(text: str) -> str:
    """
    CP932（Windows-31J）変換不可文字を代替文字に置換。

    弥生会計はWindows環境で動作するため、Shift-JISではなくCP932を使用。
    CP932にはIBM拡張文字（髙﨑栁等のJIS第3/4水準文字）が含まれるため、
    多くの環境依存文字はそのまま変換可能。

    手動辞書は「CP932にも存在しないUnicode固有文字」のみを対象とする。
    """
    replacements = {
        # 丸囲み数字（⑪〜⑳はCP932に存在しない）
        "⑪": "(11)", "⑫": "(12)", "⑬": "(13)", "⑭": "(14)", "⑮": "(15)",
        "⑯": "(16)", "⑰": "(17)", "⑱": "(18)", "⑲": "(19)", "⑳": "(20)",
        # 括弧付き漢字（一部はCP932にない）
        "㈳": "(代)", "㈴": "(学)", "㈵": "(監)",
        "㈶": "(企)", "㈷": "(祝)", "㈸": "(労)", "㈹": "(財)", "㈺": "(社)",
        # 単位記号（CP932にないもの）
        "㎢": "km2", "㎥": "m3", "㎝": "cm", "㎜": "mm",
        "㎎": "mg", "㍵": "bar",
        # ダッシュ・ハイフン系（Unicode固有の変種）
        "\u2010": "-",  # HYPHEN
        "\u2012": "-",  # FIGURE DASH
        "\u2013": "-",  # EN DASH
        "\u2014": "-",  # EM DASH
        # Unicode固有の記号
        "\u301c": "\uff5e",  # WAVE DASH → FULLWIDTH TILDE (CP932互換)
        "\u2212": "\uff0d",  # MINUS SIGN → FULLWIDTH HYPHEN-MINUS
        # サロゲートペア文字（人名で出現、CP932に存在しない）
        "\U00020BB7": "吉",  # 𠮷（つちよし）→ 吉
        "\U0002123D": "土",  # 𡈽 → 土
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # CP932で変換可能な文字はそのまま維持、不可能なもののみ "?" に
    return text.encode("cp932", errors="replace").decode("cp932")


class ConversionError(Exception):
    """変換エラー基底クラス"""
    def __init__(self, message: str, row_num: int = -1, field_name: str = ""):
        self.row_num = row_num
        self.field_name = field_name
        super().__init__(f"[行{row_num}] [{field_name}] {message}" if row_num >= 0 else message)


class ValidationError(ConversionError):
    """バリデーションエラー（貸借不一致・必須項目欠落等）"""
    pass


class EncodingError(ConversionError):
    """エンコーディングエラー"""
    pass


class BalanceError(ValidationError):
    """貸借不一致エラー"""
    def __init__(self, origin_id: str, debit: Decimal, credit: Decimal):
        super().__init__(
            f"貸借不一致: 伝票={origin_id} 借方合計={debit} 貸方合計={credit}"
        )


@dataclass
class ConversionResult:
    """変換結果（成功 + 警告 + エラーをすべて返す）"""
    transactions: List[Transaction] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[ConversionError] = field(default_factory=list)

    @property
    def success(self) -> bool:
        return len(self.errors) == 0


# ============================================================
# 5. ユーティリティ
# ============================================================

def normalize_text(text: str, max_len: int = 0) -> str:
    """Unicode NFKC正規化 + 文字数制限"""
    t = unicodedata.normalize("NFKC", text.strip())
    if max_len > 0:
        t = t[:max_len]
    return t


def to_sjis_safe(text: str) -> str:
    """
    Shift-JIS変換不可文字を代替文字に置換。
    JIS第3/4水準の環境依存文字を網羅的にカバー。
    """
    replacements = {
        # 丸囲み数字
        "①": "(1)", "②": "(2)", "③": "(3)", "④": "(4)", "⑤": "(5)",
        "⑥": "(6)", "⑦": "(7)", "⑧": "(8)", "⑨": "(9)", "⑩": "(10)",
        "⑪": "(11)", "⑫": "(12)", "⑬": "(13)", "⑭": "(14)", "⑮": "(15)",
        "⑯": "(16)", "⑰": "(17)", "⑱": "(18)", "⑲": "(19)", "⑳": "(20)",
        # 括弧付き漢字
        "㈱": "(株)", "㈲": "(有)", "㈳": "(代)", "㈴": "(学)", "㈵": "(監)",
        "㈶": "(企)", "㈷": "(祝)", "㈸": "(労)", "㈹": "(財)", "㈺": "(社)",
        # 単位記号
        "㎡": "m2", "㎢": "km2", "㎥": "m3", "㎞": "km", "㎝": "cm", "㎜": "mm",
        "㎎": "mg", "㎏": "kg", "㍑": "l", "㍵": "bar",
        # JIS第3/4水準の典型的な環境依存文字（人名・住所で多出）
        "髙": "高",   # はしご髙 → 高
        "戮": "崎",   # たつさき戮 → 崎
        "彅": "弾",   # はずみ彅 → 弾
        "瀉": "済",   # 済の異体字
        "槙": "橋",   # 橋の異体字
        "糸": "糸",   # 糸の異体字（同字体だがCP932で問題の場合）
        "濳": "湊",   # 湊の異体字
        "碕": "磯",   # 磯の異体字
        # ダッシュ・ハイフン系
        "\u2014": "-",  # EM DASH
        "\u2015": "-",  # HORIZONTAL BAR
        "\u2010": "-",  # HYPHEN
        "\u2012": "-",  # FIGURE DASH
        "\u2013": "-",  # EN DASH
        # その他
        "\u301c": "～",  # WAVE DASH → FULLWIDTH TILDE (CP932互換)
        "\u2016": "∥",  # DOUBLE VERTICAL LINE
        "\u2212": "－",  # MINUS SIGN → FULLWIDTH HYPHEN-MINUS
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # それでも変換できない文字は "?" に
    return text.encode("shift_jis", errors="replace").decode("shift_jis")


def parse_date(s: str) -> Optional[date]:
    """
    弥生の多様な日付形式に対応。
    西暦下2桁 → 和暦誤認リスクを回避するため、4桁西暦に統一。
    """
    s = s.strip().replace("　", "").replace(" ", "")
    if not s:
        return None

    # 和暦変換テーブル
    wareki_map = {
        "R": 2018, "令和": 2018,
        "H": 1988, "平成": 1988,
        "S": 1925, "昭和": 1925,
    }

    # 和暦処理
    for prefix, base in wareki_map.items():
        if s.startswith(prefix):
            rest = s[len(prefix):]
            parts = re.split(r"[/.\-年月日]", rest.rstrip("日"))
            parts = [p for p in parts if p]
            if len(parts) >= 3:
                year = base + int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                return date(year, month, day)

    # 西暦処理
    # yyyymmdd (8桁数字)
    if re.match(r"^\d{8}$", s):
        return date(int(s[:4]), int(s[4:6]), int(s[6:8]))

    # YYYY/MM/DD, YYYY.MM.DD, YYYY-MM-DD
    m = re.match(r"^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$", s)
    if m:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))

    return None


def parse_amount(s: str) -> Decimal:
    """金額文字列をDecimalに変換（カンマ・スペース除去）"""
    s = re.sub(r"[,\s\u3000]", "", s.strip())
    if not s:
        return Decimal("0")
    return Decimal(s)


# ============================================================
# 6. 弥生汎用形式 パーサー（インポート: 弥生 → 中間型）
# ============================================================

class YayoiParser:
    """
    弥生会計 インポート形式CSV（25列）を中間型Transactionに変換。

    識別子:
      2000 = 単一仕訳（1行で借方・貸方が完結）
      2110 = 複合仕訳の開始行
      2100 = 複合仕訳の中間行
      2101 = 複合仕訳の終了行
    旧汎用形式（識別子 0, 1）にも後方互換で対応。
    """
    # 列インデックス定義（0始まり・25列形式）
    COL = {
        "identifier": 0,    # 識別子
        "slip_no": 1,       # 伝票番号
        "closing": 2,       # 決算整理フラグ
        "date": 3,          # 取引日付
        "dr_account": 4,    # 借方勘定科目
        "dr_sub": 5,        # 借方補助科目
        "dr_dept": 6,       # 借方部門
        "dr_tax": 7,        # 借方税区分
        "dr_amount": 8,     # 借方金額
        "dr_tax_amt": 9,    # 借方税額
        "cr_account": 10,   # 貸方勘定科目
        "cr_sub": 11,       # 貸方補助科目
        "cr_dept": 12,      # 貸方部門
        "cr_tax": 13,       # 貸方税区分
        "cr_amount": 14,    # 貸方金額
        "cr_tax_amt": 15,   # 貸方税額
        "description": 16,  # 摘要
        # 列17-24: 番号, 期日, タイプ, 生成元, 仕訳メモ, 付箋1, 付箋2, 調整
    }
    MIN_COLS = 17  # 列17以降はオプション

    # 識別子: 仕訳データ行として扱うもの
    ENTRY_IDS = {"2000", "2110", "2100", "2101", "1", ""}
    # 識別子: 伝票摘要行（ヘッダー行）
    HEADER_IDS = {"0"}

    def parse(self, content: bytes) -> ConversionResult:
        result = ConversionResult()
        # UTF-8 BOM / UTF-8 / Shift-JIS を自動判定
        # （弥生は公式にShift-JIS/UTF-8の両方に対応）
        for enc in ["utf-8-sig", "utf-8", "shift_jis"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            result.errors.append(EncodingError("UTF-8/Shift-JIS いずれでもデコード不可"))
            return result

        reader = csv.reader(io.StringIO(text))
        # 伝票番号ごとに行を集約
        slip_map: Dict[str, List[dict]] = {}
        slip_order: List[str] = []  # 順序保持
        current_compound_id = ""  # 複合仕訳用

        for row_num, row in enumerate(reader, start=1):
            if not row or len(row) < self.MIN_COLS:
                if row:
                    result.warnings.append(f"行{row_num}: 列数不足({len(row)}列)、スキップ")
                continue

            identifier = row[self.COL["identifier"]].strip().strip('"')

            # 伝票摘要行（識別子=0）
            if identifier in self.HEADER_IDS:
                slip_no = row[self.COL["slip_no"]].strip() or f"_auto_{row_num}"
                if slip_no not in slip_map:
                    slip_map[slip_no] = []
                    slip_order.append(slip_no)
                slip_map[slip_no].append({
                    "type": "header",
                    "description": row[self.COL["description"]],
                    "date": row[self.COL["date"]],
                    "closing": row[self.COL["closing"]],
                })
                continue

            # 仕訳データ行でない場合はスキップ
            if identifier not in self.ENTRY_IDS:
                result.warnings.append(f"行{row_num}: 未知の識別子'{identifier}'、スキップ")
                continue

        # 複合仕訳の識別子によるグループ化
            # 2000=単一、2110=複合開始、2100=中間、2101=終了
            if identifier == "2000":
                slip_no = row[self.COL["slip_no"]].strip() or f"_auto_{row_num}"
            elif identifier == "2110":
                # 複合仕訳開始: 伝票番号があればそれを使い、なければautoIDを生成
                slip_no = row[self.COL["slip_no"]].strip() or f"_compound_{row_num}"
                current_compound_id = slip_no  # 後続の2100/2101用に記憶
            elif identifier in ("2100", "2101"):
                # 複合仕訳の中間/終了: 直前の2110のIDに結合
                slip_no = row[self.COL["slip_no"]].strip() or current_compound_id
            else:
                slip_no = row[self.COL["slip_no"]].strip() or f"_auto_{row_num}"

            if slip_no not in slip_map:
                slip_map[slip_no] = []
                slip_order.append(slip_no)
            slip_map[slip_no].append({
                "type": "entry",
                "row_num": row_num,
                "identifier": identifier,
                "date": row[self.COL["date"]],
                "closing": row[self.COL["closing"]],
                "dr_account": row[self.COL["dr_account"]],
                "dr_sub": row[self.COL["dr_sub"]],
                "dr_dept": row[self.COL["dr_dept"]],
                "dr_tax": row[self.COL["dr_tax"]],
                "dr_amount": row[self.COL["dr_amount"]],
                "dr_tax_amt": row[self.COL["dr_tax_amt"]],
                "cr_account": row[self.COL["cr_account"]],
                "cr_sub": row[self.COL["cr_sub"]],
                "cr_dept": row[self.COL["cr_dept"]],
                "cr_tax": row[self.COL["cr_tax"]],
                "cr_amount": row[self.COL["cr_amount"]],
                "cr_tax_amt": row[self.COL["cr_tax_amt"]],
                "description": row[self.COL["description"]],
            })

        # 伝票番号単位でTransactionを構築（諸口解体）
        for slip_no in slip_order:
            rows = slip_map[slip_no]
            tx = self._build_transaction(slip_no, rows, result)
            if tx:
                result.transactions.append(tx)

        return result

    def _build_transaction(
        self, slip_no: str, rows: List[dict], result: ConversionResult
    ) -> Optional[Transaction]:
        """
        諸口解体ロジック:
        弥生では複合仕訳を「諸口」勘定で表現するか、同一伝票番号の複数行で表現する。
        ここでは後者を前提に、各行の借方・貸方を別々のJournalEntryに変換する。
        「諸口」科目は中間型では展開せずそのままAccountNameとして保持する（
        ターゲットシステムで自動展開されるため）。
        """
        tx = Transaction(origin_id=slip_no)
        header_desc = ""

        entry_rows = []
        for row in rows:
            if row["type"] == "header":
                d = parse_date(row["date"])
                if d and tx.date is None:
                    tx.date = d
                header_desc = row.get("description", "")
                if row.get("closing", "").strip() == "決算":
                    tx.closing_flag = True
            else:
                entry_rows.append(row)

        if not entry_rows:
            return None

        # 取引日確定
        if tx.date is None:
            d = parse_date(entry_rows[0]["date"])
            if d is None:
                result.errors.append(
                    ValidationError("日付が解析できません", entry_rows[0].get("row_num", -1), "date")
                )
                return None
            tx.date = d

        tx.description = header_desc or entry_rows[0].get("description", "")
        if entry_rows[0].get("closing", "").strip() == "決算":
            tx.closing_flag = True

        for row in entry_rows:
            rn = row.get("row_num", -1)
            # 借方エントリ
            if row["dr_account"].strip():
                try:
                    dr_amt = parse_amount(row["dr_amount"])
                except Exception:
                    result.errors.append(
                        ValidationError(f"借方金額が不正: '{row['dr_amount']}'", rn, "dr_amount")
                    )
                    dr_amt = Decimal("0")

                dr_tax_code = TaxCodeMaster.to_standard("yayoi", row["dr_tax"])
                if dr_tax_code == "UNKNOWN" and row["dr_tax"].strip():
                    result.warnings.append(
                        f"行{rn}: 借方税区分'{row['dr_tax']}'が辞書未登録。S0(対象外)として処理。"
                    )
                    dr_tax_code = "S0"

                tx.entries.append(JournalEntry(
                    side=Side.DEBIT,
                    account_name=normalize_text(row["dr_account"], 30),
                    sub_account_name=normalize_text(row["dr_sub"], 30),
                    dept_name=normalize_text(row["dr_dept"], 24),
                    amount=dr_amt,
                    tax_amount=parse_amount(row["dr_tax_amt"]),
                    tax_code=dr_tax_code,
                    tax_name_raw=row["dr_tax"],
                    description=normalize_text(row["description"], 0),
                ))

            # 貸方エントリ
            if row["cr_account"].strip():
                try:
                    cr_amt = parse_amount(row["cr_amount"])
                except Exception:
                    result.errors.append(
                        ValidationError(f"貸方金額が不正: '{row['cr_amount']}'", rn, "cr_amount")
                    )
                    cr_amt = Decimal("0")

                cr_tax_code = TaxCodeMaster.to_standard("yayoi", row["cr_tax"])
                if cr_tax_code == "UNKNOWN" and row["cr_tax"].strip():
                    result.warnings.append(
                        f"行{rn}: 貸方税区分'{row['cr_tax']}'が辞書未登録。S0(対象外)として処理。"
                    )
                    cr_tax_code = "S0"

                tx.entries.append(JournalEntry(
                    side=Side.CREDIT,
                    account_name=normalize_text(row["cr_account"], 30),
                    sub_account_name=normalize_text(row["cr_sub"], 30),
                    dept_name=normalize_text(row["cr_dept"], 24),
                    amount=cr_amt,
                    tax_amount=parse_amount(row["cr_tax_amt"]),
                    tax_code=cr_tax_code,
                    tax_name_raw=row["cr_tax"],
                    description=normalize_text(row["description"], 0),
                ))

        # 貸借バランスチェック
        if tx.entries and not tx.is_balanced():
            result.errors.append(BalanceError(slip_no, tx.debit_total(), tx.credit_total()))
            return None

        return tx


# ============================================================
# 7. マネーフォワード パーサー（MF仕訳帳CSV → 中間型）
# ============================================================

class MFParser:
    """
    MF仕訳帳CSV（27列・インボイス対応版）を中間型Transactionに変換。
    「取引No」で行をグループ化し、複合仕訳を復元する。
    DictReaderを使うためヘッダー名でアクセス（列位置に依存しない）。
    """
    REQUIRED_HEADERS = {"取引No", "取引日", "借方勘定科目", "貸方勘定科目", "借方金額(円)", "貸方金額(円)"}

    def parse(self, content: bytes) -> ConversionResult:
        result = ConversionResult()
        # UTF-8 or Shift-JIS 自動判定
        for enc in ["utf-8-sig", "utf-8", "shift_jis"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            result.errors.append(EncodingError("UTF-8/Shift-JIS いずれでもデコード不可"))
            return result

        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            result.errors.append(ValidationError("ヘッダー行が読めません"))
            return result

        fieldnames_set = set(reader.fieldnames)
        missing = self.REQUIRED_HEADERS - fieldnames_set
        if missing:
            result.errors.append(
                ValidationError(f"必須ヘッダーが不足: {missing}")
            )
            return result

        # 取引Noごとにグループ化
        groups: Dict[str, List[dict]] = {}
        group_order: List[str] = []

        for row_num, row in enumerate(reader, start=2):
            txno = str(row.get("取引No", "")).strip()
            # 全列が空の行（MFエクスポートの末尾空行）をスキップ
            dr_acc = str(row.get("借方勘定科目", "")).strip()
            cr_acc = str(row.get("貸方勘定科目", "")).strip()
            if not txno and not dr_acc and not cr_acc:
                continue
            if not txno:
                txno = f"_blank_{row_num}"

            if txno not in groups:
                groups[txno] = []
                group_order.append(txno)
            groups[txno].append({"row_num": row_num, **dict(row)})

        for txno in group_order:
            rows = groups[txno]
            tx = self._build_transaction(txno, rows, result)
            if tx:
                result.transactions.append(tx)

        return result

    def _build_transaction(
        self, txno: str, rows: List[dict], result: ConversionResult
    ) -> Optional[Transaction]:
        tx = Transaction(origin_id=txno)
        first = rows[0]
        rn = first.get("row_num", -1)

        d = parse_date(str(first.get("取引日", "")))
        if d is None:
            result.errors.append(ValidationError("取引日が解析不能", rn, "取引日"))
            return None
        tx.date = d
        tx.description = first.get("摘要", "")
        tx.closing_flag = bool(first.get("決算整理仕訳", "").strip())

        for row in rows:
            rn = row.get("row_num", -1)
            dr_acc = str(row.get("借方勘定科目", "")).strip()
            cr_acc = str(row.get("貸方勘定科目", "")).strip()

            if dr_acc:
                try:
                    dr_amt = parse_amount(str(row.get("借方金額(円)", "0")))
                except Exception:
                    result.errors.append(ValidationError("借方金額が不正", rn, "借方金額(円)"))
                    dr_amt = Decimal("0")
                dr_tax_raw = str(row.get("借方税区分", "")).strip()
                dr_tax_code = TaxCodeMaster.to_standard("mf", dr_tax_raw) if dr_tax_raw else "S0"
                # インボイス情報（27列形式で追加された列）
                dr_invoice_raw = str(row.get("借方インボイス", "")).strip()
                dr_invoice = InvoiceStatus.NONE
                if "適格" in dr_invoice_raw:
                    dr_invoice = InvoiceStatus.QUALIFIED
                elif dr_invoice_raw and dr_invoice_raw != "":
                    dr_invoice = InvoiceStatus.NON_QUALIFIED

                tx.entries.append(JournalEntry(
                    side=Side.DEBIT,
                    account_name=normalize_text(dr_acc, 30),
                    sub_account_name=normalize_text(str(row.get("借方補助科目", "")), 30),
                    dept_name=normalize_text(str(row.get("借方部門", "")), 24),
                    amount=dr_amt,
                    tax_amount=parse_amount(str(row.get("借方税額", "0"))),
                    tax_code=dr_tax_code,
                    tax_name_raw=dr_tax_raw,
                    description=normalize_text(str(row.get("摘要", "")), 0),
                    partner_name=normalize_text(str(row.get("借方取引先", "")), 30),
                    invoice_status=dr_invoice,
                ))

            if cr_acc:
                try:
                    cr_amt = parse_amount(str(row.get("貸方金額(円)", "0")))
                except Exception:
                    result.errors.append(ValidationError("貸方金額が不正", rn, "貸方金額(円)"))
                    cr_amt = Decimal("0")
                cr_tax_raw = str(row.get("貸方税区分", "")).strip()
                cr_tax_code = TaxCodeMaster.to_standard("mf", cr_tax_raw) if cr_tax_raw else "S0"
                # インボイス情報
                cr_invoice_raw = str(row.get("貸方インボイス", "")).strip()
                cr_invoice = InvoiceStatus.NONE
                if "適格" in cr_invoice_raw:
                    cr_invoice = InvoiceStatus.QUALIFIED
                elif cr_invoice_raw and cr_invoice_raw != "":
                    cr_invoice = InvoiceStatus.NON_QUALIFIED

                tx.entries.append(JournalEntry(
                    side=Side.CREDIT,
                    account_name=normalize_text(cr_acc, 30),
                    sub_account_name=normalize_text(str(row.get("貸方補助科目", "")), 30),
                    dept_name=normalize_text(str(row.get("貸方部門", "")), 24),
                    amount=cr_amt,
                    tax_amount=parse_amount(str(row.get("貸方税額", "0"))),
                    tax_code=cr_tax_code,
                    tax_name_raw=cr_tax_raw,
                    description=normalize_text(str(row.get("摘要", "")), 0),
                    partner_name=normalize_text(str(row.get("貸方取引先", "")), 30),
                    invoice_status=cr_invoice,
                ))

        if tx.entries and not tx.is_balanced():
            result.errors.append(BalanceError(txno, tx.debit_total(), tx.credit_total()))
            return None

        return tx


# ============================================================
# 8. freee 仕訳帳エクスポートCSVパーサー（95列・新CSV形式 → 中間型）
# ============================================================

class FreeeJournalParser:
    """
    freee会計「仕訳帳」エクスポート（新CSV形式・95列）を中間型Transactionに変換。
    freeeの95列形式は出力専用（全項目強制出力）で、29列の振替伝票形式とは構造が異なる。

    列定義（0始まり）:
      0:No, 1:取引日, 2:管理番号, 3:借方勘定科目, 7:借方金額,
      8:借方税区分, 9:借方税金額, 10:借方内税・外税, 11:借方税率,
      14:借方取引先名, 17:借方品目, 20:借方部門, 35:借方備考,
      36:貸方勘定科目, 40:貸方金額, 41:貸方税区分, 42:貸方税金額,
      47:貸方取引先名, 50:貸方品目, 53:貸方部門, 68:貸方備考,
      69:決算整理仕訳, 80:取引ID, 83:仕訳ID, 84:仕訳番号,
      87:仕訳行番号, 88:仕訳行数, 90:取引内容
    """
    # 列インデックス定義（ヘッダー名で取得するためDictReader使用）
    # DictReaderを使うのでヘッダー名ベースでアクセス

    def parse(self, content: bytes) -> ConversionResult:
        result = ConversionResult()
        for enc in ["utf-8-sig", "utf-8", "shift_jis"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            result.errors.append(EncodingError("デコード不可"))
            return result

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            result.errors.append(ValidationError("ヘッダー行が読めません"))
            return result

        # 必須ヘッダー確認
        required = {"取引日", "借方勘定科目", "借方金額", "貸方勘定科目", "貸方金額"}
        fieldnames_set = set(reader.fieldnames)
        missing = required - fieldnames_set
        if missing:
            result.errors.append(ValidationError(f"必須ヘッダーが不足: {missing}"))
            return result

        # 仕訳IDでグループ化（同一仕訳IDの複数行=複合仕訳）
        groups: Dict[str, List[dict]] = {}
        group_order: List[str] = []

        for row_num, row in enumerate(reader, start=2):
            # 仕訳IDで管理（なければ行番号で代替）
            jid = str(row.get("仕訳ID", "")).strip()
            if not jid:
                jid = f"_auto_{row_num}"

            if jid not in groups:
                groups[jid] = []
                group_order.append(jid)
            groups[jid].append({"row_num": row_num, **dict(row)})

        for jid in group_order:
            rows = groups[jid]
            tx = self._build_transaction(jid, rows, result)
            if tx:
                result.transactions.append(tx)

        return result

    def _build_transaction(
        self, jid: str, rows: List[dict], result: ConversionResult
    ) -> Optional[Transaction]:
        tx = Transaction(origin_id=jid)
        first = rows[0]
        rn = first.get("row_num", -1)

        d = parse_date(str(first.get("取引日", "")))
        if d is None:
            result.errors.append(ValidationError("取引日が解析不能", rn, "取引日"))
            return None
        tx.date = d

        # 摘要: 借方備考 or 貸方備考 or 取引内容
        tx.description = (
            str(first.get("借方備考", "")).strip() or
            str(first.get("貸方備考", "")).strip() or
            str(first.get("取引内容", "")).strip()
        )
        # 決算整理フラグ
        closing_raw = str(first.get("決算整理仕訳", "")).strip()
        tx.closing_flag = closing_raw in ("1", "決算", "True", "true")

        for row in rows:
            rn = row.get("row_num", -1)

            # --- 借方 ---
            dr_acc = str(row.get("借方勘定科目", "")).strip()
            if dr_acc:
                try:
                    dr_amt = parse_amount(str(row.get("借方金額", "0")))
                except Exception:
                    result.errors.append(ValidationError("借方金額が不正", rn, "借方金額"))
                    dr_amt = Decimal("0")

                dr_tax_raw = str(row.get("借方税区分", "")).strip()
                dr_tax_code = TaxCodeMaster.to_standard("freee", dr_tax_raw) if dr_tax_raw else "S0"
                if dr_tax_code == "UNKNOWN" and dr_tax_raw:
                    result.warnings.append(f"行{rn}: 借方税区分'{dr_tax_raw}'が辞書未登録")
                    dr_tax_code = "S0"

                tx.entries.append(JournalEntry(
                    side=Side.DEBIT,
                    account_name=normalize_text(dr_acc, 30),
                    sub_account_name="",  # 95列形式には補助科目列がない
                    dept_name=normalize_text(str(row.get("借方部門", "")), 24),
                    amount=dr_amt,
                    tax_amount=parse_amount(str(row.get("借方税金額", "0"))),
                    tax_code=dr_tax_code,
                    tax_name_raw=dr_tax_raw,
                    description=normalize_text(
                        str(row.get("借方備考", "")).strip() or str(row.get("取引内容", "")), 80
                    ),
                    partner_name=normalize_text(str(row.get("借方取引先名", "")), 30),
                    item_name=normalize_text(str(row.get("借方品目", "")), 30),
                ))

            # --- 貸方 ---
            cr_acc = str(row.get("貸方勘定科目", "")).strip()
            if cr_acc:
                try:
                    cr_amt = parse_amount(str(row.get("貸方金額", "0")))
                except Exception:
                    result.errors.append(ValidationError("貸方金額が不正", rn, "貸方金額"))
                    cr_amt = Decimal("0")

                cr_tax_raw = str(row.get("貸方税区分", "")).strip()
                cr_tax_code = TaxCodeMaster.to_standard("freee", cr_tax_raw) if cr_tax_raw else "S0"
                if cr_tax_code == "UNKNOWN" and cr_tax_raw:
                    result.warnings.append(f"行{rn}: 貸方税区分'{cr_tax_raw}'が辞書未登録")
                    cr_tax_code = "S0"

                tx.entries.append(JournalEntry(
                    side=Side.CREDIT,
                    account_name=normalize_text(cr_acc, 30),
                    sub_account_name="",
                    dept_name=normalize_text(str(row.get("貸方部門", "")), 24),
                    amount=cr_amt,
                    tax_amount=parse_amount(str(row.get("貸方税金額", "0"))),
                    tax_code=cr_tax_code,
                    tax_name_raw=cr_tax_raw,
                    description=normalize_text(
                        str(row.get("貸方備考", "")).strip() or str(row.get("取引内容", "")), 80
                    ),
                    partner_name=normalize_text(str(row.get("貸方取引先名", "")), 30),
                    item_name=normalize_text(str(row.get("貸方品目", "")), 30),
                ))

        if tx.entries and not tx.is_balanced():
            result.errors.append(BalanceError(jid, tx.debit_total(), tx.credit_total()))
            return None

        return tx


# ============================================================
# 8b. freee 振替伝票形式CSVパーサー（29列 → 中間型）
# ============================================================

class FreeeParser:
    """
    freee 振替伝票形式CSVを中間型Transactionに変換。

    【修正ポイント】
    - freeeのCSVインポートは「取引(Deal)」ではなく「振替伝票」として登録される
    - 「伝票No.」が同じ行を1つの仕訳として扱う
    - タグ（取引先・品目・メモタグ）を各JournalEntryに付与
    - セグメント1〜3はアドバンスプラン以上
    """
    def parse(self, content: bytes) -> ConversionResult:
        result = ConversionResult()
        for enc in ["utf-8-sig", "utf-8", "shift_jis"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            result.errors.append(EncodingError("デコード不可"))
            return result

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            result.errors.append(ValidationError("ヘッダー行が読めません"))
            return result

        # 「表題行」「明細行」の判定
        has_title_col = "表題行" in reader.fieldnames

        groups: Dict[str, List[dict]] = {}
        group_order: List[str] = []

        for row_num, row in enumerate(reader, start=2):
            # 表題行フォーマットの場合、[明細行]のみ処理
            if has_title_col and str(row.get("表題行", "")).strip() != "明細行":
                continue

            slip_no = str(row.get("伝票No.", row.get("伝票番号", ""))).strip()
            if not slip_no:
                slip_no = f"_auto_{row_num}"

            if slip_no not in groups:
                groups[slip_no] = []
                group_order.append(slip_no)
            groups[slip_no].append({"row_num": row_num, **dict(row)})

        for slip_no in group_order:
            tx = self._build_transaction(slip_no, groups[slip_no], result)
            if tx:
                result.transactions.append(tx)

        return result

    def _build_transaction(
        self, slip_no: str, rows: List[dict], result: ConversionResult
    ) -> Optional[Transaction]:
        tx = Transaction(origin_id=slip_no)
        first = rows[0]
        rn = first.get("row_num", -1)

        d = parse_date(str(first.get("取引日", "")).strip())
        if d is None:
            result.errors.append(ValidationError("取引日が解析不能", rn, "取引日"))
            return None
        tx.date = d
        tx.description = first.get("摘要", "")

        for row in rows:
            rn = row.get("row_num", -1)
            # freeeは借方・貸方が同一行に存在する（振替伝票形式）
            for side_prefix, side_enum in [("借方", Side.DEBIT), ("貸方", Side.CREDIT)]:
                acc = str(row.get(f"{side_prefix} 勘定科目", "")).strip()
                if not acc:
                    continue
                try:
                    amt = parse_amount(str(row.get(f"{side_prefix} 金額", "0")))
                except Exception:
                    result.errors.append(ValidationError(f"{side_prefix}金額が不正", rn))
                    amt = Decimal("0")

                tax_raw = str(row.get(f"{side_prefix} 税区分", "")).strip()
                tax_code = TaxCodeMaster.to_standard("freee", tax_raw) if tax_raw else "S0"

                # タグ変換
                partner = normalize_text(str(row.get(f"{side_prefix} 取引先", "")), 30)
                item = normalize_text(str(row.get(f"{side_prefix} 品目", "")), 30)
                memo_tags_raw = str(row.get("メモタグ(複数指定可)", "")).strip()
                memo_tags = [t.strip() for t in memo_tags_raw.split("|") if t.strip()]

                entry = JournalEntry(
                    side=side_enum,
                    account_name=normalize_text(acc, 30),
                    sub_account_name=normalize_text(
                        str(row.get(f"{side_prefix} 補助科目", "")), 30
                    ),
                    dept_name=normalize_text(
                        str(row.get(f"{side_prefix} 部門", "")), 20
                    ),
                    amount=amt,
                    tax_code=tax_code,
                    tax_name_raw=tax_raw,
                    description=normalize_text(str(row.get("摘要", "")), 0),
                    partner_name=partner,
                    item_name=item,
                    memo_tags=memo_tags,
                    segment1=str(row.get(f"{side_prefix} セグメント1", "")),
                    segment2=str(row.get(f"{side_prefix} セグメント2", "")),
                    segment3=str(row.get(f"{side_prefix} セグメント3", "")),
                )
                # インボイス情報
                inv_raw = str(row.get("インボイス区分", "")).strip()
                if inv_raw == "適格":
                    entry.invoice_status = InvoiceStatus.QUALIFIED
                elif inv_raw in ("非適格", "不適格"):
                    entry.invoice_status = InvoiceStatus.NON_QUALIFIED
                entry.registration_no = str(row.get("登録番号", "")).strip()

                tx.entries.append(entry)

        if tx.entries and not tx.is_balanced():
            result.errors.append(BalanceError(slip_no, tx.debit_total(), tx.credit_total()))
            return None

        return tx


# ============================================================
# 9. エクスポーター群（中間型 → 各社CSV）
# ============================================================

class YayoiExporter:
    """
    中間型 → 弥生インポート形式CSV（Shift-JIS or UTF-8 BOM出力）

    文字数制限（弥生公式仕様）:
      - 勘定科目: 24文字
      - 補助科目: 24文字
      - 部門: 24文字
      - 摘要: 256文字
    freeeタグ統合:
      - freeeの「品目」「取引先」「メモタグ」は摘要に統合して出力
    """
    # 弥生公式文字数制限
    MAX_ACCOUNT = 24
    MAX_SUB = 24
    MAX_DEPT = 24
    MAX_DESC = 256

    def _build_description(self, entry: Optional[JournalEntry], tx: Transaction) -> str:
        """
        摘要を構築。freeeのタグ（取引先・品目・メモ）があれば摘要に統合。
        弥生には「取引先」「品目」列がないため、摘要に全情報を詰め込む。
        """
        parts = []
        # メインの摘要
        desc = ""
        if entry and entry.description:
            desc = entry.description
        elif tx.description:
            desc = tx.description
        if desc:
            parts.append(desc)

        if entry:
            # freeeの取引先名を摘要に統合
            if hasattr(entry, 'partner_name') and entry.partner_name:
                parts.append(entry.partner_name)
            # freeeの品目を摘要に統合
            if hasattr(entry, 'item_name') and entry.item_name:
                parts.append(entry.item_name)
            # メモタグを摘要に統合
            if hasattr(entry, 'memo_tags') and entry.memo_tags:
                parts.extend(entry.memo_tags)

        result = " ".join(parts)
        return result[:self.MAX_DESC]

    def export(self, transactions: List[Transaction]) -> bytes:
        rows = []
        for tx in transactions:
            debits = [e for e in tx.entries if e.side == Side.DEBIT]
            credits = [e for e in tx.entries if e.side == Side.CREDIT]

            max_len = max(len(debits), len(credits))
            slip_no = tx.origin_id or ""

            for i in range(max_len):
                dr = debits[i] if i < len(debits) else None
                cr = credits[i] if i < len(credits) else None

                row = [""] * 25
                row[0] = "2000"  # 識別子（単一仕訳）
                row[1] = slip_no
                row[2] = "決算" if tx.closing_flag else ""
                row[3] = tx.date.strftime("%Y/%m/%d") if tx.date else ""

                if dr:
                    row[4] = to_sjis_safe(dr.account_name[:self.MAX_ACCOUNT])
                    row[5] = to_sjis_safe(dr.sub_account_name[:self.MAX_SUB])
                    row[6] = to_sjis_safe(dr.dept_name[:self.MAX_DEPT])
                    row[7] = TaxCodeMaster.to_platform(dr.tax_code, "yayoi")
                    row[8] = str(dr.amount)
                    row[9] = str(dr.tax_amount) if dr.tax_amount else ""

                if cr:
                    row[10] = to_sjis_safe(cr.account_name[:self.MAX_ACCOUNT])
                    row[11] = to_sjis_safe(cr.sub_account_name[:self.MAX_SUB])
                    row[12] = to_sjis_safe(cr.dept_name[:self.MAX_DEPT])
                    row[13] = TaxCodeMaster.to_platform(cr.tax_code, "yayoi")
                    row[14] = str(cr.amount)
                    row[15] = str(cr.tax_amount) if cr.tax_amount else ""

                # 摘要: freeeタグ統合 + 256文字制限
                desc = self._build_description(dr or cr, tx)
                row[16] = to_sjis_safe(desc)

                # 列19: タイプ(0), 刑24: 調整(NO)
                row[19] = "0"
                row[24] = "NO"

                rows.append(row)

        # UTF-8 BOM付きCSV生成（弥生公式推奨形式）
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\r\n")
        writer.writerows(rows)
        return ("\ufeff" + buf.getvalue()).encode("utf-8")


class MFExporter:
    """
    中間型 → マネーフォワード仕訳帳CSV（UTF-8 BOM付き）

    列順序: MF実機エクスポート（課税事業者27列版）に準拠。
    インポート用に不要な列（作成日時等4列）を除外した23列で出力。

    列順の根拠（実機確認済み）:
      部門 → 取引先 → 税区分 → インボイス → 金額(円) → 税額

    文字数制限（MF公式仕様）:
      - 勘定科目: 30文字
      - 摘要: 200文字
    """
    MAX_ACCOUNT = 30
    MAX_DESC = 200

    HEADERS = [
        "取引No", "取引日",
        "借方勘定科目", "借方補助科目", "借方部門", "借方取引先",
        "借方税区分", "借方インボイス", "借方金額(円)", "借方税額",
        "貸方勘定科目", "貸方補助科目", "貸方部門", "貸方取引先",
        "貸方税区分", "貸方インボイス", "貸方金額(円)", "貸方税額",
        "摘要", "仕訳メモ", "タグ", "MF仕訳タイプ", "決算整理仕訳",
    ]

    def _invoice_str(self, entry: Optional[JournalEntry]) -> str:
        """インボイス区分を文字列に変換"""
        if not entry:
            return ""
        mapping = {
            InvoiceStatus.QUALIFIED: "適格",
            InvoiceStatus.NON_QUALIFIED: "区分記載",
            InvoiceStatus.NONE: "",
        }
        return mapping.get(entry.invoice_status, "")

    def export(self, transactions: List[Transaction]) -> bytes:
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\r\n")
        writer.writerow(self.HEADERS)

        for seq, tx in enumerate(transactions, start=1):
            debits = [e for e in tx.entries if e.side == Side.DEBIT]
            credits = [e for e in tx.entries if e.side == Side.CREDIT]
            max_len = max(len(debits), len(credits), 1)
            txno = str(seq)
            date_str = tx.date.strftime("%Y/%m/%d") if tx.date else ""

            for i in range(max_len):
                dr = debits[i] if i < len(debits) else None
                cr = credits[i] if i < len(credits) else None

                # 摘要: 改行除去 + 200文字制限
                desc = ""
                if i == 0:
                    desc = tx.description.replace("\r\n", " ").replace("\n", " ")[:self.MAX_DESC] if tx.description else ""
                elif dr and dr.description:
                    desc = dr.description.replace("\r\n", " ").replace("\n", " ")[:self.MAX_DESC]

                row = [
                    txno,
                    date_str if i == 0 else "",
                    # 借方: 科目→補助→部門→取引先→税区分→インボイス→金額(円)→税額
                    dr.account_name[:self.MAX_ACCOUNT] if dr else "",
                    dr.sub_account_name if dr else "",
                    dr.dept_name if dr else "",
                    dr.partner_name if dr and hasattr(dr, 'partner_name') else "",
                    TaxCodeMaster.to_platform(dr.tax_code, "mf") if dr else "",
                    self._invoice_str(dr) if i == 0 else "",
                    str(dr.amount) if dr else "",
                    str(dr.tax_amount) if dr and dr.tax_amount else "",
                    # 貸方: 科目→補助→部門→取引先→税区分→インボイス→金額(円)→税額
                    cr.account_name[:self.MAX_ACCOUNT] if cr else "",
                    cr.sub_account_name if cr else "",
                    cr.dept_name if cr else "",
                    cr.partner_name if cr and hasattr(cr, 'partner_name') else "",
                    TaxCodeMaster.to_platform(cr.tax_code, "mf") if cr else "",
                    self._invoice_str(cr) if i == 0 else "",
                    str(cr.amount) if cr else "",
                    str(cr.tax_amount) if cr and cr.tax_amount else "",
                    # 共通
                    desc,
                    "",  # 仕訳メモ
                    "",  # タグ
                    "インポート",  # MF仕訳タイプ
                    "1" if tx.closing_flag else "",
                ]
                writer.writerow(row)

        # UTF-8 BOM付き（MF公式推奨）
        return ("\ufeff" + buf.getvalue()).encode("utf-8")


class FreeeExporter:
    """
    中間型 → freee振替伝票形式CSV（UTF-8 BOMなし）

    タグ変換ロジック（優先順位）:
    1. sub_account_name があれば → 補助科目
    2. partner_name があれば → 取引先タグ
    3. item_name があれば → 品目タグ
    4. memo_tags → メモタグ(|区切り)
    """

    HEADERS = [
        "伝票No.", "取引日", "決算整理",
        "借方 勘定科目", "借方 補助科目", "借方 部門",
        "借方 取引先", "借方 品目", "借方 税区分", "借方 金額", "借方 税額",
        "貸方 勘定科目", "貸方 補助科目", "貸方 部門",
        "貸方 取引先", "貸方 品目", "貸方 税区分", "貸方 金額", "貸方 税額",
        "摘要", "メモタグ(複数指定可)", "インボイス区分", "登録番号",
        "借方 セグメント1", "借方 セグメント2", "借方 セグメント3",
        "貸方 セグメント1", "貸方 セグメント2", "貸方 セグメント3",
    ]

    def _tag_to_partner_item(self, entry: JournalEntry) -> Tuple[str, str]:
        """補助科目→取引先/品目への変換ロジック"""
        partner = entry.partner_name
        item = entry.item_name
        # 補助科目が存在し、取引先・品目が未設定の場合は品目にマッピング
        if entry.sub_account_name and not partner and not item:
            item = entry.sub_account_name
        return partner, item

    def _invoice_str(self, status: InvoiceStatus) -> str:
        mapping = {
            InvoiceStatus.QUALIFIED: "適格",
            InvoiceStatus.NON_QUALIFIED: "非適格",
            InvoiceStatus.NONE: "",
        }
        return mapping.get(status, "")

    def export(self, transactions: List[Transaction]) -> bytes:
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\r\n")
        writer.writerow(self.HEADERS)

        for seq, tx in enumerate(transactions, start=1):
            debits = [e for e in tx.entries if e.side == Side.DEBIT]
            credits = [e for e in tx.entries if e.side == Side.CREDIT]
            max_len = max(len(debits), len(credits), 1)

            for i in range(max_len):
                dr = debits[i] if i < len(debits) else None
                cr = credits[i] if i < len(credits) else None

                dr_partner, dr_item = self._tag_to_partner_item(dr) if dr else ("", "")
                cr_partner, cr_item = self._tag_to_partner_item(cr) if cr else ("", "")

                memo_tags_str = ""
                if dr and dr.memo_tags:
                    memo_tags_str = "|".join(dr.memo_tags)
                elif cr and cr.memo_tags:
                    memo_tags_str = "|".join(cr.memo_tags)

                invoice_status = self._invoice_str(
                    dr.invoice_status if dr else InvoiceStatus.NONE
                )
                reg_no = dr.registration_no if dr else (cr.registration_no if cr else "")

                row = [
                    str(seq),
                    tx.date.strftime("%Y/%m/%d") if tx.date else "",
                    "1" if tx.closing_flag else "",
                    # 借方
                    dr.account_name if dr else "",
                    dr.sub_account_name if dr else "",
                    dr.dept_name if dr else "",
                    dr_partner,
                    dr_item,
                    TaxCodeMaster.to_platform(dr.tax_code, "freee") if dr else "",
                    str(dr.amount) if dr else "",
                    str(dr.tax_amount) if dr and dr.tax_amount else "",
                    # 貸方
                    cr.account_name if cr else "",
                    cr.sub_account_name if cr else "",
                    cr.dept_name if cr else "",
                    cr_partner,
                    cr_item,
                    TaxCodeMaster.to_platform(cr.tax_code, "freee") if cr else "",
                    str(cr.amount) if cr else "",
                    str(cr.tax_amount) if cr and cr.tax_amount else "",
                    # 共通
                    tx.description if i == 0 else "",
                    memo_tags_str,
                    invoice_status,
                    reg_no,
                    # セグメント
                    dr.segment1 if dr else "",
                    dr.segment2 if dr else "",
                    dr.segment3 if dr else "",
                    cr.segment1 if cr else "",
                    cr.segment2 if cr else "",
                    cr.segment3 if cr else "",
                ]
                writer.writerow(row)

        return buf.getvalue().encode("utf-8")


# ============================================================
# 10. 変換パイプライン（ファサード）
# ============================================================

class AccountingConverter:
    """
    使用例:
        converter = AccountingConverter()
        result = converter.convert(
            src_bytes, src_format="yayoi", dst_format="freee"
        )
    """
    PARSERS = {
        "yayoi": YayoiParser,
        "mf": MFParser,
        "freee": FreeeParser,
        "freee_journal": FreeeJournalParser,  # 95列仕訳帳エクスポート用
    }
    EXPORTERS = {
        "yayoi": YayoiExporter,
        "mf": MFExporter,
        "freee": FreeeExporter,
    }

    def convert(
        self,
        src_bytes: bytes,
        src_format: str,
        dst_format: str,
    ) -> Tuple[ConversionResult, Optional[bytes]]:
        """
        Returns: (ConversionResult, 出力CSV bytes or None)
        """
        parser_cls = self.PARSERS.get(src_format)
        exporter_cls = self.EXPORTERS.get(dst_format)

        if not parser_cls:
            result = ConversionResult()
            result.errors.append(ConversionError(f"未対応の入力形式: {src_format}"))
            return result, None
        if not exporter_cls:
            result = ConversionResult()
            result.errors.append(ConversionError(f"未対応の出力形式: {dst_format}"))
            return result, None

        parse_result = parser_cls().parse(src_bytes)
        if not parse_result.success:
            return parse_result, None

        output_bytes = exporter_cls().export(parse_result.transactions)
        return parse_result, output_bytes
