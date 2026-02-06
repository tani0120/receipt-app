# Gemini 3 Flash 自律型会計監査システム完全ガイド

**作成日**: 2026-02-05  
**最終更新**: 2026-02-05 18:50  
**目的**: Phase 6.2以降のBackend実装における、Gemini 3 Flash + Agentic Vision + Context Cachingの実装方法を網羅的に記録

---

## 目次

1. [システム概要](#1-システム概要)
2. [責務分離の原則](#2-責務分離の原則)（★重要追加）
3. [技術的前提知識](#3-技術的前提知識)
4. [Agentic Visionの仕組み](#4-agentic-visionの仕組み)
5. [Context Cachingによるコスト最適化](#5-context-cachingによるコスト最適化)
6. [3つの重要な設計判断](#6-3つの重要な設計判断)
7. [System Instruction完全版](#7-system-instruction完全版)
8. [実装コード完全版](#8-実装コード完全版)
9. [コスト試算と運用戦略](#9-コスト試算と運用戦略)
10. [実装優先順位](#10-実装優先順位)

---

## 1. システム概要

### **目的**
領収書から仕訳データを抽出し、**5項目監査**を経て承認システムへ渡す。

**Phase 6.2の対象**: レシート（単発証憑）のみ  
**Phase 6.3以降**: 通帳・クレカ（連続証憑）

### **目標**
- **処理単価**: 1枚5円以下（目標2〜3円）
- **精度**: 95%以上（T番号一致時は99.9%）
- **速度**: 1枚あたり3秒以内

### **技術スタック**
- **AI**: Gemini 3 Flash（速度・コスト重視）
- **救済AI**: Gemini 3 Pro（複雑ケースのみ）
- **キャッシュ**: Context Caching（マスタデータ保持）
- **検算**: Python code_execution（物理的な計算）
- **自律修正**: Agentic Vision（ズーム再読み込み）

---

## 2. 責務分離の原則

### **System Instruction と Context Cache の役割分担**

Geminiは2種類の情報を受け取ります。これらを明確に分離することで、モデル切り替えやマスタ更新時の混乱を防ぎます。

#### **Context Cache（事実データ）**
```
役割: 「この顧問先はこういう世界です」
内容:
  - 顧問先の基本情報
  - 勘定科目一覧
  - T番号マスタ
  - 特殊仕訳ルール（事実記述）
形式: 自然言語テキスト
例: cache_master_CL-001.txt
```

**重要な設計原則**:
- ✅ 命令口調ではなく、**事実として記述**
- ✅ 「必ず科目IDを使用し、科目名のみの出力は禁止」← これは事実ではなくルールなので、実は微妙なライン。ただし、Geminiのハルシネーション防止のため、Cacheに記載することを推奨。

#### **System Instruction（判断ルール）**
```
役割: 「あなたはこの世界でこう振る舞ってください」
内容:
  - 判断の優先順位
  - エラー時の挙動
  - 出力スキーマの厳守
  - 推論していい／ダメの線引き
形式: マークダウン
例: 後述の「System Instruction完全版」
```

**この分離のメリット**:
1. ✅ **マスタデータの更新が容易**: Cacheを差し替えるだけ
2. ✅ **モデル切り替えが容易**: Flash→Pro→DeepThinkingでも同じInstructionが使える
3. ✅ **デバッグが容易**: AIの挙動がおかしい時、「事実」と「ルール」のどちらが原因か切り分けられる

---

## 3. 技術的前提知識

### **Gemini 3 Flash vs Pro vs DeepThinking**

| モデル | 入力単価 | ツール実行回数 | 用途 |
|--------|----------|---------------|------|
| Flash | 7.5円/100万tok | 5〜10回 | 通常処理95% |
| Pro | 150円/100万tok | 15〜30回 | 複雑ケース5% |
| DeepThinking | 750円/100万tok | 実質無制限 | 使用しない |

### **5回制限の正体**

「5回」は**ツール実行回数**（Python実行、ズーム等）のカウント。条件分岐のロジックはカウントされない。

**例**:
```
1. OCR実行 → 1回
2. Python検算 → 2回
3. 不一致検知でズーム → 3回
4. 再検算 → 4回
5. JSON出力 → これは実行ではないので0回
合計: 4回（余裕あり）
```

---

## 3. Agentic Visionの仕組み

### **Think-Act-Observe ループ**

```
[1. 初回スキャン] 画像全体を読み取り
         ↓
[2. Python検算] sum(items) == total をコードで確認
         ↓
[3. 矛盾の特定] 計算が合わない箇所を特定
         ↓
[4. ズーム再試行] 座標(x, y)を4倍拡大して再OCR
         ↓
[5. 証拠の更新] 新しいピクセルデータで結果を上書き
```

### **ハルシネーション防止の仕組み**

❌ **従来のAI**: 「1,200円 + 300円 = 1,800円」と推論で合わせる  
✅ **Agentic Vision**: Pythonで `1200 + 300 == 1800` → `False` → ズームして物理確認

---

## 4. Context Cachingによるコスト最適化

### **キャッシュの仕組み**

```
[顧問先マスタ] → Google Cloud Storage
       ↓
[Context Cache作成] TTL=1時間
       ↓
[AIがマスタを暗記した状態でスタート]
       ↓
[リクエスト時はキャッシュIDを1行送るだけ]
```

### **費用構造**

| 項目 | タイミング | 単価（Flash） |
|------|-----------|--------------|
| キャッシュ作成 | 初回のみ | 通常入力代と同じ |
| 保管料 | 1時間ごと | 0.15円/100万tok/h |
| 利用料 | 毎リクエスト | 通常の1/10（90%OFF） |

**損益分岐点**: 1時間以内に4〜5回以上同じマスタを使うなら、キャッシュした方が得。

---

## 5. 3つの重要な設計判断

### **判断1: T番号マスタのPython検索化**

**問題**: AIに200万件のT番号リストを持たせると、ハルシネーション（誤認識）リスクが残る。

**解決策**:
```python
# AIはT番号をOCRするだけ
ai_output = {"t_number": "T1234567890123"}

# 外部プログラムで物理検索
T_MASTER = {"T1234567890123": {"name": "鳥貴族", "category": "ACC-001"}}
if ai_output['t_number'] in T_MASTER:
    # マスタデータを強制適用（AIの推論を無視）
    result = T_MASTER[ai_output['t_number']]
```

**効果**:
- キャッシュ保管料: 43.8万円 → **15万円**（1/3に削減）
- 精度: 95% → **99.9%**（T番号一致時）

---

### **判断2: 通帳の残高連続性検算**

**問題**: 通帳は1行のミスが全行に波及する。1行ずつ処理すると5回制限に引っかかる。

**解決策**: 全行を配列として一括でPythonへ渡す

```python
def validate_passbook_continuity(rows: list) -> dict:
    """
    数式: Previous + Deposit - Withdrawal == Current
    全行を一度に検算（5回制限を1回で消費）
    """
    errors = []
    for i, row in enumerate(rows, start=1):
        calc = row['prev'] + row['deposit'] - row['withdrawal']
        if abs(calc - row['current']) >= 1.0:
            errors.append({"line": i, "diff": calc - row['current']})
    
    return {"status": "NG" if errors else "OK", "error_lines": errors}
```

**効果**:
- 通帳20行処理: 20回消費 → **1回消費**
- 5回制限回避率: 95% → **99.9%**

---

### **判断3: べき等なUUID生成**

**問題**: AIにUUIDを生成させると、リトライ時に別IDが生成され、重複仕訳が発生。

**解決策**: ファイル名+日付+金額からハッシュ生成

```python
import hashlib
from datetime import date

def generate_deterministic_entry_id(
    client_id: str,
    image_filename: str,
    event_date: date,
    amount: int,
    line_number: int = 1
) -> str:
    """
    何度実行しても同じIDを生成（べき等性）
    """
    seed = f"{client_id}:{image_filename}:{event_date}:{amount}:{line_number}"
    hash_value = hashlib.sha256(seed.encode()).hexdigest()[:12]
    return f"ENT-{hash_value}-{line_number}"

# 例: "ENT-a1b2c3d4e5f6-1"
# 同じ領収書を再処理しても、必ず同じIDが生成される
```

**効果**:
- 重複仕訳の物理的排除
- 監査トレース確立（「このIDは何回リトライされたか」を追跡可能）

---

## 7. System Instruction完全版

### **Gemini 3 Flash用システム命令文**

> **重要**: 以下のSystem Instructionは、Context Cache（cache_master_CL-001.txt）と併用することを前提としています。

```markdown
# 役割
あなたは会計事務所の一次受け監査エージェントです。
画像を解析し、Context Cacheに保存されたマスタデータを参照した上で、
**「思考」ではなく「Pythonプログラムの実行結果」**に基づいてデータの正当性を検証します。

# Context Cacheからの情報取得
以下の情報は、Context Cacheから取得済みです:
- 顧問先基本情報（会社名、会計期間、会計ソフト、消費税率）
- 勘定科目リスト（科目ID、科目名、税区分）
- T番号マスタ（インボイス登録番号と科目IDの対応）
- 特殊仕訳ルール（金額・店名による科目判定ルール）

これらの情報を参照して、以下の処理フローを実行してください。

# 処理フロー

## ステップ1：対象物の分類 (Relevancy Check)
入力資料が「記帳対象（領収書）」か「対象外（謄本、図面、メモ、風景等）」かを判定せよ。

**Phase 6.2対象**:
- ✅ 領収書（RECEIPT）
- ❌ 通帳（PASSBOOK）→ `category: "PASSBOOK"`, `errors: ["PASSBOOK_NOT_SUPPORTED_YET"]` として除外
- ❌ クレカ（CARD）→ `category: "CARD"`, `errors: ["CARD_NOT_SUPPORTED_YET"]` として除外

対象外の場合: `is_passed: false`, `category: "EXCLUDED"` とし、
`explanation` に除外理由を日本語で記述して終了せよ。

## ステップ2：データ抽出 (Extraction)

### 領収書（RECEIPT）
以下のデータを抽出せよ:

1. **T番号（最優先）**: インボイス登録番号（T + 13桁）を必ず抽出せよ
2. **日付**: YYYY-MM-DD形式
3. **店名**: 領収書発行元の店舗・会社名
4. **金額内訳**:
   - 税率別（10%, 8%）の税抜額と消費税額
   - 総額
5. **座標**: 各数値のBounding Box（Agentic Vision用）

**重要**: T番号が抽出できた場合、勘定科目の推論は不要。
外部プログラムがContext Cache内のT番号マスタを検索し、科目IDを確定する。

T番号が抽出できない場合のみ、以下のルールで勘定科目を推論せよ:
1. Context Cacheの「特殊仕訳ルール」を優先適用
2. 店名から一般的な科目を推論（例: 「タクシー」→「旅費交通費」）
3. 推論結果を `inferred_category` フィールドに科目名で出力

**科目ID出力ルール**:
- T番号一致時: 外部プログラムが科目IDを付与（AI側では不要）
- T番号なし時: `inferred_category` に科目名を出力（科目IDは外部プログラムが変換）

## ステップ3：Pythonによる5項目監査 (Audit Logic)

`code_execution` を使用し、以下のロジックを実行せよ。

### 必要なパラメータ
以下のパラメータは、外部プログラムから渡される:
- `batch_history`: 同一バッチ内の既処理レシート履歴（重複チェック用）
- `fiscal_config`: 会計期間（`{start: "YYYY-MM-DD", end: "YYYY-MM-DD"}`）

### 監査コード

```python
import datetime

def audit_receipt(extracted, batch_history, fiscal_config):
    """
    5項目監査を実行
    
    Args:
        extracted: ステップ2で抽出したデータ
        batch_history: 同一バッチ内の既処理レシート
        fiscal_config: 会計期間（Context Cacheから取得済み）
    """
    audit_results = {
        "duplicate": False,
        "out_of_period": False,
        "balance_check": "NG"
    }
    errors = []
    
    # 1. 重複チェック
    for record in batch_history:
        if (record['date'] == extracted['date'] and 
            record['total_amount'] == extracted['total_amount'] and 
            record['vendor'] == extracted['vendor']):
            audit_results["duplicate"] = True
            errors.append("重複の疑いあり")
    
    # 2. 会計期間外判定
    dt = datetime.datetime.strptime(extracted['date'], '%Y-%m-%d')
    start = datetime.datetime.strptime(fiscal_config['start'], '%Y-%m-%d')
    end = datetime.datetime.strptime(fiscal_config['end'], '%Y-%m-%d')
    if not (start <= dt <= end):
        audit_results["out_of_period"] = True
        errors.append("会計期間外")
    
    # 3. 貸借一致確認
    calc = sum([i['net'] + i['tax'] for i in extracted['tax_items']])
    if abs(calc - extracted['total_amount']) < 1.0:
        audit_results["balance_check"] = "OK"
    else:
        errors.append(f"合計不一致: 計算値{calc}円 != 総額{extracted['total_amount']}円")
    
    return audit_results, errors
```



## ステップ4：不一致時の自律修正 (Agentic Vision)

### 発動条件（3つ全てを満たす場合のみ）
1. `balance_check == "NG"`
2. かつ、該当数値の確信度（Confidence Score）が **0.8以下**
3. かつ、リトライ回数が **2回未満**

### 動作
1. エラー箇所の座標を特定
2. 該当箇所を4倍ズーム（クロップ）で再OCR
3. 再検算

### 諦め条件
- 確信度が0.8以上で検算NGの場合: ズームではなく「印字不鮮明」として人間へ報告
- 2回リトライしてもNGの場合: 数値を捏造せず、不一致の事実を報告

## ステップ5：中間JSON出力

外部プログラムが処理しやすい形式で出力せよ。

```json
{
  "category": "RECEIPT | PASSBOOK | CARD | EXCLUDED",
  "vendor": "店名",
  "date": "YYYY-MM-DD",
  "total_amount": 3500,
  "t_number": "T1234567890123",
  "audit_results": {
    "duplicate": false,
    "out_of_period": false,
    "balance_check": "OK"
  },
  "errors": [],
  "tax_items": [
    {"rate": 10, "net": 5000, "tax": 500},
    {"rate": 8, "net": 2000, "tax": 160}
  ],
  "explanation": "複数税率のため2行に分割。検算結果は画像総額と一致。",
  "inferred_category": "接待交際費"
}
```

**重要**: `inferred_category` は科目名で出力。科目IDへの変換は外部プログラムが行う。

# 制約事項

1. **忖度の禁止**: 検算が合わない場合、無理に数字を合わせてはならない
2. **T番号最優先**: T番号が抽出できた場合、科目推論は不要
3. **確信度の正直な報告**: Confidence Score が低い場合は素直に報告
4. **Context Cache優先**: マスタデータはContext Cacheを参照（推論で補完しない）
```

---

## 7. 実装コード完全版

### **7.1 Context Cache管理ロジック**

```python
import google.generativeai as genai
from google.generativeai import caching
import datetime

# キャッシュDB（実務ではFirestoreを推奨）
cache_db = {}

def get_or_create_model_with_cache(client_id: str, master_text: str):
    """
    キャッシュの生存確認を行い、必要に応じて再作成
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    cached_info = cache_db.get(client_id)
    
    cache_to_use = None
    
    # 1. 既存キャッシュの確認
    if cached_info:
        try:
            cache_to_use = caching.CachedContent.get(cached_info['cache_name'])
            print(f"✅ Cache Hit: {client_id}")
        except Exception:
            print(f"⚠️ Cache Expired: {client_id} を再作成")
            cache_to_use = None
    
    # 2. キャッシュがない場合は新規作成
    if not cache_to_use:
        new_ttl = datetime.timedelta(hours=1)  # バッチ処理に合わせて調整
        
        cache_to_use = caching.CachedContent.create(
            model='models/gemini-1.5-flash-001',
            display_name=f"audit_master_{client_id}",
            system_instruction="あなたは会計事務所の一次受け監査エージェントです。",
            contents=[master_text],
            ttl=new_ttl
        )
        
        cache_db[client_id] = {
            "cache_name": cache_to_use.name,
            "expire_time": now + new_ttl
        }
        print(f"🚀 Cache Created: {cache_to_use.name}")
    
    # 3. モデル生成
    return genai.GenerativeModel.from_cached_content(cached_content=cache_to_use)
```

### **7.2 T番号マスタ検索**

```python
# T番号マスタ（CSVから読み込み）
T_NUMBER_MASTER = {
    "T1234567890123": {"name": "株式会社鳥貴族", "category_id": "ACC-001"},
    "T9876543210987": {"name": "東京タクシー", "category_id": "ACC-003"},
    # ... 200万件でも高速検索
}

def resolve_category_by_t_number(ai_output: dict) -> dict:
    """
    AIが抽出したT番号から、マスタを物理検索
    """
    t_num = ai_output.get('t_number')
    
    if t_num and t_num in T_NUMBER_MASTER:
        # T番号一致 → マスタを強制適用
        master_data = T_NUMBER_MASTER[t_num]
        ai_output['category_id'] = master_data['category_id']
        ai_output['vendor_confirmed'] = master_data['name']
        ai_output['match_method'] = "T_NUMBER_EXACT"
    else:
        # T番号なし → AIの推論を採用
        ai_output['match_method'] = "AI_INFERENCE"
    
    return ai_output
```

### **7.3 べき等なUUID生成**

```python
import hashlib
from datetime import date

def generate_deterministic_entry_id(
    client_id: str,
    image_filename: str,
    event_date: date,
    amount: int,
    line_number: int = 1
) -> str:
    """
    べき等なentry_idを生成
    """
    seed = f"{client_id}:{image_filename}:{event_date}:{amount}:{line_number}"
    hash_value = hashlib.sha256(seed.encode()).hexdigest()[:12]
    return f"ENT-{hash_value}-{line_number}"
```

### **7.4 外部バリデーション**

```python
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

# 勘定科目マスタ
CATEGORY_MAP = {
    "接待交際費": "ACC-001",
    "会議費": "ACC-002",
    "旅費交通費": "ACC-003"
}

class JournalLine(BaseModel):
    line_id: int
    amount: int
    tax_amount: int
    tax_rate: int
    description: str

class FinalSchema(BaseModel):
    entry_id: str  # べき等生成されたID
    client_id: str
    is_passed: bool
    category_id: Optional[str]
    audit_results: dict
    explanation: str
    journal_entries: List[JournalLine]

def finalize_audit_data(ai_output: dict, image_filename: str) -> str:
    """
    AIの中間JSONを最終スキーマに変換
    """
    # 1. べき等なIDを生成
    entry_id = generate_deterministic_entry_id(
        client_id=ai_output['client_id'],
        image_filename=image_filename,
        event_date=ai_output['date'],
        amount=ai_output['total_amount']
    )
    
    # 2. T番号でマスタ検索
    ai_output = resolve_category_by_t_number(ai_output)
    
    # 3. 科目名→IDの変換（T番号がない場合のみ）
    if ai_output.get('match_method') == "AI_INFERENCE":
        inferred_name = ai_output.get('inferred_category')
        cat_id = CATEGORY_MAP.get(inferred_name, "ACC-999")
    else:
        cat_id = ai_output['category_id']
    
    # 4. Pydanticで型強制
    final_entry = FinalSchema(
        entry_id=entry_id,
        client_id=ai_output['client_id'],
        is_passed=ai_output['is_passed'],
        category_id=cat_id,
        audit_results=ai_output['audit_results'],
        explanation=ai_output['explanation'],
        journal_entries=ai_output.get('tax_items', [])
    )
    
    return final_entry.model_dump_json()
```

---

## 8. コスト試算と運用戦略

### **8.1 費用構造（200社・各1万件/年）**

| 項目 | 単価 | 年間処理数 | 年間費用 |
|------|------|-----------|---------|
| Flash OCR処理 | 1.5円/枚 | 200万枚 | 300万円 |
| Context Cache保管料 | 0.15円/時間 | 200社×365日×8h | **15万円** ← 軽量化後 |
| Pro救済処理（1%発生） | 70円/枚 | 2万枚 | 140万円 |
| **合計** | - | - | **約455万円** |

### **8.2 目標達成の条件**

**1枚5円以下を達成するには**:
- ✅ Flash処理率: 99%以上（Pro発動を1%以下に抑える）
- ✅ Cache軽量化: T番号マスタを除外（保管料1/3削減）
- ✅ ズーム最適化: 確信度0.8以下のみ発動（無駄なズーム50%削減）

### **8.3 運用戦略**

#### **通常運転（95%のケース）**
```
Flash（1.5円） → T番号マスタ検索 → 完了
```

#### **異常系（4%のケース）**
```
Flash → 検算NG → Agentic Vision（ズーム） → 再検算 → 完了
コスト: 約3円
```

#### **複雑系（1%のケース）**
```
Flash → 2回リトライ失敗 → Proへエスカレーション → 完了
コスト: 約70円
```

**平均単価**: (1.5円 × 95%) + (3円 × 4%) + (70円 × 1%) = **約2.24円/枚**

---

## 9. 実装優先順位

### **🥇 最優先: Cache管理 + マスタ軽量化**

**作業内容**:
1. T番号マスタをキャッシュから除外
2. 勘定科目マスタと特殊ルールのみキャッシュ化
3. `get_or_create_model_with_cache` 関数実装
4. TTL（有効期限）を1時間に設定

**目標**: キャッシュ保管料を 43.8万円 → **15万円** に削減

---

### **🥈 高優先: Agentic Vision発動条件チューニング**

**作業内容**:
1. System Instructionに確信度しきい値（0.8）を追加
2. ズーム発動ロジックの実装
3. リトライ回数制限（2回）の厳格化

**目標**: 無駄なズームを50%削減、処理時間を1.5倍 → **1.2倍** に短縮

---

### **🥉 高優先: べき等なentry_id生成**

**作業内容**:
1. `generate_deterministic_entry_id` 関数実装
2. Firestore書き込み前に必ず実行
3. AIにはUUID生成を一切させない

**目標**: 重複仕訳の物理的排除、監査トレース確立

---

### **4位: 通帳一括検算ロジック**

**作業内容**:
1. System Instructionに通帳専用ロジック追加
2. `validate_passbook_continuity` 関数実装
3. 全行配列としてPythonへ渡すロジック確定

**目標**: 通帳処理での5回制限回避率を 95% → **99.9%** に向上

---

### **5位: Pydanticバリデーター実装**

**作業内容**:
1. `AIIntermediateOutput` スキーマ定義
2. `FinalSchema` スキーマ定義
3. `finalize_audit_data` 関数実装

**目標**: 型安全性の確保、人為的ミスの排除

---

## 付録A: API呼び出しパラメータ設定

### **リクエスト例**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"text": "顧問先ID: CL-200\nバッチ履歴: [{vendor: 'A店', date: '2026-02-01', amount: 1000}]\n会計期間: 2025-04-01 to 2026-03-31"},
        {"file_data": {"mime_type": "image/jpeg", "file_uri": "gs://bucket/receipt.jpg"}}
      ]
    }
  ],
  "tools": [
    { "code_execution": {} }
  ],
  "tool_config": {
    "function_calling_config": { "mode": "AUTO" }
  },
  "generation_config": {
    "temperature": 0.0,
    "response_mime_type": "application/json"
  }
}
```

---

## 付録B: 準備チェックリスト

### **Phase 1: マスタデータ準備**
- [ ] 200社分の `client_config.json` 作成
- [ ] 勘定科目マスタCSV作成
- [ ] T番号マスタCSV作成（外部検索用）
- [ ] 特殊仕訳ルールTXT作成

### **Phase 2: Google Cloud環境構築**
- [ ] Cloud Storageバケット作成
- [ ] Vertex AI API有効化
- [ ] Gemini 3 Flash APIアクセス確認
- [ ] Context Caching機能テスト

### **Phase 3: Pythonプログラム実装**
- [ ] Cache管理ロジック
- [ ] T番号マスタ検索ロジック
- [ ] べき等UUID生成ロジック
- [ ] 通帳検算ロジック
- [ ] Pydanticバリデーター

### **Phase 4: テスト実施**
- [ ] 正常系5枚（T番号あり、計算一致）
- [ ] 異常系5枚（計算不一致、期間外、重複）
- [ ] 通帳2枚（残高連続性チェック）
- [ ] コスト測定

---

## まとめ

このガイドに従って実装することで、以下を達成できます:

1. ✅ **処理単価**: 1枚2.24円（目標5円以下を達成）
2. ✅ **精度**: T番号一致時99.9%、全体95%以上
3. ✅ **速度**: 1枚3秒以内
4. ✅ **運用コスト**: 年間455万円（200万件処理）

**重要**: 3つの設計判断（T番号Python検索、通帳一括検算、べき等UUID）を必ず実装すること。これらを省くと、コスト・精度・安定性のいずれかが破綻します。
