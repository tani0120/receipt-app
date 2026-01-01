# スクリーン別詳細マトリックス (UI Freeze Baseline)

| Screen ID | 表示名称 | 対象 URL (Local) | Mapper パス | UI Contract パス | 既存テストパス | コンポーネントパス |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OptionA** | 顧問先管理 (Mirror) | `/aaa_clients` | `src/aaa/aaa_composables/aaa_useAccountingSystem.ts` | `src/aaa/aaa_types/aaa_ui.type.ts` | `src/aaa/aaa_composables/__tests__/aaa_ClientMapper.spec.ts` | `src/aaa/aaa_components/aaa_ScreenA_ClientList.vue` |
| **OptionB** | 全社仕訳ステータス | `/aaa_dashboard` | `src/aaa/aaa_composables/aaa_useJobDashboard.ts` | `src/aaa/aaa_types/aaa_job.ts` (推定) | `src/aaa/aaa_composables/__tests__/aaa_JobMapper.spec.ts` | `src/aaa/aaa_views/aaa_ScreenB_Dashboard.vue` |
| **OptionC** | 全社資料回収状況 | `/aaa_collection-status` | N/A (Component内Mock) | N/A | N/A | `src/aaa/aaa_components/aaa_ScreenC_CollectionStatus.vue` |
| **OptionD** | AI推論ルール設定 | `/aaa_ai-rules` | N/A (Component内Mock) | N/A | `src/aaa/aaa_composables/__tests__/aaa_LearningRuleMapper.spec.ts` (未使用) | `src/aaa/aaa_components/aaa_ScreenD_AIRules.vue` |
| **OptionE** | 仕訳ワークベンチ | `/aaa_journal-entry/:id` | `src/aaa/aaa_composables/aaa_useAccountingSystem.ts` | `src/aaa/aaa_types/aaa_ui.type.ts` | `src/aaa/aaa_composables/__tests__/aaa_JobMapper.spec.ts` | `src/aaa/aaa_components/aaa_ScreenE_JournalEntry.vue` |
| **OptionG** | 会計ソフトデータ変換 | `/aaa_data-conversion` | `src/aaa/aaa_composables/aaa_useDataConversion.ts` | N/A | N/A | `src/aaa/aaa_views/aaa_ScreenG_DataConversion.vue` |
| **OptionH** | 全社タスク管理 | `/aaa_task-dashboard` | N/A (Component内Mock) | N/A | N/A | `src/aaa/aaa_views/aaa_ScreenH_TaskDashboard.vue` |
| **Admin** | 管理者専用画面 | `/aaa_admin-settings` | `src/aaa/aaa_composables/aaa_useAdminDashboard.ts` | N/A | N/A | `src/aaa/aaa_views/aaa_ScreenZ_AdminSettings.vue` |

## 補足
* **コンポーネントパス**: Router定義 (`src/aaa/aaa_router/aaa_index.ts`) に基づく実体ファイル。`aaa_views` と `aaa_components` が混在しているため注意。
* **Mock状態**: Screen C, D, H はコンポーネント内にハードコードされたデータを使用中。
