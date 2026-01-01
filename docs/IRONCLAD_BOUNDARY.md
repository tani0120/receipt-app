# Ironclad Architecture Boundary Definition

このドキュメントは、プロジェクト内における **Ironclad Architecture** の適用範囲と品質基準の境界を定義します。

## 1. Ironclad 適用領域 (Strict Zone)

以下のディレクトリ配下のコードは「Ironclad Architecture」の完全な管理下にあり、厳格な品質基準を満たす必要があります。

### 対象ディレクトリ
- **`src/aaa/**`**
    - `src/aaa/aaa_types/**`: UI型定義 (`JobUi`, `ClientUi` 等) - **Optional型禁止、Dumb UI用**
    - `src/aaa/aaa_composables/**`: Mapper (`mapJobApiToUi` 等) - **全ロジックの集約**
    - `src/aaa/aaa_components/**`: UIコンポーネント (`ScreenB` 等) - **ロジック禁止 (Dumb UI)**

### 品質基準
1.  **Strict Linting**: `@typescript-eslint/no-explicit-any` はエラーとする。`any` の使用は原則禁止。
2.  **Dumb UI**: コンポーネント内でのデータ変換、複雑な条件分岐、ビジネスロジックは禁止。Mapperから提供された `Ui` オブジェクトを単純に描画するのみとする。
3.  **Mapper as Source of Truth**: 表示に必要な全てのデータ加工は Mapper で完結させる。
4.  **Mapper as Pure Function**: Mapper 内での API 呼び出しや副作用（fetch, save, mutate 等）は禁止。Mapper は純粋関数として実装する。

---

## 2. 非適用領域 (Relaxed Zone)

以下のディレクトリは、開発用、検証用、またはレガシーコードのサンドボックスであり、Ironclad の厳密なルール適用外とします。

### 対象ディレクトリ
- **`src/Mirror_sandbox/**`**: 鏡の世界（プロトタイプ・実験場）
- **`src/three_sandbox/**`**: 3D検証用など
- **`src/views/debug/**`**: デバッグ用画面、検証用コンポーネント
- **`src/utils/**`** (一部): Seeder, Mockデータ生成など
- **`src/mocks/**`**: テスト用モック

### 品質基準
- **Relaxed Linting**: `any` の使用や未使用変数は許容される（`off` 設定）。
- **目的**: 迅速なプロトタイピング、動作検証、構造設計の試行錯誤を優先する。
- **扱い**: ここで検証されたロジックは、清書・厳格化されて `src/aaa` へと "昇格" する。

### 昇格条件 (Promotion Criteria)
Relaxed Zone から Strict Zone (Ironclad) へコードを昇格させる際の最低条件：
1.  **Optional-free Ui Types**: UI型定義から Optional (`?`) を排除していること。
2.  **Mapper Integration**: ロジックが Mapper に集約され、Pure Function 化されていること。
3.  **Strict Lint Compliance**: `src/aaa` の Strict ESLint ルール下でエラーが 0 であること。

---

## 3. Lint 設定の分離

`eslint.config.ts` により、上記境界に基づいてルールが分離されています。

- `src/aaa/**`: Strict Rules (Error on `any`)
- Other/Sandbox: Relaxed Rules (Allow `any`)

これにより、開発スピード（Sandbox）と製品品質（Ironclad）の両立を図ります。
