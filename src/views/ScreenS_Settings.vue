<template>
  <div class="h-full overflow-auto relative">
    <!-- カードグリッド -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <!-- カード1: 基本情報 -->
      <div class="settings-card" @click="openPanel('basic-info')">
        <div class="settings-card-header">
          <i class="fa-solid fa-building card-icon"></i>
          <h3 class="card-title">基本情報</h3>
        </div>
        <p class="card-description">顧問先の基本情報を設定します。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード2: 会計ソフト 勘定科目 -->
      <div class="settings-card" @click="navigateTo('accounting-software')">
        <div class="settings-card-header">
          <i class="fa-solid fa-calculator card-icon"></i>
          <h3 class="card-title">勘定科目と税区分</h3>
        </div>
        <p class="card-description">勘定科目や税区分を設定します。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード3: 部門 -->
      <div class="settings-card" @click="navigateTo('department')">
        <div class="settings-card-header">
          <i class="fa-solid fa-sitemap card-icon"></i>
          <h3 class="card-title">部門</h3>
        </div>
        <p class="card-description">顧問先の部門情報を設定します。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード4: アサイン -->
      <div class="settings-card" @click="navigateTo('assign')">
        <div class="settings-card-header">
          <i class="fa-solid fa-user-plus card-icon"></i>
          <h3 class="card-title">アサイン</h3>
        </div>
        <p class="card-description">顧問先を担当するスタッフをアサインしてください。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード5: データ化ルール 業種設定 -->
      <div class="settings-card" @click="navigateTo('data-rules')">
        <div class="settings-card-header">
          <i class="fa-solid fa-list-check card-icon"></i>
          <h3 class="card-title">データ化ルール<br>業種設定</h3>
        </div>
        <p class="card-description">支払先ごとにデータ化のルールを設定します。（アップロード時の科目を「自動判定」にした場合に有効になります）</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード6: 要確認マーク -->
      <div class="settings-card" @click="navigateTo('confirmation-mark')">
        <div class="settings-card-header">
          <i class="fa-solid fa-circle-exclamation card-icon"></i>
          <h3 class="card-title">要確認マーク</h3>
        </div>
        <p class="card-description">自動データ化されたデータのうち、確認が必要なデータにマークを表示するフィルタを設定します。詳しくは<span class="text-blue-500 underline">こちら</span>をご覧ください。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード7: キーワード -->
      <div class="settings-card" @click="navigateTo('keyword')">
        <div class="settings-card-header">
          <i class="fa-solid fa-key card-icon"></i>
          <h3 class="card-title">キーワード</h3>
        </div>
        <p class="card-description">自動データ化されたデータのうち、指定したキーワードが証票に含まれている時にマークを表示するための設定をします。詳しくは<span class="text-blue-500 underline">こちら</span>をご覧ください。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード8: データ出力 -->
      <div class="settings-card" @click="navigateTo('data-export')">
        <div class="settings-card-header">
          <i class="fa-solid fa-file-export card-icon"></i>
          <h3 class="card-title">データ出力</h3>
        </div>
        <p class="card-description">データ出力時の変換を設定します。詳しくは<span class="text-blue-500 underline">こちら</span>をご覧ください。</p>
        <a class="card-link">設定する</a>
      </div>

      <!-- カード9: 過去仕訳取り込み -->
      <div class="settings-card" @click="navigateTo('past-journal')">
        <div class="settings-card-header">
          <i class="fa-solid fa-file-import card-icon"></i>
          <h3 class="card-title">過去仕訳取り込み</h3>
        </div>
        <p class="card-description">会計ソフトの仕訳を取引先取得に取り込みます。</p>
        <a class="card-link">仕訳をインポート</a>
      </div>

      <!-- カード10: 電子帳簿保存法設定 -->
      <div class="settings-card" @click="navigateTo('e-bookkeeping')">
        <div class="settings-card-header">
          <i class="fa-solid fa-shield-halved card-icon"></i>
          <h3 class="card-title">電子帳簿保存法設定</h3>
        </div>
        <p class="card-description">電子帳簿保存法に対応するための規制を設定します。</p>
        <a class="card-link">設定する</a>
      </div>
    </div>

    <!-- 右1/3 スライドインパネル（基本情報） -->
    <transition name="slide-panel">
      <div v-if="activePanel === 'basic-info'" class="panel-overlay" @click.self="closePanel">
        <div class="panel-container">
          <!-- パネルヘッダー -->
          <div class="panel-header">
            <button class="panel-cancel" @click="closePanel">キャンセル</button>
            <button class="panel-save" @click="saveBasicInfo">
              <i class="fa-solid fa-save"></i> 保存
            </button>
          </div>

          <!-- パネル本体 -->
          <div class="panel-body">
            <!-- 法人/個人 -->
            <div class="panel-field">
              <label class="panel-label">法人/個人</label>
              <div class="panel-radio-group">
                <label class="panel-radio">
                  <input type="radio" v-model="form.entityType" value="corporate" name="entityType">
                  <span>法人</span>
                </label>
                <label class="panel-radio">
                  <input type="radio" v-model="form.entityType" value="individual" name="entityType">
                  <span>個人</span>
                </label>
              </div>
              <!-- 不動産所得（個人の場合のみ表示） -->
              <div v-if="form.entityType === 'individual'" style="margin-top: 10px;">
                <label class="panel-checkbox-label">
                  <input type="checkbox" v-model="form.hasRealEstate">
                  <span>不動産所得あり</span>
                </label>
              </div>
            </div>

            <!-- コード -->
            <div class="panel-field">
              <label class="panel-label">3コード <span style="font-weight: 400; font-size: 11px; color: #64748b;">※大文字アルファベットで記載してください</span></label>
              <input
                type="text"
                v-model="form.code"
                class="panel-input"
                style="width: 80px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;"
                maxlength="3"
                placeholder="ABC"
                @input="form.code = form.code.toUpperCase().replace(/[^A-Z]/g, '')"
              >
            </div>

            <!-- 顧問先名 -->
            <div class="panel-field">
              <label class="panel-label">顧問先名</label>
              <input type="text" v-model="form.clientName" class="panel-input">
            </div>

            <!-- 担当者 -->
            <div class="panel-field">
              <label class="panel-label">
                担当者<i class="fa-solid fa-circle-question panel-help-icon" title="担当者を選択してください"></i>
              </label>
              <input type="text" v-model="form.staff" class="panel-input">
            </div>

            <!-- 決算日 -->
            <div class="panel-field">
              <label class="panel-label">決算日</label>
              <div class="panel-date-group">
                <select v-model="form.fiscalMonth" class="panel-select">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                </select>
                <span class="panel-date-separator">/</span>
                <select v-model="form.fiscalDay" class="panel-select">
                  <option value="末日">末日</option>
                  <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                </select>
              </div>
            </div>

            <!-- 業種（カスタムドロップダウン：常に下方向に開く） -->
            <div class="panel-field" style="position: relative;">
              <label class="panel-label">業種</label>
              <div class="custom-select" @click.stop="showIndustryDropdown = !showIndustryDropdown">
                <span :class="{ 'custom-select-placeholder': !form.industry }">{{ form.industry || '未設定' }}</span>
                <i class="fa-solid fa-chevron-down custom-select-arrow" :class="{ 'rotated': showIndustryDropdown }"></i>
              </div>
              <div v-if="showIndustryDropdown" class="custom-dropdown" @click.stop>
                <div
                  v-for="opt in industryOptions" :key="opt"
                  class="custom-dropdown-item"
                  :class="{ 'selected': form.industry === opt }"
                  @click="form.industry = opt; showIndustryDropdown = false"
                >{{ opt || '未設定' }}</div>
              </div>
            </div>

            <!-- インボイス登録事業者 -->
            <div class="panel-field">
              <label class="panel-checkbox-label">
                <input type="checkbox" v-model="form.invoiceRegistered">
                <span>インボイス登録事業者</span>
                <i class="fa-solid fa-circle-question panel-help-icon" title="適格請求書発行事業者として登録済みの場合はチェックしてください"></i>
              </label>
            </div>

            <!-- 課税方式 -->
            <div class="panel-field">
              <label class="panel-label">課税方式</label>
              <div class="panel-radio-group">
                <label class="panel-radio">
                  <input type="radio" v-model="form.taxMethod" value="general" name="taxMethod">
                  <span>原則課税</span>
                </label>
                <label class="panel-radio">
                  <input type="radio" v-model="form.taxMethod" value="simplified" name="taxMethod">
                  <span>簡易課税</span>
                </label>
                <label class="panel-radio">
                  <input type="radio" v-model="form.taxMethod" value="exempt" name="taxMethod">
                  <span>免税</span>
                </label>
              </div>
            </div>

            <!-- 事業区分（簡易課税の場合のみ表示） -->
            <div v-if="form.taxMethod === 'simplified'" class="panel-field">
              <label class="panel-label">事業区分（複数選択可）</label>
              <p class="panel-field-description" style="margin-bottom: 8px;">
                簡易課税のみなし仕入率に使用します。複数の事業を行っている場合は該当する区分を全て選択してください。
              </p>
              <div class="business-category-list">
                <label v-for="cat in businessCategoryOptions" :key="cat.value" class="business-category-item">
                  <input type="checkbox" :value="cat.value" v-model="form.businessCategories">
                  <span class="business-category-label">{{ cat.label }}</span>
                  <span class="business-category-rate">{{ cat.rate }}</span>
                </label>
              </div>
            </div>

            <!-- 免税の説明（免税選択時のみ表示） -->
            <div v-if="form.taxMethod === 'exempt'" class="panel-field">
              <div class="exempt-notice">
                <i class="fa-solid fa-circle-info" style="color: #3b82f6; margin-right: 6px;"></i>
                免税の場合は、証憑に複数の税区分が記載されている場合でも、税区分単位の複合仕訳ではなく、単一仕訳になります。
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/stores/settingsStore';

const settingsStore = useSettingsStore();

const router = useRouter();

const activePanel = ref<string | null>(null);
const showIndustryDropdown = ref(false);

const industryOptions: string[] = [
  '', '飲食業', '建設業', '製造業・メーカー', '卸売業・小売業', '商社',
  '不動産業', '銀行・金融', '保険業', '医療・福祉関係業', 'コンサルティング',
  '専門事務所', '運輸・運送業', '旅行／宿泊／レジャー', 'IT・ソフトウェア関連',
  'スポーツ・ヘルス関連', '理容・美容・サロン', '冠婚葬祭', '警備関連',
  '清掃業', '教育業', '他サービス業', '官公庁・自治体', 'その他',
];

// ドロップダウン外クリックで閉じる
const closeDropdowns = () => { showIndustryDropdown.value = false; };
onMounted(() => document.addEventListener('click', closeDropdowns));
onUnmounted(() => document.removeEventListener('click', closeDropdowns));

const businessCategoryOptions = [
  { value: 1, label: '第一種（卸売業）', rate: '90%' },
  { value: 2, label: '第二種（小売業）', rate: '80%' },
  { value: 3, label: '第三種（製造業・建設業・農林水産業）', rate: '70%' },
  { value: 4, label: '第四種（飲食店・その他）', rate: '60%' },
  { value: 5, label: '第五種（サービス業・金融・運輸）', rate: '50%' },
  { value: 6, label: '第六種（不動産業）', rate: '40%' },
];

const form = reactive({
  entityType: settingsStore.entityType as string,
  code: '',
  clientName: '',
  fiscalMonth: 12,
  fiscalDay: '末日' as string | number,
  industry: '',
  taxMethod: settingsStore.taxMethod as string,
  invoiceRegistered: settingsStore.invoiceRegistered,
  hasRealEstate: settingsStore.hasRealEstate,
  businessCategories: [] as number[],
  staff: '',
  taxExempt: false,
  notifyCompletion: true,
});

// フォーム変更時にストアへ同期
watch(() => form.entityType, (v) => {
  settingsStore.entityType = v as 'corporate' | 'individual';
  if (v === 'corporate') { form.hasRealEstate = false; settingsStore.hasRealEstate = false; }
});
watch(() => form.taxMethod, (v) => { settingsStore.taxMethod = v as 'general' | 'simplified' | 'exempt'; });
watch(() => form.invoiceRegistered, (v) => { settingsStore.invoiceRegistered = v; });
watch(() => form.hasRealEstate, (v) => { settingsStore.hasRealEstate = v; });

const openPanel = (panel: string) => {
  activePanel.value = panel;
};

const closePanel = () => {
  activePanel.value = null;
};

const saveBasicInfo = () => {
  console.log('基本情報を保存:', { ...form });
  closePanel();
};

const navigateTo = (section: string) => {
  // clientIdはルートパラメータから取得（/clients/:clientId/settings）
  const clientId = (router.currentRoute.value.params.clientId as string) ?? 'ABC-00001';
  const routes: Record<string, string> = {
    'accounting-software': `/settings/accounts/${clientId}`,
  };
  if (routes[section]) {
    router.push(routes[section]);
  } else {
    console.log(`Navigate to: ${section}`);
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

.settings-card-header {
  margin-bottom: 12px;
}

.card-icon {
  color: #3b82f6;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
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

/* === 右1/3スライドインパネル === */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.panel-container {
  width: 33.333%;
  min-width: 400px;
  max-width: 520px;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.panel-cancel {
  color: #3b82f6;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
}

.panel-cancel:hover {
  text-decoration: underline;
}

.panel-save {
  color: #3b82f6;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.panel-save:hover {
  text-decoration: underline;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-field {
  margin-bottom: 14px;
}

.panel-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.panel-help-icon {
  color: #94a3b8;
  font-size: 12px;
  margin-left: 4px;
  cursor: help;
}

.panel-input {
  width: 280px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  color: #334155;
  outline: none;
  transition: border-color 0.2s;
}

.panel-input:focus {
  border-color: #3b82f6;
}

.panel-select {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  color: #334155;
  outline: none;
  background: white;
  cursor: pointer;
}

.panel-select:focus {
  border-color: #3b82f6;
}

.panel-date-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-date-separator {
  font-size: 14px;
  color: #64748b;
}

.panel-radio-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.panel-radio {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
}

.panel-radio input[type="radio"] {
  accent-color: #3b82f6;
}

.panel-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
}

.panel-checkbox-label input[type="checkbox"] {
  accent-color: #3b82f6;
}

.panel-field-description {
  font-size: 11px;
  color: #64748b;
  line-height: 1.6;
  margin-top: 4px;
}

/* スライドアニメーション */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.25s ease;
}

.slide-panel-enter-active .panel-container,
.slide-panel-leave-active .panel-container {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from {
  opacity: 0;
}

.slide-panel-enter-from .panel-container {
  transform: translateX(100%);
}

.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-leave-to .panel-container {
  transform: translateX(100%);
}

/* === カスタムドロップダウン === */
.custom-select {
  width: 280px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  color: #334155;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.custom-select:hover {
  border-color: #3b82f6;
}

.custom-select-placeholder {
  color: #94a3b8;
}

.custom-select-arrow {
  font-size: 10px;
  color: #64748b;
  transition: transform 0.2s;
}

.custom-select-arrow.rotated {
  transform: rotate(180deg);
}

.custom-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 280px;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 200;
  margin-top: 2px;
}

.custom-dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
}

.custom-dropdown-item:hover {
  background: #f1f5f9;
}

.custom-dropdown-item.selected {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 600;
}

/* === 事業区分チェックボックス === */
.business-category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.business-category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.business-category-item:hover {
  background: #f1f5f9;
}

.business-category-item input[type="checkbox"] {
  accent-color: #3b82f6;
}

.business-category-label {
  flex: 1;
}

.business-category-rate {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

/* === 免税説明文 === */
.exempt-notice {
  display: flex;
  align-items: flex-start;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.6;
}
</style>
