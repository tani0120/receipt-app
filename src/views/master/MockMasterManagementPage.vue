<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto p-4">
      <div class="h-full overflow-auto relative">
        <!-- カードグリッド -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          <!-- カード1: 勘定科目マスタ（全社） -->
          <div class="settings-card" @click="navigateTo('accounts')">
            <div class="settings-card-header">
              <i class="fa-solid fa-book card-icon"></i>
              <h3 class="card-title">勘定科目マスタ（全社）</h3>
            </div>
            <p class="card-description">事務所共通の勘定科目を管理します。全顧問先に適用される勘定科目の追加・編集・非表示化が可能です。</p>
            <a class="card-link">設定する</a>
          </div>

          <!-- カード2: 税区分マスタ（全社） -->
          <div class="settings-card" @click="navigateTo('tax')">
            <div class="settings-card-header">
              <i class="fa-solid fa-percent card-icon"></i>
              <h3 class="card-title">税区分マスタ（全社）</h3>
            </div>
            <p class="card-description">事務所共通の税区分を管理します。本則・簡易・免税の切替、カスタム税区分の追加が可能です。</p>
            <a class="card-link">設定する</a>
          </div>

          <!-- カード3: 業種マスタ（全社） -->
          <div class="settings-card" @click="navigateTo('vectors')">
            <div class="settings-card-header">
              <i class="fa-solid fa-industry card-icon"></i>
              <h3 class="card-title">業種マスタ（全社）</h3>
            </div>
            <p class="card-description">取引先の業種分類（vendor_vector）を管理します。業種ごとの借方科目マッピングを確認・編集できます。</p>
            <a class="card-link">設定する</a>
          </div>

          <!-- カード4: 取引先マスタ（全社） -->
          <div class="settings-card" @click="navigateTo('vendors-list')">
            <div class="settings-card-header">
              <i class="fa-solid fa-warehouse card-icon"></i>
              <h3 class="card-title">取引先マスタ（全社）</h3>
            </div>
            <p class="card-description">全社共通の取引先マスタ（224件）を管理します。会社名・照合キー・業種・T番号の確認・編集が可能です。</p>
            <a class="card-link">設定する</a>
          </div>

          <!-- カード5: 取引先外マスタ（全社） -->
          <div class="settings-card" @click="navigateTo('non-vendor')">
            <div class="settings-card-header">
              <i class="fa-solid fa-shuffle card-icon"></i>
              <h3 class="card-title">取引先外マスタ（全社）</h3>
            </div>
            <p class="card-description">取引先特定不要の取引（ATM・手数料・利息・借入金等）24種の科目マッピングを確認・編集します。法人用/個人用切替対応。</p>
            <a class="card-link">設定する</a>
          </div>

          <!-- カード6: バリデーションルール一覧 -->
          <div class="settings-card settings-card--validation" @click="navigateTo('validation-rules')">
            <div class="settings-card-header">
              <i class="fa-solid fa-clipboard-check card-icon card-icon--validation"></i>
              <h3 class="card-title">バリデーションルール一覧</h3>
            </div>
            <p class="card-description">仕訳チェックルール（決定論的チェック＋税務品質チェック）の一覧・管理。ルールID・指摘内容・修正提案・自動修正対応を確認できます。</p>
            <a class="card-link card-link--validation">設定する</a>
          </div>

          <!-- カード6: MF MCP取得情報一覧 -->
          <div class="settings-card settings-card--mf" @click="navigateTo('mf-mcp-info')">
            <div class="settings-card-header">
              <i class="fa-solid fa-cloud-arrow-down card-icon card-icon--mf"></i>
              <h3 class="card-title">MF MCP取得情報一覧</h3>
            </div>
            <p class="card-description">マネーフォワードMCPサーバーから取得できる全19ツールの仕様・実測データを掲載。事業者情報・勘定科目・仕訳・試算表など各APIの詳細フィールドを確認できます。</p>
            <a class="card-link card-link--mf">確認する</a>
          </div>

          <!-- カード7: MF→マスタ→仕訳一覧 フィールド遷移 -->
          <div class="settings-card settings-card--flow" @click="navigateTo('field-flow')">
            <div class="settings-card-header">
              <i class="fa-solid fa-arrows-left-right card-icon card-icon--flow"></i>
              <h3 class="card-title">MF⇒マスタ⇒仕訳一覧 フィールド遷移</h3>
            </div>
            <p class="card-description">MFから取得したフィールドがマスタ管理を経て仕訳一覧のバリデーションでどう使われるかを3段階で可視化。フロント/バックエンドの区分も表示。</p>
            <a class="card-link card-link--flow">確認する</a>
          </div>

          <!-- カード8: MCP活用事例セミナー -->
          <div class="settings-card settings-card--seminar" @click="navigateTo('mcp-case-study')">
            <div class="settings-card-header">
              <i class="fa-solid fa-graduation-cap card-icon card-icon--seminar"></i>
              <h3 class="card-title">MCP活用事例セミナー</h3>
            </div>
            <p class="card-description">MCPサーバーの実機テスト結果と最適な活用方法を解説。postJournals vs postTransactionsの完全比較、MF自動仕訳の精度検証、sugu-suruの存在価値の分析。</p>
            <a class="card-link card-link--seminar">確認する</a>
          </div>

        </div>
      </div>
    </div>
  </div>

  <NotifyModal
    :show="modal.notifyState.show"
    :title="modal.notifyState.title"
    :message="modal.notifyState.message"
    :variant="modal.notifyState.variant"
    @close="modal.onNotifyClose"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useModalHelper } from '@/composables/useModalHelper';
import NotifyModal from '@/components/NotifyModal.vue';

const router = useRouter();
const modal = useModalHelper();

const navigateTo = (section: string) => {
  const routes: Record<string, string> = {
    'accounts': '/master/accounts',
    'tax': '/master/tax',
    'vectors': '/master/vectors',
    'vendors-list': '/master/vendors/list',
    'non-vendor': '/master/vendors/non-vendor',
    'validation-rules': '/master/validation-rules',
    'mf-mcp-info': '/master/mcp',
    'field-flow': '/master/field-flow',
    'mcp-case-study': '/master/mcp-case-study',
  };
  if (routes[section]) {
    router.push(routes[section]);
  } else {
    modal.notify({ title: `${section}は未実装です`, variant: 'warning' });
  }
};
</script>

<style scoped>
.settings-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}

.settings-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.settings-card--mf {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
}

.settings-card--mf:hover {
  border-color: #16a34a;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
}

.settings-card-header {
  margin-bottom: 12px;
}

.card-icon {
  color: #3b82f6;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.card-icon--mf {
  color: #16a34a;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
}

.card-description {
  font-size: 11px;
  color: #64748b;
  line-height: 1.6;
  flex: 1;
  margin-bottom: 12px;
}

.card-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  cursor: pointer;
}

.card-link:hover {
  text-decoration: underline;
}

.card-link--mf {
  color: #16a34a;
}

.settings-card--flow {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #fff 100%);
}

.settings-card--flow:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.card-icon--flow {
  color: #2563eb;
}

.card-link--flow {
  color: #2563eb;
}

.settings-card--seminar {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #fff 100%);
}

.settings-card--seminar:hover {
  border-color: #7c3aed;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.card-icon--seminar {
  color: #7c3aed;
}

.card-link--seminar {
  color: #7c3aed;
}

.settings-card--validation {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
}

.settings-card--validation:hover {
  border-color: #dc2626;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.card-icon--validation {
  color: #dc2626;
}

.card-link--validation {
  color: #dc2626;
}
</style>
