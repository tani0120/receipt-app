# 安定化フェーズ実施計画書（Phase 🅲）

## 目的

**「status駆動UIは壊れない」をコードで保証する**

- Phase 2で確立したパターンの堅牢性を検証
- Phase 4/5への安全な基盤を構築
- UIが真っ白になる問題の再発防止を確実にする

---

## Task 1: ReceiptStatus → ReceiptUiMode 網羅性テスト

### 目的
全7種のReceiptStatusが正しくuiModeにマップされ、UIが適切に表示されることを保証

### 実施手順

#### Step 1.1: テストファイル作成
```bash
# ディレクトリ作成
mkdir -p src/views/__tests__

# テストファイル作成
touch src/views/__tests__/ReceiptDetail.spec.ts
```

#### Step 1.2: テストコード実装

**ファイル**: `src/views/__tests__/ReceiptDetail.spec.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReceiptDetail from '@/views/ReceiptDetail.vue'
import type { ReceiptViewModel } from '@/types/receiptViewModel'

describe('ReceiptDetail - uiMode mapping', () => {
  // Test 1: uploaded → loading
  it('should show loading for uploaded status', () => {
    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'uploaded',
      clientId: 'test',
      driveFileId: 'test'
    }
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' },
      global: {
        mocks: {
          // receipt.valueをモック
        }
      }
    })
    // uiMode = 'loading' を確認
    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: preprocessed → loading
  it('should show loading for preprocessed status', () => {
    // 同様の実装
  })

  // Test 3: ocr_done → ocr_preview
  it('should show ocr_preview for ocr_done status', () => {
    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'ocr_done',
      clientId: 'test',
      driveFileId: 'test'
    }
    // uiMode = 'ocr_preview' を確認
  })

  // Test 4: suggested → editable
  it('should show editable for suggested status', () => {
    // uiMode = 'editable' を確認
  })

  // Test 5: reviewing → readonly
  it('should show readonly for reviewing status', () => {
    // uiMode = 'readonly' を確認
  })

  // Test 6: confirmed → readonly
  it('should show readonly for confirmed status', () => {
    // uiMode = 'readonly' を確認
  })

  // Test 7: rejected → rejected
  it('should show rejected for rejected status', () => {
    // uiMode = 'rejected' を確認
  })
})
```

#### Step 1.3: テスト実行

```bash
# テスト実行
npm run test

# または個別実行
npx vitest src/views/__tests__/ReceiptDetail.spec.ts
```

### 完了判断基準

- [ ] 全7種のstatusに対するテストが通過
- [ ] テストカバレッジ: uiMode computed 100%
- [ ] コンソールエラー0件

### 所要時間
**30分**

---

## Task 2: Fallback動作の境界値テスト

### 目的
異常系入力（null、undefined、unknown値）でもUIが壊れないことを保証

### 実施手順

#### Step 2.1: 境界値テストコード追加

**ファイル**: `src/views/__tests__/ReceiptDetail.spec.ts`（追加）

```typescript
describe('ReceiptDetail - fallback behavior', () => {
  // Test 1: receipt = null → loading
  it('should show loading when receipt is null', () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' },
      data() {
        return { receipt: null }
      }
    })
    expect(wrapper.vm.uiMode).toBe('loading')
    expect(wrapper.find('.loading-view').exists()).toBe(true)
  })

  // Test 2: receipt.status = undefined → fallback
  it('should show fallback when status is undefined', () => {
    const receipt: any = {
      id: '1',
      status: undefined,
      clientId: 'test',
      driveFileId: 'test'
    }
    // uiMode = 'fallback' を確認
  })

  // Test 3: receipt.status = unknown value → fallback
  it('should show fallback for unknown status value', () => {
    const receipt: any = {
      id: '1',
      status: 'INVALID_STATUS',
      clientId: 'test',
      driveFileId: 'test'
    }
    expect(wrapper.vm.uiMode).toBe('fallback')
    expect(wrapper.text()).toContain('Unknown status') // UX保証: ユーザーに原因を伝える
  })

  // Test 4: displaySnapshot = undefined でも壊れない
  it('should not break when displaySnapshot is undefined', () => {
    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'suggested',
      clientId: 'test',
      driveFileId: 'test',
      displaySnapshot: undefined
    }
    // UIが表示されることを確認（エラーなし）
    expect(() => mount(ReceiptDetail, { /* ... */ })).not.toThrow()
  })
})
```

#### Step 2.2: 各UIコンポーネントのprops検証

**対象コンポーネント**:
- LoadingView.vue
- OcrPreview.vue
- EditorView.vue
- ReadonlyView.vue
- RejectedView.vue
- FallbackView.vue

**検証項目**:
- 必須propsが欠けていてもエラーにならないか
- optional chainingが適切に使われているか
- デフォルト値が設定されているか

```typescript
describe('UI Components - props validation', () => {
  it('EditorView should handle missing displaySnapshot', () => {
    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'suggested',
      clientId: 'test',
      driveFileId: 'test'
      // displaySnapshot なし
    }
    const wrapper = mount(EditorView, {
      props: { receipt }
    })
    expect(wrapper.exists()).toBe(true)
    expect(() => wrapper.vm).not.toThrow()
  })
})
```

### 完了判断基準

- [ ] 境界値テスト全通過
- [ ] 各UIコンポーネントがprops不足でも表示される
- [ ] コンソールエラー・警告0件

### 所要時間
**40分**

---

## Task 3: ViewModel正規化の境界テスト

### 目的
[normalizeReceipt()](file:///C:/dev/receipt-app/src/stores/receiptStore.ts#6-16)が不正データを安全にハンドリングし、UIに渡す前にデータを正規化することを保証

### 実施手順

#### Step 3.1: normalizeReceipt テストコード作成

**ファイル**: `src/stores/__tests__/receiptStore.spec.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReceiptStore } from '@/stores/receiptStore'

describe('receiptStore - normalizeReceipt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: 不正statusを'uploaded'に変換
  it('should default to uploaded for invalid status', () => {
    const store = useReceiptStore()
    const raw = {
      id: '1',
      clientId: 'test',
      driveFileId: 'test',
      status: 'INVALID_STATUS' // 不正な値
    }
    
    store.setReceipts([raw])
    
    expect(store.receipts[0].status).toBe('uploaded')
  })

  // Test 2: statusがundefinedの場合
  it('should default to uploaded when status is undefined', () => {
    const raw = {
      id: '1',
      clientId: 'test',
      driveFileId: 'test'
      // status なし
    }
    
    store.setReceipts([raw])
    
    expect(store.receipts[0].status).toBe('uploaded')
  })

  // Test 3: 正常なstatusはそのまま
  it('should keep valid status unchanged', () => {
    const raw = {
      id: '1',
      clientId: 'test',
      driveFileId: 'test',
      status: 'suggested'
    }
    
    store.setReceipts([raw])
    
    expect(store.receipts[0].status).toBe('suggested')
  })

  // Test 4: displaySnapshotがなくても動作
  it('should work without displaySnapshot', () => {
    const raw = {
      id: '1',
      clientId: 'test',
      driveFileId: 'test',
      status: 'uploaded'
      // displaySnapshot なし
    }
    
    store.setReceipts([raw])
    
    expect(store.receipts[0].displaySnapshot).toBeUndefined()
  })

  // Test 5: 必須フィールドの検証
  it('should have all required fields', () => {
    const raw = {
      id: '1',
      clientId: 'test',
      driveFileId: 'test',
      status: 'uploaded'
    }
    
    store.setReceipts([raw])
    const receipt = store.receipts[0]
    
    expect(receipt.id).toBeDefined()
    expect(receipt.clientId).toBeDefined()
    expect(receipt.driveFileId).toBeDefined()
    expect(receipt.status).toBeDefined()
  })
})
```

#### Step 3.2: テスト実行

```bash
npx vitest src/stores/__tests__/receiptStore.spec.ts
```

### 完了判断基準

- [ ] normalizeReceipt の全テスト通過
- [ ] 不正statusが'uploaded'にフォールバック
- [ ] displaySnapshot未定義でも動作
- [ ] 必須フィールドが全て存在

### 所要時間
**30分**

---

## Task 4: ブラウザ実機テスト

### 目的
実際のブラウザで全UIモードが正しく表示され、ユーザー体験が損なわれていないことを確認

### 実施手順

#### Step 4.1: フロントエンド起動

```bash
npm run dev:frontend
```

#### Step 4.2: ReceiptDetail.vue テストパネルで確認

**URL**: `http://localhost:5173/receipts/test`

**確認項目**:

1. **Loading View** (uploaded, preprocessed)
   - [ ] スピナーが表示される
   - [ ] "処理中です..." メッセージ表示
   - [ ] コンソールエラーなし

2. **OCR Preview** (ocr_done)
   - [ ] OCRテキストが表示される
   - [ ] "情報確認のみ"の注記表示
   - [ ] コンソールエラーなし

3. **Editor View** (suggested)
   - [ ] 編集フォームが表示される
   - [ ] displaySnapshotがなくても表示される
   - [ ] コンソールエラーなし

4. **Readonly View** (reviewing, confirmed)
   - [ ] 読み取り専用で表示される
   - [ ] 編集ボタンが非表示
   - [ ] コンソールエラーなし

5. **Rejected View** (rejected)
   - [ ] 却下メッセージ表示
   - [ ] 再提出オプション表示
   - [ ] コンソールエラーなし

6. **Fallback View** (unknown status)
   - [ ] "Unknown status"メッセージ表示
   - [ ] UIが壊れていない
   - [ ] コンソールエラーなし

#### Step 4.3: 開発者ツールでエラー確認

**手順**:
1. F12で開発者ツールを開く
2. Consoleタブを確認
3. 各UIモードに切り替え
4. エラー・警告が0件であることを確認

#### Step 4.4: スクリーンショット取得

各UIモードのスクリーンショットを取得して証跡とする

**保存先**: `C:\Users\kazen\.gemini\antigravity\brain\969b0a66-a361-48a4-9679-359b9c632af4\screenshots\`

**ファイル名**:
- `loading_view.png`
- `ocr_preview.png`
- `editor_view.png`
- `readonly_view.png`
- `rejected_view.png`
- `fallback_view.png`

### 完了判断基準

- [ ] 全6種UIモードが正しく表示される
- [ ] コンソールエラー0件
- [ ] コンソール警告0件
- [ ] スクリーンショット6枚取得完了
- [ ] walkthrough.md更新（スクリーンショット埋め込み）

### 所要時間
**20分**

---

## 全体完了条件

### 自動テスト
- [ ] `npm run test` が全件通過
- [ ] テストカバレッジ: uiMode関連コード 100%
- [ ] normalizeReceipt() テスト全通過

### 手動テスト
- [ ] ブラウザで全6種UIモード表示確認
- [ ] コンソールエラー0件
- [ ] スクリーンショット取得完了

### ドキュメント
- [ ] walkthrough.md更新（テスト結果記録）
- [ ] スクリーンショット埋め込み
- [ ] task.mdのチェックボックス更新

### Git
- [ ] テストコード追加をコミット
- [ ] walkthrough更新をコミット

---

## 推定総工数

**合計: 2時間**

- Task 1: 30分
- Task 2: 40分
- Task 3: 30分
- Task 4: 20分

---

## 次のアクション

1. **即座に開始可能**: Task 1から順番に実施
2. **判断不要**: 各タスクの完了条件は明確
3. **並行作業不要**: 1タスクずつ確実に完了させる

---

## リスクと対策

### リスク1: Vitestの設定不足

**対策**: 
```bash
npm install -D vitest @vue/test-utils
```

### リスク2: テストが書けない

**対策**: 
- 上記のテストコード例をそのまま使用
- 必要に応じて調整

---

**この計画で実施開始してよいか？**
