import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReceiptDetail from '@/views/ReceiptDetail.vue'
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

describe('ReceiptDetail - uiMode mapping (Task 1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: uploaded → loading
  it('should show loading for uploaded status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    // receipt.valueを直接設定
    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'uploaded',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: preprocessed → loading
  it('should show loading for preprocessed status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'preprocessed',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 3: ocr_done → ocr_preview
  it('should show ocr_preview for ocr_done status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'ocr_done',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('ocr_preview')
  })

  // Test 4: suggested → editable
  it('should show editable for suggested status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'suggested',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('editable')
  })

  // Test 5: reviewing → readonly
  it('should show readonly for reviewing status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'reviewing',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 6: confirmed → readonly
  it('should show readonly for confirmed status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'confirmed',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('readonly')
  })

  // Test 7: rejected → rejected
  it('should show rejected for rejected status', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'rejected',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('rejected')
  })
})

describe('ReceiptDetail - fallback behavior (Task 2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: receipt = null → loading
  it('should show loading when receipt is null', () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    // 初期状態でreceipt = null
    expect(wrapper.vm.receipt).toBeNull()
    expect(wrapper.vm.uiMode).toBe('loading')
  })

  // Test 2: receipt.status = undefined → fallback
  it('should show fallback when status is undefined', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: any = {
      id: '1',
      status: undefined,
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('fallback')
  })

  // Test 3: receipt.status = unknown value → fallback + メッセージ検証
  it('should show fallback for unknown status value and display message', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: any = {
      id: '1',
      status: 'INVALID_STATUS',
      clientId: 'test',
      driveFileId: 'test'
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uiMode).toBe('fallback')
    // UX保証: ユーザーに原因を伝える
    expect(wrapper.text()).toContain('この状態は認識されていません')
  })

  // Test 4: displaySnapshot = undefined でも壊れない
  it('should not break when displaySnapshot is undefined', async () => {
    const wrapper = mount(ReceiptDetail, {
      props: { id: '1' }
    })

    const receipt: ReceiptViewModel = {
      id: '1',
      status: 'suggested',
      clientId: 'test',
      driveFileId: 'test',
      displaySnapshot: undefined
    }
    wrapper.vm.receipt = receipt
    await wrapper.vm.$nextTick()

    // UIが表示されることを確認（エラーなし）
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.uiMode).toBe('editable')
  })
})
