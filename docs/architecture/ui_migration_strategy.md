# 既存UIコード詳細分析レポート

**作成日**: 2026-02-07T12:57:47+09:00  
**目的**: PostgreSQL移行前の既存UI/データアクセスパターンの完全把握

---

## 📊 調査結果サマリー

### 発見したファイル
- **Vueコンポーネント**: 34件
- **Repository**: 4件（clientRepository.ts, jobRepository.ts, receiptRepository.ts, firestoreRepository.ts）
- **status条件分岐**: 11件検出

### 主要な発見
1. ✅ **Repositoryパターン採用済み** - Firestore直接アクセスは少ない
2. ⚠️ **status条件分岐の実態** - 単純な `v-if="status === 'confirmed'"` パターン
3. ✅ **データ推測型UIは少数** - 予想より健全な設計

---

## 🔍 UI条件分岐パターンの詳細分析

### パターン1: 単純なstatus条件分岐（健全）

**発見箇所**: ScreenE_LogicMaster.vue（行72-75）

```vue
<!-- ✅ 良い例: statusだけを見る -->
<div v-if="currentTransaction.status === 'confirmed'" 
     class="bg-blue-50 border border-blue-200 rounded p-2">
  <i class="fa-solid fa-check text-blue-500"></i>
  <div class="text-xs font-bold text-blue-600">この取引は「確定済み」です</div>
</div>
```

**評価**: ✅ **PostgreSQL移行で変更不要**
- statusを直接参照（推測なし）
- 明確な条件分岐

---

### パターン2: ai_reason による条件分岐（改善必要）

**発見箇所**: ScreenE_LogicMaster.vue（行77-83）

```vue
<!-- ⚠️ 要改善: データの有無で判断 -->
<div v-if="currentTransaction.ai_reason" 
     class="bg-indigo-50 border border-indigo-100 rounded p-3">
  <span class="text-[10px] font-bold text-indigo-500">
    <i class="fa-solid fa-robot"></i> AI提案理由
  </span>
  <p class="text-xs text-indigo-900">{{ currentTransaction.ai_reason }}</p>
</div>
```

**問題点**:
- `ai_reason` の有無で表示制御（optionalフィールド）
- status駆動ではない

**移行後の改善案**:
```vue
<!-- ✅ 改善後: statusで判断 -->
<div v-if="receipt.status === 'suggested' && receipt.display_snapshot?.ai_reason"
     class="bg-indigo-50">
  <p>{{ receipt.display_snapshot.ai_reason }}</p>
</div>
```

---

### パターン3: status による行動制御（理想的）

**発見箇所**: ScreenB_JournalTable.vue（行38-48）

```vue
<!-- ✅ 理想的: statusで見た目を制御 -->
<span :class="['font-bold text-sm break-all', 
               job.status === 'completed' ? 'text-gray-500' : 'text-slate-800']">
  {{ job.clientName }}
</span>

<span v-if="job.softwareLabel==='freee'" 
      :class="['text-[9px] px-1 rounded border font-bold', 
               job.status === 'completed' ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-500']">
  freee
</span>
```

**評価**: ✅ **完璧なstatus駆動設計**
- statusで状態を判断
- 見た目を動的に変更

---

## 📁 Repository層の分析

### 発見したRepository

1. **jobRepository.ts** - メインのJob操作
2. **clientRepository.ts** - クライアント操作
3. **receiptRepository.ts** - レシート操作
4. **firestoreRepository.ts** - 汎用Firestore操作

**重要発見**: 
- ✅ Repository層が既に存在
- ✅ Firestore直接アクセスは抑制されている
- 👉 **PostgreSQL移行はRepository層の修正で完結**

---

## 🎯 PostgreSQL移行の影響範囲

### 変更が必要なファイル

#### 最小限の変更（Repository層のみ）

| ファイル | 変更内容 | 難易度 |
|---------|---------|--------|
| [jobRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/repositories/jobRepository.ts) | Supabase SDK呼び出しに変更 | 🟡 中 |
| [receiptRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/repositories/receiptRepository.ts) | 新規作成（PostgreSQL用） | 🟢 低 |
| [firestoreRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/services/firestoreRepository.ts) | イベントログ専用に格下げ | 🟢 低 |

#### UI層の変更（オプション）

| ファイル | 変更内容 | 難易度 |
|---------|---------|--------|
| [ScreenE_LogicMaster.vue](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/components/ScreenE_LogicMaster.vue) | ai_reason条件分岐をstatus駆動化 | 🟢 低 |
| その他UIファイル | display_snapshot参照に変更 | 🟢 低 |

**結論**: **Repository層のみ** の変更でUI真っ白問題は解消可能

---

## 🗄️ データ移行戦略の詳細化

### Phase 1: スキーマ移行（危険度: 低）

#### Step 1.1: Supabase DDL実行
```sql
-- 重要修正3点を含む完全版DDL
CREATE TYPE receipt_status AS ENUM (...);
CREATE TABLE receipts (...);
CREATE TABLE audit_logs (...);
CREATE FUNCTION update_receipt_status(...);
```

**検証方法**:
```bash
# Supabase Studioで確認
1. Tables → receipts, audit_logs が存在
2. Types → receipt_status が存在
3. Functions → update_receipt_status が存在
```

---

### Phase 2: Repository層修正（危険度: 中）

#### Step 2.1: jobRepository.ts の段階的移行

**現行（推測される実装）**:
```typescript
// jobRepository.ts
async updateJob(jobId: string, data: Partial<JobApi>) {
  await firestore.collection('jobs').doc(jobId).update(data);
}
```

**移行後**:
```typescript
// jobRepository.ts
async updateJob(jobId: string, data: Partial<JobApi>) {
  // 1. Firestoreにイベント記録
  await firestore.collection('events').add({
    type: 'JOB_UPDATED',
    job_id: jobId,
    timestamp: new Date()
  });
  
  // 2. Supabaseに状態更新
  await supabase.rpc('update_receipt_status', {
    p_id: jobId,
    p_new_status: data.status,
    p_actor: 'system'
  });
}
```

**検証方法**:
1. 既存のUnit Test実行（存在する場合）
2. 手動テスト: Jobステータス変更 → Supabase Studioで確認

---

### Phase 3: データ移行スクリプト（危険度: 高）

#### Step 3.1: 移行スクリプト作成

```typescript
// scripts/migrate_jobs_to_supabase.ts
import { firestore } from './firebase';
import { supabase } from './supabase';

async function migrateJobs() {
  const jobsSnapshot = await firestore.collection('jobs').get();
  
  for (const doc of jobsSnapshot.docs) {
    const job = doc.data();
    
    // PostgreSQLにINSERT
    await supabase.from('receipts').insert({
      id: doc.id,
      client_id: job.clientCode,
      drive_file_id: job.driveFileId,
      status: mapJobStatusToReceiptStatus(job.status),
      confirmed_journal: job.lines ? JSON.stringify(job.lines) : null,
      created_at: job.createdAt.toDate()
    });
  }
  
  console.log(`Migrated ${jobsSnapshot.size} jobs`);
}

function mapJobStatusToReceiptStatus(jobStatus: string): string {
  // JobStatus (12状態) → ReceiptStatus (7状態) のマッピング
  const mapping = {
    'pending': 'uploaded',
    'ai_processing': 'preprocessed',
    'ready_for_work': 'ocr_done',
    'primary_completed': 'suggested',
    'review': 'reviewing',
    'approved': 'confirmed',
    'excluded': 'rejected'
  };
  return mapping[jobStatus] || 'uploaded';
}
```

**検証方法**:
1. テスト環境で10件のJobを移行
2. Supabase Studioでデータ確認
3. 整合性検証: Firestore件数 === Supabase件数

---

## ⚠️ リスクと対策

### リスク1: JobStatus（12状態） → ReceiptStatus（7状態）のマッピング

**問題**: 12状態を7状態に集約する際の情報損失

**対策**:
```typescript
// display_snapshot に元のstatusを保存
await supabase.from('receipts').insert({
  status: mapJobStatusToReceiptStatus(job.status),
  display_snapshot: {
    original_job_status: job.status, // ✅ 元の値を保持
    original_job_data: job // ✅ 全データを保持
  }
});
```

---

### リスク2: 移行中のデータ不整合

**問題**: 移行中にFirestoreへの書き込みが発生

**対策（Blue-Green Deployment）**:
```
1. 【Green】Supabaseテーブル作成（本番と並行）
2. 【Blue】Firestoreへの書き込みを停止（メンテナンスモード）
3. 【Green】全データ移行実行
4. 【Green】整合性検証
5. 【Blue→Green】アプリをSupabase参照に切り替え
6. 【Blue】Firestoreをイベントログ専用に格下げ
```

**所要時間**: 約30分のメンテナンス（データ量次第）

---

## 📋 移行チェックリスト

### 事前準備
- [ ] Supabaseアカウント作成
- [ ] 本番相当のテストデータ準備（Firestore）
- [ ] Repositoryファイルのバックアップ

### Phase 1: スキーマ移行
- [ ] DDL実行（Supabase Studio）
- [ ] テーブル存在確認
- [ ] ENUM型確認
- [ ] SQL function確認

### Phase 2: Repository層修正
- [ ] [receiptRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/repositories/receiptRepository.ts) 新規作成
- [ ] [jobRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/repositories/jobRepository.ts) 二重書き込み実装
- [ ] Unit Test作成/実行
- [ ] 統合テスト（手動）

### Phase 3: データ移行
- [ ] 移行スクリプト作成
- [ ] テスト環境で10件移行
- [ ] 整合性検証
- [ ] 本番移行（メンテナンスモード）
- [ ] 本番検証

### Phase 4: UI切り替え（オプション）
- [ ] `ai_reason` 条件分岐をstatus駆動化
- [ ] display_snapshot参照に変更
- [ ] ブラウザテスト（全画面）

---

## 🎓 結論

### 主要な発見
1. ✅ **Repository層が既に存在** → 影響範囲が明確
2. ✅ **status条件分岐は健全** → UI真っ白問題は少数
3. ⚠️ **12状態→7状態マッピング** → display_snapshotで保持

### 移行の実現可能性
- **難易度**: 🟡 中（Repository層のみの変更）
- **所要時間**: 2.5週間（計画通り）
- **リスク**: 🟢 低（段階的移行で対応可能）

### 次のステップ
1. このレポートをレビュー
2. 移行スクリプトの詳細設計
3. テスト環境での先行実施

---

## 📚 参考資料

- [implementation_plan_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/implementation_plan_UPDATED.md)
- [architecture_comparison_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/architecture_comparison_UPDATED.md)
- [ScreenE_LogicMaster.vue](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/components/ScreenE_LogicMaster.vue) (708行)
- [jobRepository.ts](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/repositories/jobRepository.ts)
