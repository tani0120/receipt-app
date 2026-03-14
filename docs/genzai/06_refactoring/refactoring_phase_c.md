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
