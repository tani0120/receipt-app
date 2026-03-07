import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DocumentDetail from '@/views/DocumentDetail.vue'
import type { ReceiptViewModel } from '@/types/receiptViewModel'

// vue-routerモック
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' }
  }),
  useRouter: () => ({
    push: vi.fn()
  })
}))

/**
 * テスト用ヘルパー: ReceiptViewModelを生成
 * 型キャストをこの1箇所に集約し、テスト本体では型安全に書ける
 * overridesで不正データ（undefined, 不正ステータス等）を注入可能
 */
function createTestReceipt(overrides: Record<string, unknown> = {}): ReceiptViewModel {
  return {
    id: '1',
    status: 'uploaded',
    clientId: 'test',
    driveFileId: 'test',
    ...overrides,
  } as ReceiptViewModel
}

describe('DocumentDetail - uiMode mapping (Task 1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: uploaded → loading
  it('should show loading for uploaded status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'uploaded' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: preprocessed → loading
  it('should show loading for preprocessed status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'preprocessed' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 3: ocr_done → ocr_preview
  it('should show ocr_preview for ocr_done status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'ocr_done' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('ocr_preview')
  })

  // Test 4: suggested → editable
  it('should show editable for suggested status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'suggested' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('editable')
  })

  // Test 5: reviewing → readonly
  it('should show readonly for reviewing status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'reviewing' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 6: confirmed → readonly
  it('should show readonly for confirmed status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'confirmed' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 7: rejected → rejected
  it('should show rejected for rejected status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'rejected' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('rejected')
  })
})

describe('DocumentDetail - fallback behavior (Task 2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: receipt = null → loading
  it('should show loading when receipt is null', () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    // 初期状態でreceipt = null
    expect(wrapper.vm.receipt).toBeNull()
    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: receipt.status = undefined → fallback
  it('should show fallback when status is undefined', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: undefined })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('fallback')
  })

  // Test 3: receipt.status = unknown value → fallback + メッセージ検証
  it('should show fallback for unknown status value and display message', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'INVALID_STATUS' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('fallback')
    // UX保証: ユーザーに原因を伝える
    expect(wrapper.text()).toContain('この状態は認識されていません')
  })

  // Test 4: displaySnapshot = undefined でも壊れない
  it('should not break when displaySnapshot is undefined', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.receipt = createTestReceipt({ status: 'suggested', displaySnapshot: undefined })
    await wrapper.vm.$nextTick()

    // UIが表示されることを確認（エラーなし）
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.uiMode).toBe('editable')
  })
})
