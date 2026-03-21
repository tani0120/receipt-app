# Phase C リファクタリング計画

**作成日**: 2026-02-27
**目的**: 本番化に向けた構造改善タスクを管理
**解決時期**: Phase C（Backend接続前）
**移管元**: `04_mock/task_phase_a.md` §5.1 C3, §10（2026-02-27移管）

---

## RC-1: `unsafe/`ディレクトリ廃止

- **現状**: Phase Aでは`any`許可の実験場として使用
- **対応**: Phase C（Backend接続前）で完全廃止
- **手順**:
  1. `unsafe/`内のコードを正しい型で`data/`または`components/`に移行
  2. `unsafe/`へのimport参照がゼロであることを確認
  3. `unsafe/`ディレクトリ削除
  4. ESLintの`unsafe/`例外ルールを削除

---

## RC-2: `tsconfig.pipeline.json`新規作成

- **出典**: `04_mock/task_phase_a.md` §⑥ + `証票分類パイプライン設計書.md` §10-2
- **現状**: `src/scripts/`がDOM用tsconfigの下にある（不整合）
- **対応**:
  1. `tsconfig.pipeline.json`新規作成
  2. `src/scripts/` → `src/pipeline/`リネーム
  3. DOM依存排除
  4. `npx tsc -p tsconfig.pipeline.json --noEmit`通過確認

---

## RC-3: DDL確定

- **出典**: `04_mock/task_phase_a.md` §10
- **対応**: 摩擦レポート結果 → 型・制約・インデックス決定。CHECK制約4つを含む

---

## RC-4: journal_rulesテーブル作成

- **対応**: ルール学習機能のDB基盤

---

## RC-5: Supabase Mapper導入

- **対応**: モック→本番切り替え。`src/database/repositories/`にマッピング関数作成

---

## RC-6: RLSポリシー本番化

- **対応**: client_idフィルタリング。開発環境は設定済み

---

## RC-7: GINインデックス

- **対応**: labels配列検索用インデックス追加

---

## RC-8: モック差し替え

- **対応**: mocksフォルダの参照がテストファイルのみであることを確認後、本番切り替え

---

## RC-9: `/api/clients` エンドポイント500エラー解消（2026-03-14追記）

- **発見経緯**: モック12件のclientId追加作業中、`fetchClients()`のAPI呼び出しが常時500を返すことを確認
- **現状**: `useAccountingSystem.ts` L1248: `client.api.clients.$get()` → 500 Internal Server Error → catch空処理
- **影響**: モック初期化（`mockClientsPreload`のforEach）で動作するため現時点ではUI影響なし。ただし`fetchClients()`呼び出し後の`clients.value`更新が機能しない
- **修正案**:
  1. `src/server.ts`のclientsルートにSupabase接続を実装（RC-5と連動）
  2. 接続前の暫定対応: `fetchClients()`のcatchブロックでモックフォールバック追加
  ```typescript
  // 暫定案: catch内でモックフォールバック
  } catch (e) {
    console.error(e);
    // Fallback: use preloaded mocks
    const safeClients: ClientUi[] = [];
    mockClientsPreload.forEach(c => {
      const processed = processClientPipeline(c, `Fallback-${c.clientCode}`);
      if (processed) safeClients.push(processed);
    });
    clients.value = safeClients;
  }
  ```

> [!IMPORTANT]
> RC-5（Supabase Mapper導入）実施時に本対応も同時完了すること。暫定フォールバックは開発効率改善のため先行実施可。

---

## RC-10: useAccountSettings.tsのACCOUNT_MASTER/TAX_CATEGORY_MASTER直接import解消（2026-03-16追記）

- **発見経緯**: useAccountSettings共有コンポーネント化作業の技術的負債調査で発見
- **現状**: `useAccountSettings.ts` L6-7でACCOUNT_MASTER/TAX_CATEGORY_MASTERを直接import。composable内部4箇所（defaultAccountOrder, defaultTaxOrder, defaultAccountIds, defaultTaxIds）+ saveAccounts/saveTaxCategories内のカスタム行判定で使用
- **問題**: 「データソース切替ポイントを1箇所に集約」という設計目標と矛盾。本番API移行時にuseAccountSettings.ts自体の変更が必要
- **修正案**: useAccountMaster/useTaxMasterにdefaultOrder/defaultIdsを返すcomputedを追加し、useAccountSettings.tsからACCOUNT_MASTER/TAX_CATEGORY_MASTERの直接importを排除
- **時期**: RC-5（Supabase Mapper導入）と同時実施

> [!IMPORTANT]
> RC-5でSupabase APIに切り替える際、useAccountSettings.tsが直接参照している4箇所も同時に修正すること。

---

## RC-11: useStaff副担当（M:N紐付け）の設計（2026-03-17追記）

- **発見経緯**: useStaff紐付けテーブル削除時に、主担当（Client.staffId）のみSource of Truth化。sub担当は未使用だったため削除
- **現状**: Client.staffIdが主担当の唯一のデータソース。副担当は存在しない
- **修正案**: 本番では`client_staff_assignments`テーブル（FK: client_id + staff_id + role）でM:N対応。Phase C RC-5と同時に設計

---

## RC-12: MFマスタCSVバリデーション（2026-03-20追記・保留）

- **発見経緯**: MF公式/非公式表示修正時に、MFマスタデータの鮮度維持方法を調査
- **現状**: `account-master.ts`（個人79+法人87件）と`tax-category-master.ts`（151件）はMFクラウド会計のCSVエクスポートを基に手動作成。税制改正時の更新手段がない
- **調査結果**: MFクラウド会計APIはパートナー限定（一般開発者は利用不可）。APIによる自動取得は❌
- **修正案**: `npm run validate:mf-master`スクリプトを作成。MFからエクスポートしたCSVと`tax-category-master.ts`/`account-master.ts`を差分比較し、追加・名称変更・廃止を検出
- **時期**: ❌保留。税制改正が発生するまでは手動CSV更新で対応

---

## RC-13: 簡易課税：勘定科目単位のAI事業区分判定（2026-03-21追記・将来）

- **発見経緯**: 簡易課税の表示制御実装時に、勘定科目単位の事業区分設定の必要性を確認
- **現状**: 顧問先単位で1つの事業区分（`client.simplifiedTaxCategory`、デフォルト第3種）のみ。`mapper.ts`で全売上に同一の事業区分を適用
- **問題**: 1事業者が複数の事業区分を持つケース（例: 小売+サービス = 第2種+第5種）に未対応。MFクラウド会計は勘定科目デフォルト税区分で事業区分を個別設定している
- **修正案**:
  1. AIが勘定科目名・科目分類から事業区分（第1〜6種）を推定
  2. 売上科目の`defaultTaxCategoryId`に事業区分付きID（`SALES_TAXABLE_10_T3`等）を自動設定
  3. インフォバーに「AIで勘定科目単位の事業区分を仮算出しています」と表示
  4. ユーザーが手動で事業区分を変更可能
- **前提**: 税区分マスタのT1〜T6表示切替（2026-03-21実装済み）が完了していること
- **時期**: AIエンジン強化フェーズ（Phase C以降）

> [!NOTE]
> MFクラウド会計は勘定科目デフォルト税区分で第1〜6種を管理している。STREAMEDには事業区分の自動判定機能がない。sugusuruがAI事業区分判定を実装すればSTREAMEDに対する差別化要因になる。
> インボイス経過措置（80%→50%の段階的縮小）はMFが取引日で自動判定するため、sugusuruでは対応不要。

---

## チェックリスト

- [ ] RC-1: unsafe/廃止
- [ ] RC-2: tsconfig.pipeline.json + scripts→pipeline リネーム
- [ ] RC-3: DDL確定
- [ ] RC-4: journal_rulesテーブル作成
- [ ] RC-5: Supabase Mapper導入
- [ ] RC-6: RLSポリシー本番化
- [ ] RC-7: GINインデックス
- [ ] RC-8: モック差し替え
- [ ] RC-9: /api/clients 500エラー解消 + fetchClientsフォールバック
- [ ] RC-10: useAccountSettings.tsのACCOUNT_MASTER/TAX_CATEGORY_MASTER直接import解消（RC-5と同時）
- [ ] RC-11: useStaff副担当（M:N紐付け）の設計（RC-5と同時）
- [ ] RC-12: MFマスタCSVバリデーション（保留・税制改正時に実施）
- [ ] RC-13: 簡易課税：勘定科目単位のAI事業区分判定（将来）

