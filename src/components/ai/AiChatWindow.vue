<template>
  <transition name="ai-chat-slide">
    <div
      v-if="isOpen"
      ref="windowRef"
      class="ai-chat-window"
      :style="windowStyle"
    >
      <!-- ヘッダー（ドラッグハンドル） -->
      <div
        class="ai-chat-header"
        @mousedown="startDrag"
      >
        <div class="ai-chat-header-left">
          <i class="fa-solid fa-grip-vertical ai-chat-drag-icon"></i>
          <i class="fa-solid fa-robot ai-chat-header-icon"></i>
          <span class="ai-chat-header-title">AIコマンド</span>
        </div>
        <div class="ai-chat-header-right">
          <!-- 検索可能な顧問先ドロップダウン -->
          <div class="ai-client-dropdown" ref="dropdownRef">
            <button
              class="ai-client-dropdown-btn"
              :class="{ 'ai-client-dropdown-btn--warn': !selectedClientId }"
              @click="toggleDropdown"
            >
              <span class="ai-client-dropdown-label">
                {{ selectedClientLabel }}
              </span>
              <i class="fa-solid fa-chevron-down ai-client-dropdown-icon" :class="{ 'ai-client-dropdown-icon--open': showDropdown }"></i>
            </button>
            <transition name="ai-dropdown-fade">
              <div v-if="showDropdown" class="ai-client-dropdown-panel">
                <div class="ai-client-dropdown-search">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <input
                    ref="clientSearchRef"
                    v-model="clientSearchText"
                    class="ai-client-dropdown-input"
                    placeholder="顧問先を検索..."
                    @keydown.escape="showDropdown = false"
                  />
                </div>
                <div class="ai-client-dropdown-list">
                  <button class="ai-client-dropdown-item" @click="selectClient('all')">
                    📊 全社一括
                  </button>
                  <div class="ai-client-dropdown-sep"></div>
                  <button
                    v-for="cl in filteredClientList"
                    :key="cl.clientId"
                    class="ai-client-dropdown-item"
                    :class="{ 'ai-client-dropdown-item--active': cl.clientId === selectedClientId }"
                    @click="selectClient(cl.clientId)"
                  >
                    <span class="ai-client-code">{{ cl.threeCode }}</span>
                    {{ cl.companyName || cl.repName || cl.clientId }}
                  </button>
                  <div v-if="filteredClientList.length === 0" class="ai-client-dropdown-empty">
                    該当する顧問先がありません
                  </div>
                </div>
              </div>
            </transition>
          </div>
          <button class="ai-chat-close-btn" @click="handleClose" title="閉じる">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- メッセージエリア -->
      <div ref="messagesContainer" class="ai-chat-messages">
        <!-- 初期メッセージ -->
        <div v-if="messages.length === 0" class="ai-chat-welcome">
          <i class="fa-solid fa-wand-magic-sparkles ai-chat-welcome-icon"></i>
          <p class="ai-chat-welcome-text">質問を入力すると、AIがデータを取得して直接回答します</p>
          <p class="ai-chat-welcome-hint">自由にテキストを入力、または左下の <i class="fa-solid fa-list" style="font-size:11px;color:#6366f1"></i> から選択</p>
          <div class="ai-chat-welcome-suggestions">
            <button
              v-for="s in defaultSuggestions"
              :key="s"
              class="ai-chat-suggestion-btn"
              @click="handleSuggestionClick(s)"
            >{{ s }}</button>
          </div>
        </div>

        <!-- メッセージバブル -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="ai-chat-msg"
          :class="'ai-chat-msg--' + msg.role"
        >
          <div class="ai-chat-msg-bubble">
            <!-- テキスト -->
            <div class="ai-chat-msg-content" v-html="formatContent(msg.content)"></div>

            <!-- テーブル -->
            <div v-if="msg.response?.table" class="ai-chat-msg-table-wrap">
              <table class="ai-chat-msg-table">
                <thead>
                  <tr>
                    <th v-for="h in msg.response.table.headers" :key="h">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in msg.response.table.rows" :key="ri">
                    <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- AI提案ボタン -->
            <div v-if="msg.response?.suggestions?.length" class="ai-chat-msg-suggestions">
              <button
                v-for="s in msg.response.suggestions"
                :key="s.command"
                class="ai-chat-suggest-btn"
                @click="handleSuggestionClick(s.label)"
              >
                <span class="ai-chat-suggest-label">{{ s.label }}</span>
                <span class="ai-chat-suggest-desc">{{ s.description }}</span>
              </button>
            </div>
          </div>
          <span class="ai-chat-msg-time">{{ formatTime(msg.timestamp) }}</span>
        </div>

        <!-- ローディング -->
        <div v-if="isLoading" class="ai-chat-msg ai-chat-msg--ai">
          <div class="ai-chat-msg-bubble ai-chat-msg-loading">
            <span class="ai-chat-loading-dot"></span>
            <span class="ai-chat-loading-dot"></span>
            <span class="ai-chat-loading-dot"></span>
          </div>
        </div>
      </div>

      <!-- 入力エリア -->
      <div class="ai-chat-input-area">
        <button
          class="ai-chat-browse-toggle"
          :class="{
            'ai-chat-browse-toggle--active': showBrowser,
            'ai-chat-browse-toggle--pulse': highlightBrowse || messages.length === 0,
          }"
          @click="toggleBrowser"
          title="全コマンド一覧"
        >
          <i class="fa-solid fa-list"></i>
        </button>
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="ai-chat-input"
          placeholder="質問を入力...（例: TSKの年商は？）"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button
          class="ai-chat-send-btn"
          :disabled="!inputText.trim() || isLoading"
          @click="handleSend"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      <!-- コマンドブラウザモーダル（チャットウィンドウ上にオーバーレイ） -->
      <transition name="ai-browser-fade">
        <div v-if="showBrowser" class="ai-cmd-modal-overlay" @click.self="showBrowser = false">
          <div class="ai-cmd-modal">
            <AiCommandBrowser
              :catalog="commandCatalog"
              @close="showBrowser = false"
              @select="handleBrowserSelect"
            />
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
/**
 * AiChatWindow.vue — チャットウィンドウ（メッセージ履歴+入力欄）
 *
 * 準拠:
 *   - 35_parts_catalog.md 基盤（チャットUI）
 *   - 36_infra_ui.md §2-3 応答形式
 *   - load_context.md L131: ロジックはAPI側に書け
 */
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useAiCommand } from '@/composables/useAiCommand'
import { useClients } from '@/features/client-management/composables/useClients'
import AiCommandBrowser from './AiCommandBrowser.vue'
import type { CommandDef } from '@/api/services/commandCatalog'
type CatalogCommand = Omit<CommandDef, 'keywords'>

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { messages, isLoading, selectedClientId, sendMessage, sendMessageDirect, clearMessages } = useAiCommand()
const { clients } = useClients()

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messagesContainer = ref<HTMLDivElement | null>(null)
const windowRef = ref<HTMLDivElement | null>(null)

/** モーダルを閉じる（履歴・入力をクリア） */
const handleClose = () => {
  clearMessages()
  inputText.value = ''
  selectedClientId.value = ''
  pendingCommand.value = null
  showBrowser.value = false
  emit('close')
}

// ---------- ドラッグ移動 ----------
const dragOffset = ref({ x: 0, y: 0 })
const windowPos = ref<{ x: number; y: number } | null>(null)
const isDragging = ref(false)

const windowStyle = computed(() => {
  if (!windowPos.value) return {}
  return {
    left: windowPos.value.x + 'px',
    top: windowPos.value.y + 'px',
    right: 'auto',
    bottom: 'auto',
  }
})

const startDrag = (e: MouseEvent) => {
  // select/button上のドラッグは無視
  const target = e.target as HTMLElement
  if (target.closest('select') || target.closest('button')) return

  isDragging.value = true
  const el = windowRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  const newX = Math.max(0, Math.min(e.clientX - dragOffset.value.x, window.innerWidth - 420))
  const newY = Math.max(0, Math.min(e.clientY - dragOffset.value.y, window.innerHeight - 100))
  windowPos.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

/** 顧問先リスト（3コード昇順ソート） */
const clientList = computed(() =>
  [...clients.value].sort((a, b) => (a.threeCode ?? '').localeCompare(b.threeCode ?? ''))
)

// ---------- 検索可能ドロップダウン ----------
const showDropdown = ref(false)
const clientSearchText = ref('')
const dropdownRef = ref<HTMLDivElement | null>(null)
const clientSearchRef = ref<HTMLInputElement | null>(null)

/** 表示ラベル */
const selectedClientLabel = computed(() => {
  if (selectedClientId.value === 'all') return '📊 全社一括'
  if (!selectedClientId.value) return '顧問先を選択...'
  const cl = clientList.value.find(c => c.clientId === selectedClientId.value)
  return cl ? `${cl.threeCode} ${cl.companyName || cl.repName}` : selectedClientId.value
})

/** 検索フィルタ済みリスト */
const filteredClientList = computed(() => {
  const q = clientSearchText.value.trim().toLowerCase()
  if (!q) return clientList.value
  return clientList.value.filter(cl =>
    (cl.threeCode ?? '').toLowerCase().includes(q) ||
    (cl.companyName ?? '').toLowerCase().includes(q) ||
    (cl.repName ?? '').toLowerCase().includes(q)
  )
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    clientSearchText.value = ''
    nextTick(() => clientSearchRef.value?.focus())
  }
}

/** MF認証状態を動的チェック（clientIdベース） */
const checkMfAuth = async (clientId: string): Promise<boolean> => {
  if (clientId === 'all') return true  // 全社一括はスキップ
  try {
    const res = await fetch(`/api/mf/auth/status?clientId=${encodeURIComponent(clientId)}`)
    const data = await res.json()
    return !!data.authenticated
  } catch {
    // API通信失敗時は通過させる（コマンド実行時に再チェックされる）
    return true
  }
}

const selectClient = async (id: string) => {
  showDropdown.value = false
  if (id !== 'all') {
    const ok = await checkMfAuth(id)
    const cl = clientList.value.find(c => c.clientId === id)
    const name = cl ? `${cl.threeCode} ${cl.companyName || cl.repName}` : id
    if (!ok) {
      messages.value.push({
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: `⚠️ **${name}** はMF未連携です。\n\n先に設定画面からマネーフォワード連携（OAuth認可）を完了してください。`,
        timestamp: new Date(),
      })
      selectedClientId.value = ''
      return
    }
    // 連携済み → 選択メッセージ表示
    messages.value.push({
      id: `msg-${Date.now()}-ai`,
      role: 'ai',
      content: `✅ **${name}** — MF連携済み。コマンドを実行できます。`,
      timestamp: new Date(),
    })
  }
  selectedClientId.value = id
}

/** ドロップダウン外クリックで閉じる */
const onClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

/** 初期サジェスチョン */
const defaultSuggestions = ['TSKの年商は？', '科目一覧', '事業者情報', '連携サービス一覧']

// ---------- コマンドブラウザ ----------
const showBrowser = ref(false)
const commandCatalog = ref<CatalogCommand[]>([])

/** カタログ取得（初回のみ） */
const fetchCatalog = async () => {
  if (commandCatalog.value.length > 0) return
  try {
    const res = await fetch('/api/ai-command/catalog')
    const data = await res.json()
    commandCatalog.value = data.catalog ?? []
  } catch (err) {
    console.error('[AiChatWindow] カタログ取得失敗:', err)
  }
}

const toggleBrowser = () => {
  if (showBrowser.value) {
    showBrowser.value = false
  } else {
    showBrowser.value = true
    fetchCatalog()
  }
}

const handleBrowserSelect = (cmd: CatalogCommand) => {
  showBrowser.value = false
  // ブラウザからコマンド決定 → 顧問先チェック
  onCommandDecided(cmd.name)
}

// ---------- 顧問先インターセプト ----------
/**
 * pendingCommand: コマンド確定済み、顧問先待ちモード
 * - null: 通常モード
 * - string: コマンド名を保留中（次の入力は会社名検索）
 */
const pendingCommand = ref<string | null>(null)

/**
 * コマンドが決定した後の処理
 * 顧問先選択済み → 即実行
 * 未選択 → 顧問先入力を促す（コマンドは保留）
 */
const onCommandDecided = (commandText: string) => {
  if (selectedClientId.value) {
    // 顧問先選択済み → 即実行
    sendMessage(commandText)
    return
  }

  // 顧問先未選択 → コマンド保留 + 顧問先入力を促す
  pendingCommand.value = commandText
  messages.value.push({
    id: `msg-${Date.now()}-ai`,
    role: 'ai',
    content: `👍 **${commandText}** を実行します。\n\n対象の顧問先を選んでください。\n会社名または3コードを入力してください。`,
    timestamp: new Date(),
  })
}

/** 会社名/3コードで検索 → 候補表示 */
const searchClientAndSelect = (text: string) => {
  const q = text.trim().toLowerCase()

  const candidates = clientList.value.filter(cl =>
    (cl.threeCode ?? '').toLowerCase().includes(q) ||
    (cl.companyName ?? '').toLowerCase().includes(q) ||
    (cl.repName ?? '').toLowerCase().includes(q)
  )

  // ユーザーメッセージ
  messages.value.push({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: text,
    timestamp: new Date(),
  })

  if (candidates.length === 1) {
    // 1件のみ → 即確定
    confirmClient(candidates[0]!.clientId)
  } else if (candidates.length > 1) {
    // 複数候補 → ボタンで選択
    messages.value.push({
      id: `msg-${Date.now()}-ai`,
      role: 'ai',
      content: `「${text}」に該当する顧問先が ${candidates.length} 件あります。\nどちらですか？`,
      response: {
        type: 'suggestions',
        content: '',
        suggestions: candidates.slice(0, 8).map(cl => ({
          command: `__select_client__${cl.clientId}`,
          label: `${cl.threeCode} ${cl.companyName || cl.repName}`,
          description: '',
        })),
      },
      timestamp: new Date(),
    })
  } else {
    // 該当なし
    messages.value.push({
      id: `msg-${Date.now()}-ai`,
      role: 'ai',
      content: `「${text}」に該当する顧問先が見つかりません。\n別の会社名や3コードで再入力してください。`,
      timestamp: new Date(),
    })
  }
}

/** 顧問先確定 → MF連携チェック → 保留コマンド実行 */
const confirmClient = async (clientId: string) => {
  const cl = clientList.value.find(c => c.clientId === clientId)
  const name = cl ? `${cl.threeCode} ${cl.companyName || cl.repName}` : clientId

  // MF連携チェック
  const ok = await checkMfAuth(clientId)
  if (!ok) {
    messages.value.push({
      id: `msg-${Date.now()}-ai`,
      role: 'ai',
      content: `⚠️ **${name}** はMF未連携です。\n\n先に設定画面からマネーフォワード連携（OAuth認可）を完了してください。\nコマンドをキャンセルしました。`,
      timestamp: new Date(),
    })
    pendingCommand.value = null
    return
  }

  selectedClientId.value = clientId

  messages.value.push({
    id: `msg-${Date.now()}-ai`,
    role: 'ai',
    content: `✅ **${name}** を選択しました。`,
    timestamp: new Date(),
  })

  // 保留コマンド実行
  if (pendingCommand.value) {
    const cmd = pendingCommand.value
    pendingCommand.value = null
    sendMessage(cmd)
  }
}

/** 3コード完全一致で顧問先を検索。一意ならその顧問先を返す */
const findClientByThreeCode = (text: string): { isThreeCode: boolean; client: typeof clientList.value[0] | null } => {
  const q = text.trim().toUpperCase()
  // 3コードは英字大文字3文字（例: LDI, TAN, YMD）
  if (!/^[A-Z]{3}$/.test(q)) return { isThreeCode: false, client: null }
  const matches = clientList.value.filter(cl => (cl.threeCode ?? '').toUpperCase() === q)
  return { isThreeCode: true, client: matches.length === 1 ? matches[0]! : null }
}

/** 送信 */
const handleSend = () => {
  if (!inputText.value.trim() || isLoading.value) return
  showBrowser.value = false

  const text = inputText.value
  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // 3コード形式 → どのフェーズでも顧問先選択として処理
  const { isThreeCode, client: matchedClient } = findClientByThreeCode(text)
  if (isThreeCode) {
    messages.value.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    })
    if (matchedClient) {
      confirmClient(matchedClient.clientId)
    } else {
      // 架空の3コード
      messages.value.push({
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: `❌ 「${text.trim().toUpperCase()}」に該当する顧問先はありません。正しい3コードを入力してください。`,
        timestamp: new Date(),
      })
    }
    return
  }

  // 顧問先待ちモード → 会社名検索として処理
  if (pendingCommand.value !== null) {
    searchClientAndSelect(text)
    return
  }

  // 通常 → API送信（コマンド候補表示）
  sendMessage(text)
}

/** サジェスチョンクリック */
const handleSuggestionClick = (text: string) => {
  // 顧問先選択ボタンかチェック
  const lastAiMsg = [...messages.value].reverse().find(m => m.role === 'ai')
  const matchedSug = lastAiMsg?.response?.suggestions?.find(s => s.label === text)

  if (matchedSug?.command.startsWith('__select_client__')) {
    // 顧問先候補クリック → 確定
    messages.value.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    })
    const clientId = matchedSug.command.replace('__select_client__', '')
    confirmClient(clientId)
    return
  }

  // __exec__ コマンド → ユーザーメッセージはlabel、APIにはcommandを送信
  if (matchedSug?.command.startsWith('__exec__:')) {
    messages.value.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    })
    // sendMessageはユーザーメッセージも追加するので、直接API送信用関数を使う
    sendMessageDirect(matchedSug.command)
    return
  }

  // 顧問先未選択 → 顧問先チェック、選択済み → 直接実行
  if (!selectedClientId.value) {
    onCommandDecided(text)
  } else {
    sendMessage(text)
  }
}

/** テキストエリア自動リサイズ */
const autoResize = () => {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

/** メッセージ追加時にスクロール + フォールバック検知 */
const highlightBrowse = ref(false)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

watch(() => messages.value.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }

    // 最新メッセージがフォールバック（提案なし）ならボタンを光らせる
    const lastMsg = messages.value[messages.value.length - 1]
    if (
      lastMsg?.role === 'ai' &&
      lastMsg.response?.type === 'text' &&
      (!lastMsg.response.suggestions || lastMsg.response.suggestions.length === 0)
    ) {
      highlightBrowse.value = true
      if (highlightTimer) clearTimeout(highlightTimer)
      highlightTimer = setTimeout(() => {
        highlightBrowse.value = false
      }, 15000)
    }
  })
})

/** 時刻フォーマット */
const formatTime = (date: Date) => {
  const d = new Date(date)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** テキスト内の改行をHTMLに変換 */
/** メッセージ本文のフォーマット（簡易Markdown対応） */
const formatContent = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
/* ---------- ウィンドウ全体 ---------- */
.ai-chat-window {
  position: fixed;
  bottom: 88px;
  right: 24px;
  width: 420px;
  height: 540px;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
}

/* ---------- ヘッダー ---------- */
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
}

.ai-chat-header:active {
  cursor: grabbing;
}

.ai-chat-drag-icon {
  font-size: 12px;
  opacity: 0.5;
  margin-right: 2px;
}

.ai-chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-header-icon {
  font-size: 18px;
}

.ai-chat-header-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.ai-chat-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---------- 検索可能顧問先ドロップダウン ---------- */
.ai-client-dropdown {
  position: relative;
}

.ai-client-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  max-width: 180px;
  cursor: pointer;
  transition: all 0.15s;
}

.ai-client-dropdown-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.ai-client-dropdown-btn--warn {
  border-color: #f59e0b;
  animation: client-warn-pulse 1.5s ease-in-out infinite alternate;
}

@keyframes client-warn-pulse {
  0% { background: rgba(255, 255, 255, 0.15); }
  100% { background: rgba(245, 158, 11, 0.3); }
}

.ai-client-dropdown-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.ai-client-dropdown-icon {
  font-size: 10px;
  transition: transform 0.2s;
}

.ai-client-dropdown-icon--open {
  transform: rotate(180deg);
}

.ai-client-dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 260px;
  max-height: 320px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 20;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ai-client-dropdown-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 13px;
}

.ai-client-dropdown-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1e293b;
  background: transparent;
}

.ai-client-dropdown-list {
  overflow-y: auto;
  max-height: 250px;
}

.ai-client-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.ai-client-dropdown-item:hover {
  background: #f1f5f9;
}

.ai-client-dropdown-item--active {
  background: #ede9fe;
  color: #6366f1;
  font-weight: 600;
}

.ai-client-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  background: #ede9fe;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}

.ai-client-dropdown-sep {
  height: 1px;
  background: #e2e8f0;
  margin: 2px 8px;
}

.ai-client-dropdown-empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* ドロップダウンフェード */
.ai-dropdown-fade-enter-active,
.ai-dropdown-fade-leave-active {
  transition: all 0.15s ease;
}
.ai-dropdown-fade-enter-from,
.ai-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.ai-chat-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.ai-chat-close-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

/* ---------- メッセージエリア ---------- */
.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
}

/* ---------- ウェルカムメッセージ ---------- */
.ai-chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #94a3b8;
}

.ai-chat-welcome-icon {
  font-size: 36px;
  color: #a78bfa;
}

.ai-chat-welcome-text {
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
}

.ai-chat-welcome-hint {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: -4px;
}

.ai-cmd-browse-btn--welcome {
  margin-top: 8px;
}

.ai-chat-welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 320px;
}

/* ---------- メッセージバブル ---------- */
.ai-chat-msg {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.ai-chat-msg--user {
  align-self: flex-end;
  align-items: flex-end;
}

.ai-chat-msg--ai {
  align-self: flex-start;
  align-items: flex-start;
}

.ai-chat-msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.55;
  word-break: break-word;
}

.ai-chat-msg--user .ai-chat-msg-bubble {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-chat-msg--ai .ai-chat-msg-bubble {
  background: #fff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.ai-chat-msg-content {
  white-space: pre-wrap;
}

.ai-chat-msg-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 3px;
  padding: 0 4px;
}

/* ---------- テーブル ---------- */
.ai-chat-msg-table-wrap {
  overflow-x: auto;
  margin-top: 8px;
}

.ai-chat-msg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ai-chat-msg-table th,
.ai-chat-msg-table td {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.ai-chat-msg-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #475569;
}

/* ---------- サジェスチョンボタン ---------- */
.ai-chat-msg-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.ai-chat-suggestion-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 5px 12px;
  font-size: 12px;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ai-chat-suggestion-btn:hover {
  background: #e0e7ff;
  border-color: #c7d2fe;
  color: #4f46e5;
}

/* AI提案ボタン（label + description） */
.ai-chat-suggest-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  text-align: left;
}

.ai-chat-suggest-btn:hover {
  background: #e0e7ff;
  border-color: #818cf8;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.12);
}

.ai-chat-suggest-label {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.ai-chat-suggest-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.3;
}

/* ---------- その他のコマンドを見るボタン ---------- */
.ai-cmd-browse-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.ai-cmd-browse-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.ai-cmd-browse-btn:hover {
  border-color: #818cf8;
  color: #6366f1;
  background: #f5f3ff;
}

/* ---------- ローディング ---------- */
.ai-chat-msg-loading {
  display: flex;
  gap: 4px;
  padding: 14px 18px;
}

.ai-chat-loading-dot {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: ai-dot-bounce 1.4s infinite ease-in-out both;
}

.ai-chat-loading-dot:nth-child(1) { animation-delay: -0.32s; }
.ai-chat-loading-dot:nth-child(2) { animation-delay: -0.16s; }
.ai-chat-loading-dot:nth-child(3) { animation-delay: 0s; }

@keyframes ai-dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ---------- 入力エリア ---------- */
.ai-chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}

/* 📋 全コマンドトグルボタン */
.ai-chat-browse-toggle {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.ai-chat-browse-toggle:hover {
  border-color: #818cf8;
  color: #6366f1;
  background: #f5f3ff;
}

.ai-chat-browse-toggle--active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.ai-chat-browse-toggle--active:hover {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}

/* フォールバック時のパルスアニメーション */
.ai-chat-browse-toggle--pulse {
  animation: browse-pulse 0.8s ease-in-out infinite alternate;
  border-color: #818cf8;
}

@keyframes browse-pulse {
  0% {
    background: #f8fafc;
    color: #6366f1;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.3);
    transform: scale(1);
  }
  100% {
    background: #6366f1;
    color: #fff;
    box-shadow: 0 0 12px 4px rgba(99, 102, 241, 0.4);
    transform: scale(1.15);
  }
}

.ai-chat-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13.5px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 120px;
  line-height: 1.5;
  transition: border-color 0.15s;
}

.ai-chat-input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
}

.ai-chat-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.ai-chat-send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.ai-chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---------- アニメーション ---------- */
.ai-chat-slide-enter-active,
.ai-chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-chat-slide-enter-from,
.ai-chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* ---------- コマンドブラウザモーダル ---------- */
.ai-cmd-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;
}

.ai-cmd-modal {
  width: 92%;
  max-height: 80%;
  display: flex;
}

.ai-cmd-modal > * {
  width: 100%;
  max-height: 420px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

/* フェードアニメーション */
.ai-browser-fade-enter-active,
.ai-browser-fade-leave-active {
  transition: all 0.2s ease;
}

.ai-browser-fade-enter-from,
.ai-browser-fade-leave-to {
  opacity: 0;
}

.ai-browser-fade-enter-from .ai-cmd-modal,
.ai-browser-fade-leave-to .ai-cmd-modal {
  transform: scale(0.95);
}
</style>
