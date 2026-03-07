import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DocumentDetail from '@/views/DocumentDetail.vue'
import type { DocumentViewModel } from '@/types/documentViewModel'

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
 * テスト用ヘルパー: DocumentViewModelを生成
 * 型キャストをこの1箇所に集約し、テスト本体では型安全に書ける
 * overridesで不正データ（undefined, 不正ステータス等）を注入可能
 */
function createTestDocument(overrides: Record<string, unknown> = {}): DocumentViewModel {
  return {
    id: '1',
    status: 'uploaded',
    clientId: 'test',
    driveFileId: 'test',
    ...overrides,
  } as DocumentViewModel
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

    wrapper.vm.document = createTestDocument({ status: 'uploaded' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: preprocessed → loading
  it('should show loading for preprocessed status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'preprocessed' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 3: ocr_done → ocr_preview
  it('should show ocr_preview for ocr_done status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'ocr_done' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('ocr_preview')
  })

  // Test 4: suggested → editable
  it('should show editable for suggested status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'suggested' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('editable')
  })

  // Test 5: reviewing → readonly
  it('should show readonly for reviewing status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'reviewing' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 6: confirmed → readonly
  it('should show readonly for confirmed status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'confirmed' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 7: rejected → rejected
  it('should show rejected for rejected status', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'rejected' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('rejected')
  })
})

describe('DocumentDetail - fallback behavior (Task 2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: document = null → loading
  it('should show loading when document is null', () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    // 初期状態でdocument = null
    expect(wrapper.vm.document).toBeNull()
    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: document.status = undefined → fallback
  it('should show fallback when status is undefined', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: undefined })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('fallback')
  })

  // Test 3: document.status = unknown value → fallback + メッセージ検証
  it('should show fallback for unknown status value and display message', async () => {
    const wrapper = mount(DocumentDetail, {
      props: { id: '1' }
    })

    wrapper.vm.document = createTestDocument({ status: 'INVALID_STATUS' })
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

    wrapper.vm.document = createTestDocument({ status: 'suggested', displaySnapshot: undefined })
    await wrapper.vm.$nextTick()

    // UIが表示されることを確認（エラーなし）
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.uiMode).toBe('editable')
  })
})
