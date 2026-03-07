<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <MockNavBar />
    <div class="flex-1 overflow-auto">
      <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <router-link to="/master" class="cm-back-link">
            <i class="fa-solid fa-arrow-left"></i> マスタ管理
          </router-link>
          <h1 class="cm-title">顧問先管理</h1>
        </div>

        <!-- ツールバー -->
        <div class="cm-toolbar">
          <div class="cm-toolbar-left">
            <!-- ステータスフィルター -->
            <select v-model="statusFilter" class="cm-filter-select">
              <option value="all">全て</option>
              <option value="active">稼働中</option>
              <option value="inactive">契約終了</option>
              <option value="suspension">休眠中</option>
            </select>
            <span class="cm-page-info">全{{ filteredRows.length }}件</span>
          </div>
          <div class="cm-toolbar-right">
            <button class="cm-action-btn primary" @click="openAddPanel">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </div>
        </div>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table">
            <colgroup>
              <col style="width: 70px;">
              <col style="width: 70px;">
              <col style="width: 60px;">
              <col style="width: 22%;">
              <col style="width: 100px;">
              <col style="width: 100px;">
              <col style="width: 80px;">
              <col style="width: 100px;">
              <col style="width: 120px;">
            </colgroup>
            <thead>
              <tr>
                <th class="sortable" @click="sortBy('status')">
                  ステータス <i :class="getSortIcon('status')"></i>
                </th>
                <th class="sortable" @click="sortBy('clientCode')">
                  コード <i :class="getSortIcon('clientCode')"></i>
                </th>
                <th class="sortable" @click="sortBy('type')">
                  種別 <i :class="getSortIcon('type')"></i>
                </th>
                <th class="sortable" @click="sortBy('companyName')">
                  会社名 <i :class="getSortIcon('companyName')"></i>
                </th>
                <th class="sortable" @click="sortBy('staffName')">
                  担当者 <i :class="getSortIcon('staffName')"></i>
                </th>
                <th class="sortable" @click="sortBy('accountingSoftware')">
                  会計ソフト <i :class="getSortIcon('accountingSoftware')"></i>
                </th>
                <th class="sortable" @click="sortBy('fiscalMonth')">
                  決算月 <i :class="getSortIcon('fiscalMonth')"></i>
                </th>
                <th>電話番号</th>
                <th>連絡手段</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="row.id"
                :class="{ 'row-inactive': row.status === 'inactive', 'row-suspension': row.status === 'suspension' }"
                @click="openEditPanel(row)"
                style="cursor: pointer;"
              >
                <td>
                  <span class="cm-status-badge" :class="'status-' + row.status">
                    {{ row.status === 'active' ? '稼働中' : row.status === 'suspension' ? '休眠中' : '契約終了' }}
                  </span>
                </td>
                <td class="cm-code">{{ row.clientCode }}</td>
                <td>{{ row.type === 'corp' ? '法人' : '個人' }}</td>
                <td class="cm-company-name">{{ row.companyName }}</td>
                <td>{{ row.staffName || '—' }}</td>
                <td>{{ softwareLabel(row.accountingSoftware) }}</td>
                <td class="cm-fiscal">{{ row.fiscalMonth }}月</td>
                <td>{{ row.phoneNumber || '—' }}</td>
                <td>{{ contactLabel(row.contact) }}</td>
              </tr>
              <tr v-if="pagedRows.length === 0">
                <td colspan="9" class="cm-empty">該当する顧問先がありません</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ページネーション -->
        <div class="cm-pagination" v-if="totalPages > 1">
          <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
          <span
            v-for="p in totalPages" :key="p"
            class="cm-page-num" :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</span>
          <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
        </div>
      </div>
    </div>

    <!-- スライドインパネル（追加/編集） -->
    <transition name="slide-panel">
      <div v-if="panelMode" class="cm-panel-overlay" @click.self="closePanel">
        <div class="cm-panel-container">
          <div class="cm-panel-header">
            <h2 class="cm-panel-title">{{ panelMode === 'add' ? '顧問先を追加' : '顧問先を編集' }}</h2>
            <div class="cm-panel-header-actions">
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-stop-btn" @click="confirmSuspend">
                ⏸️ 休眠
              </button>
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-terminate-btn" @click="confirmTerminate">
                ⛔ 契約終了
              </button>
              <button v-if="panelMode === 'edit' && (panelForm.status === 'inactive' || panelForm.status === 'suspension')" class="cm-panel-restore-btn" @click="restoreClient">
                <i class="fa-solid fa-rotate-left"></i> 稼働に戻す
              </button>
              <button class="cm-panel-cancel" @click="closePanel">キャンセル</button>
              <button class="cm-panel-save" @click="saveClient">
                <i class="fa-solid fa-save"></i> 保存
              </button>
            </div>
          </div>
          <div class="cm-panel-body">
            <!-- 基本情報セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">基本情報</h3>
              <div class="cm-field">
                <label class="cm-label">法人/個人</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.type" value="corp"><span>法人</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.type" value="individual"><span>個人</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">3コード <span class="cm-hint">※大文字アルファベット3文字</span></label>
                <input type="text" v-model="panelForm.clientCode" class="cm-input cm-code-input" maxlength="3" placeholder="ABC" @input="panelForm.clientCode = panelForm.clientCode.toUpperCase().replace(/[^A-Z]/g, '')">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名 <span class="cm-required">*</span></label>
                <input type="text" v-model="panelForm.companyName" class="cm-input" placeholder="株式会社サンプル">
              </div>
              <div class="cm-field">
                <label class="cm-label">会社名（カナ）</label>
                <input type="text" v-model="panelForm.companyNameKana" class="cm-input" placeholder="カブシキガイシャサンプル">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名</label>
                <input type="text" v-model="panelForm.repName" class="cm-input" placeholder="山田 太郎">
              </div>
              <div class="cm-field">
                <label class="cm-label">代表者名（カナ）</label>
                <input type="text" v-model="panelForm.repNameKana" class="cm-input" placeholder="ヤマダ タロウ">
              </div>
              <div class="cm-field">
                <label class="cm-label">担当者</label>
                <input type="text" v-model="panelForm.staffName" class="cm-input" placeholder="担当者を入力">
              </div>
              <div class="cm-field">
                <label class="cm-label">電話番号</label>
                <input type="text" v-model="panelForm.phoneNumber" class="cm-input" placeholder="03-1234-5678">
              </div>
              <div class="cm-field">
                <label class="cm-label">連絡手段</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.contactType" value="email"><span>メール</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.contactType" value="chatwork"><span>Chatwork</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.contactType" value="none"><span>なし</span></label>
                </div>
              </div>
              <div v-if="panelForm.contactType !== 'none'" class="cm-field">
                <label class="cm-label">連絡先</label>
                <input type="text" v-model="panelForm.contactValue" class="cm-input" :placeholder="panelForm.contactType === 'email' ? 'example@mail.com' : 'Chatwork ID'">
              </div>
              <div class="cm-field">
                <label class="cm-label">決算月</label>
                <select v-model="panelForm.fiscalMonth" class="cm-select">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                </select>
              </div>
              <div class="cm-field" style="position: relative;">
                <label class="cm-label">業種</label>
                <div class="cm-custom-select" @click.stop="showIndustryDropdown = !showIndustryDropdown">
                  <span :class="{ 'cm-placeholder': !panelForm.industry }">{{ panelForm.industry || '未設定' }}</span>
                  <i class="fa-solid fa-chevron-down cm-select-arrow" :class="{ rotated: showIndustryDropdown }"></i>
                </div>
                <div v-if="showIndustryDropdown" class="cm-dropdown" @click.stop>
                  <div v-for="opt in industryOptions" :key="opt" class="cm-dropdown-item" :class="{ selected: panelForm.industry === opt }" @click="panelForm.industry = opt; showIndustryDropdown = false">{{ opt || '未設定' }}</div>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">設立日</label>
                <input type="text" v-model="panelForm.establishedDate" class="cm-input" placeholder="YYYYMMDD" maxlength="8">
              </div>
            </div>

            <!-- 会計設定セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">会計設定</h3>
              <div class="cm-field">
                <label class="cm-label">会計ソフト</label>
                <select v-model="panelForm.accountingSoftware" class="cm-select">
                  <option value="mf">マネーフォワード</option>
                  <option value="freee">freee</option>
                  <option value="yayoi">弥生</option>
                  <option value="tkc">TKC</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">確定申告</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxFilingType" value="blue"><span>青色</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxFilingType" value="white"><span>白色</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">課税方式</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="general"><span>原則課税</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="simplified"><span>簡易課税</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.consumptionTaxMode" value="exempt"><span>免税</span></label>
                </div>
              </div>
              <div v-if="panelForm.consumptionTaxMode === 'simplified'" class="cm-field">
                <label class="cm-label">事業区分</label>
                <select v-model="panelForm.simplifiedTaxCategory" class="cm-select">
                  <option :value="undefined">未設定</option>
                  <option :value="1">第一種（卸売業）90%</option>
                  <option :value="2">第二種（小売業）80%</option>
                  <option :value="3">第三種（製造業・建設業）70%</option>
                  <option :value="4">第四種（飲食店・その他）60%</option>
                  <option :value="5">第五種（サービス業）50%</option>
                  <option :value="6">第六種（不動産業）40%</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">税込/税抜</label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxMethod" value="inclusive"><span>税込</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.taxMethod" value="exclusive"><span>税抜</span></label>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">経理方式</label>
                <select v-model="panelForm.calculationMethod" class="cm-select">
                  <option value="accrual">発生主義</option>
                  <option value="cash">現金主義</option>
                  <option value="interim_cash">中間現金主義</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-label">デフォルト支払方法</label>
                <select v-model="panelForm.defaultPaymentMethod" class="cm-select">
                  <option value="cash">現金</option>
                  <option value="owner_loan">事業主借</option>
                  <option value="accounts_payable">買掛金</option>
                </select>
              </div>
              <div class="cm-field">
                <label class="cm-checkbox-label">
                  <input type="checkbox" v-model="panelForm.isInvoiceRegistered">
                  <span>インボイス登録事業者</span>
                </label>
              </div>
              <div v-if="panelForm.isInvoiceRegistered" class="cm-field">
                <label class="cm-label">登録番号</label>
                <input type="text" v-model="panelForm.invoiceRegistrationNumber" class="cm-input" placeholder="T1234567890123">
              </div>
              <div class="cm-field">
                <label class="cm-checkbox-label">
                  <input type="checkbox" v-model="panelForm.hasDepartmentManagement">
                  <span>部門管理あり</span>
                </label>
              </div>
            </div>

            <!-- 報酬設定セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">報酬設定</h3>
              <div class="cm-field">
                <label class="cm-label">月額顧問報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.advisoryFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">記帳代行</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.bookkeepingFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field cm-computed-field">
                <label class="cm-label">月次合計（自動算出）</label>
                <span class="cm-computed-value">{{ (panelForm.advisoryFee + panelForm.bookkeepingFee).toLocaleString() }} 円</span>
              </div>
              <div class="cm-field">
                <label class="cm-label">決算報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.settlementFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field">
                <label class="cm-label">消費税申告報酬</label>
                <div class="cm-amount-input">
                  <input type="number" v-model.number="panelForm.taxFilingFee" class="cm-input cm-num-input" min="0">
                  <span class="cm-amount-unit">円</span>
                </div>
              </div>
              <div class="cm-field cm-computed-field">
                <label class="cm-label">年間総報酬（自動算出）</label>
                <span class="cm-computed-value">{{ annualTotal.toLocaleString() }} 円</span>
              </div>
            </div>

            <!-- マスタ自動コピー通知 (K14) -->
            <div v-if="panelMode === 'add'" class="cm-auto-copy-notice">
              <i class="fa-solid fa-circle-info"></i>
              新規作成時、勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされます。
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

// --- 型定義 ---
interface ClientRow {
  id: string;         // URL用ID: {3コード}-{UUID} 形式
  uuid: string;       // 内部処理用: UUID部分のみ（Phase BでDB primary key）
  clientCode: string; // UI表示用: 3コード
  companyName: string;
  companyNameKana: string;
  type: 'corp' | 'individual';
  repName: string;
  repNameKana: string;
  staffName: string;
  phoneNumber: string;
  contact: { type: 'email' | 'chatwork' | 'none'; value: string };
  fiscalMonth: number;
  industry: string;
  establishedDate: string;
  status: 'active' | 'inactive' | 'suspension';
  accountingSoftware: 'mf' | 'freee' | 'yayoi' | 'tkc' | 'other';
  taxFilingType: 'blue' | 'white';
  consumptionTaxMode: 'general' | 'simplified' | 'exempt';
  simplifiedTaxCategory?: number;
  taxMethod: 'inclusive' | 'exclusive';
  calculationMethod: 'accrual' | 'cash' | 'interim_cash';
  defaultPaymentMethod: 'cash' | 'owner_loan' | 'accounts_payable';
  isInvoiceRegistered: boolean;
  invoiceRegistrationNumber: string;
  hasDepartmentManagement: boolean;
  advisoryFee: number;
  bookkeepingFee: number;
  settlementFee: number;
  taxFilingFee: number;
}

// パネルフォーム用型（ClientRowからid/uuidを除き、contactをフラット化）
interface ClientPanelForm extends Omit<ClientRow, 'id' | 'uuid' | 'contact'> {
  contactType: 'email' | 'chatwork' | 'none';
  contactValue: string;
}

// --- 顧問先ID生成（{3コード}-{UUID}形式） ---
const generateUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/** 顧問先IDを生成し、id（URL用）とuuid（内部用）を返す */
const createClientId = (clientCode: string): { id: string; uuid: string } => {
  const uuid = generateUuid();
  return { id: `${clientCode}-${uuid}`, uuid };
};

/** URLのclientIdパラメータから3コードとUUIDを分離 */
const parseClientId = (clientId: string): { clientCode: string; uuid: string } => {
  const sep = clientId.indexOf('-');
  return {
    clientCode: clientId.substring(0, sep),
    uuid: clientId.substring(sep + 1),
  };
};

// --- 業種リスト（ScreenS_Settings.vueと同一） ---
const industryOptions: string[] = [
  '', '飲食業', '建設業', '製造業・メーカー', '卸売業・小売業', '商社',
  '不動産業', '銀行・金融', '保険業', '医療・福祉関係業', 'コンサルティング',
  '専門事務所', '運輸・運送業', '旅行／宿泊／レジャー', 'IT・ソフトウェア関連',
  'スポーツ・ヘルス関連', '理容・美容・サロン', '冠婚葬祭', '警備関連',
  '清掃業', '教育業', '他サービス業', '官公庁・自治体', 'その他',
];

// --- サンプルデータ ---
const clients = ref<ClientRow[]>([
  {
    ...createClientId('ABC'), clientCode: 'ABC', companyName: '株式会社ABC商事', companyNameKana: 'カブシキガイシャエービーシーショウジ',
    type: 'corp', repName: '山田 太郎', repNameKana: 'ヤマダ タロウ', staffName: '佐藤 花子',
    phoneNumber: '03-1234-5678', contact: { type: 'email', value: 'info@abc-shoij.co.jp' },
    fiscalMonth: 3, industry: '卸売業・小売業', establishedDate: '20100401', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1234567890123',
    hasDepartmentManagement: false, advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
  },
  {
    ...createClientId('DEF'), clientCode: 'DEF', companyName: '有限会社DEF建設', companyNameKana: 'ユウゲンガイシャディーイーエフケンセツ',
    type: 'corp', repName: '鈴木 一郎', repNameKana: 'スズキ イチロウ', staffName: '田中 次郎',
    phoneNumber: '06-9876-5432', contact: { type: 'chatwork', value: 'def-kensetsu' },
    fiscalMonth: 9, industry: '建設業', establishedDate: '20050915', status: 'active',
    accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
    simplifiedTaxCategory: 3, taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9876543210987',
    hasDepartmentManagement: true, advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
  },
  {
    ...createClientId('GHI'), clientCode: 'GHI', companyName: '個人事業 高橋デザイン', companyNameKana: 'コジンジギョウ タカハシデザイン',
    type: 'individual', repName: '高橋 美咲', repNameKana: 'タカハシ ミサキ', staffName: '佐藤 花子',
    phoneNumber: '090-1111-2222', contact: { type: 'email', value: 'misaki@design.jp' },
    fiscalMonth: 12, industry: 'IT・ソフトウェア関連', establishedDate: '20200101', status: 'active',
    accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
    taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, advisoryFee: 20000, bookkeepingFee: 10000, settlementFee: 80000, taxFilingFee: 0,
  },
  {
    ...createClientId('JKL'), clientCode: 'JKL', companyName: '医療法人社団 健康会', companyNameKana: 'イリョウホウジンシャダン ケンコウカイ',
    type: 'corp', repName: '中村 健太', repNameKana: 'ナカムラ ケンタ', staffName: '田中 次郎',
    phoneNumber: '03-5555-6666', contact: { type: 'none', value: '' },
    fiscalMonth: 3, industry: '医療・福祉関係業', establishedDate: '19950601', status: 'inactive',
    accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555666677778',
    hasDepartmentManagement: true, advisoryFee: 80000, bookkeepingFee: 50000, settlementFee: 300000, taxFilingFee: 150000,
  },
  {
    ...createClientId('MNO'), clientCode: 'MNO', companyName: '株式会社MNOフーズ', companyNameKana: 'カブシキガイシャエムエヌオーフーズ',
    type: 'corp', repName: '小林 洋子', repNameKana: 'コバヤシ ヨウコ', staffName: '佐藤 花子',
    phoneNumber: '045-7777-8888', contact: { type: 'email', value: 'info@mno-foods.co.jp' },
    fiscalMonth: 6, industry: '飲食業', establishedDate: '20180301', status: 'suspension',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777888899990',
    hasDepartmentManagement: false, advisoryFee: 35000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
  },
]);

// --- ステータスフィルター ---
const statusFilter = ref<'all' | 'active' | 'inactive' | 'suspension'>('all');

// --- ソート ---
const sortKey = ref<string>('companyName');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort cm-sort-icon';
  return sortOrder.value === 'asc' ? 'fa-solid fa-sort-up cm-sort-icon active' : 'fa-solid fa-sort-down cm-sort-icon active';
};

// --- フィルター＋ソート済みデータ ---
const filteredRows = computed((): ClientRow[] => {
  let rows = clients.value.slice();
  if (statusFilter.value !== 'all') {
    rows = rows.filter(r => r.status === statusFilter.value);
  }
  const key = sortKey.value as keyof ClientRow;
  rows.sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    if (va < vb) return sortOrder.value === 'asc' ? -1 : 1;
    if (va > vb) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(filteredRows.value.length / PAGE_SIZE));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});

// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingId = ref<string | null>(null);
const showIndustryDropdown = ref(false);

const emptyForm = (): ClientPanelForm => ({
  clientCode: '', companyName: '', companyNameKana: '', type: 'corp',
  repName: '', repNameKana: '', staffName: '', phoneNumber: '',
  contactType: 'none', contactValue: '',
  fiscalMonth: 3, industry: '', establishedDate: '', status: 'active',
  accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
  taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
  isInvoiceRegistered: false, invoiceRegistrationNumber: '',
  hasDepartmentManagement: false, advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
});

const panelForm = reactive<ClientPanelForm>(emptyForm());

const openAddPanel = () => {
  Object.assign(panelForm, emptyForm());
  panelMode.value = 'add';
  editingId.value = null;
};

const openEditPanel = (row: ClientRow) => {
  const { id: _id, contact, ...rest } = row;
  Object.assign(panelForm, {
    ...rest,
    contactType: contact.type,
    contactValue: contact.value,
  });
  panelMode.value = 'edit';
  editingId.value = row.id;
};

const closePanel = () => {
  panelMode.value = null;
  editingId.value = null;
  showIndustryDropdown.value = false;
};

const saveClient = () => {
  if (!panelForm.companyName) {
    globalThis.alert('会社名は必須です');
    return;
  }
  const { contactType, contactValue, ...fields } = panelForm;
  const ids = editingId.value
    ? { id: editingId.value, uuid: parseClientId(editingId.value).uuid }
    : createClientId(panelForm.clientCode);
  const data: ClientRow = {
    ...fields,
    ...ids,
    contact: { type: contactType, value: contactValue },
  };
  if (panelMode.value === 'add') {
    clients.value.push(data);
    globalThis.alert(`「${data.companyName}」を追加しました。\n\n勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされました。`);
  } else {
    const idx = clients.value.findIndex(c => c.id === editingId.value);
    if (idx >= 0) clients.value[idx] = data;
    globalThis.alert(`「${data.companyName}」を更新しました。`);
  }
  closePanel();
};

// --- K13: 休眠・契約終了 ---
const confirmSuspend = () => {
  if (globalThis.confirm(`「${panelForm.companyName}」を休眠にしますか？\n\n休眠中も顧問先データは保持されます。再開も可能です。`)) {
    panelForm.status = 'suspension';
    saveClient();
  }
};

const confirmTerminate = () => {
  if (globalThis.confirm(`「${panelForm.companyName}」の契約を終了しますか？\n\n顧問先データは保持されますが、契約終了として記録されます。`)) {
    panelForm.status = 'inactive';
    saveClient();
  }
};

const restoreClient = () => {
  panelForm.status = 'active';
  saveClient();
};

// --- ヘルパー ---
const softwareLabel = (s: string) => {
  const map: Record<string, string> = { mf: 'MF', freee: 'freee', yayoi: '弥生', tkc: 'TKC', other: 'その他' };
  return map[s] || s;
};

const contactLabel = (c: { type: string; value: string }) => {
  if (c.type === 'none') return '—';
  if (c.type === 'email') return `✉ ${c.value}`;
  return `💬 ${c.value}`;
};

const annualTotal = computed(() => {
  const monthly = panelForm.advisoryFee + panelForm.bookkeepingFee;
  return monthly * 12 + panelForm.settlementFee + panelForm.taxFilingFee;
});

// --- ドロップダウン外クリックで閉じる ---
const closeDropdowns = () => { showIndustryDropdown.value = false; };
onMounted(() => document.addEventListener('click', closeDropdowns));
onUnmounted(() => document.removeEventListener('click', closeDropdowns));
</script>

<style scoped>
.cm-settings { max-width: 1200px; margin: 0 auto; padding: 20px 24px; }
.cm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.cm-back-link { color: #3b82f6; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 4px; }
.cm-back-link:hover { text-decoration: underline; }
.cm-title { font-size: 18px; font-weight: 700; color: #1e293b; }

/* ツールバー */
.cm-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; }
.cm-toolbar-left { display: flex; align-items: center; gap: 12px; }
.cm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.cm-filter-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-size: 12px; color: #334155; background: white; cursor: pointer; outline: none; }
.cm-filter-select:focus { border-color: #3b82f6; }
.cm-page-info { font-size: 12px; color: #64748b; }
.cm-action-btn { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 14px; font-size: 12px; cursor: pointer; background: white; color: #334155; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
.cm-action-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.cm-action-btn.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
.cm-action-btn.primary:hover { background: #2563eb; }

/* テーブル */
.cm-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 6px; background: white; }
.cm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.cm-table thead th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; white-space: nowrap; user-select: none; }
.cm-table thead th.sortable { cursor: pointer; }
.cm-table thead th.sortable:hover { color: #3b82f6; }
.cm-table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: nowrap; }
.cm-table tbody tr:hover { background: #f8fafc; }
.cm-table tbody tr.row-inactive { opacity: 0.5; }
.cm-code { font-weight: 700; letter-spacing: 1px; color: #1e293b; font-family: 'Menlo', monospace; }
.cm-company-name { font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.cm-fiscal { text-align: center; }
.cm-empty { text-align: center; color: #94a3b8; padding: 40px 12px !important; }
.cm-sort-icon { font-size: 10px; color: #94a3b8; margin-left: 2px; }
.cm-sort-icon.active { color: #3b82f6; }

/* ステータスバッジ */
.cm-status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fee2e2; color: #991b1b; }
.status-suspension { background: #fef3c7; color: #92400e; }
.row-suspension { opacity: 0.6; }

/* ページネーション */
.cm-pagination { display: flex; justify-content: center; align-items: center; gap: 4px; margin-top: 16px; padding: 8px 0; }
.cm-page-arrow { cursor: pointer; padding: 4px 8px; color: #3b82f6; font-size: 13px; user-select: none; }
.cm-page-arrow.disabled { color: #cbd5e1; pointer-events: none; }
.cm-page-num { cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #64748b; }
.cm-page-num.active { background: #3b82f6; color: white; }

/* スライドインパネル */
.cm-panel-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; display: flex; justify-content: flex-end; background: rgba(0,0,0,0.15); }
.cm-panel-container { width: 480px; max-width: 90vw; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; height: 100%; }
.cm-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.cm-panel-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.cm-panel-header-actions { display: flex; align-items: center; gap: 10px; }
.cm-panel-cancel { color: #3b82f6; font-size: 13px; background: none; border: none; cursor: pointer; }
.cm-panel-cancel:hover { text-decoration: underline; }
.cm-panel-save { color: white; font-size: 13px; background: #3b82f6; border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-save:hover { background: #2563eb; }
.cm-panel-stop-btn { color: white; font-size: 12px; background: #f59e0b; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-stop-btn:hover { background: #d97706; }
.cm-panel-terminate-btn { color: white; font-size: 12px; background: #ef4444; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-terminate-btn:hover { background: #dc2626; }
.cm-panel-restore-btn { color: white; font-size: 12px; background: #22c55e; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-restore-btn:hover { background: #16a34a; }
.cm-panel-body { flex: 1; overflow-y: auto; padding: 20px; }

/* セクション */
.cm-section { margin-bottom: 24px; }
.cm-section-title { font-size: 14px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; margin-bottom: 14px; }
.cm-field { margin-bottom: 12px; }
.cm-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.cm-hint { font-weight: 400; font-size: 10px; color: #94a3b8; }
.cm-required { color: #ef4444; }
.cm-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.cm-input:focus { border-color: #3b82f6; }
.cm-code-input { width: 90px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Menlo', monospace; }
.cm-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; background: white; cursor: pointer; outline: none; width: 100%; }
.cm-select:focus { border-color: #3b82f6; }
.cm-radio-group { display: flex; align-items: center; gap: 14px; margin-top: 2px; }
.cm-radio { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #334155; cursor: pointer; }
.cm-radio input[type="radio"] { accent-color: #3b82f6; }
.cm-checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }
.cm-checkbox-label input[type="checkbox"] { accent-color: #3b82f6; }

/* 金額入力 */
.cm-amount-input { display: flex; align-items: center; gap: 6px; }
.cm-num-input { width: 160px !important; text-align: right; }
.cm-amount-unit { font-size: 12px; color: #64748b; }
.cm-computed-field { background: #f8fafc; border-radius: 4px; padding: 8px 10px; }
.cm-computed-value { font-size: 14px; font-weight: 700; color: #1e293b; }

/* カスタムドロップダウン */
.cm-custom-select { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; box-sizing: border-box; }
.cm-custom-select:hover { border-color: #3b82f6; }
.cm-placeholder { color: #94a3b8; }
.cm-select-arrow { font-size: 10px; color: #64748b; transition: transform 0.2s; }
.cm-select-arrow.rotated { transform: rotate(180deg); }
.cm-dropdown { position: absolute; top: 100%; left: 0; width: 100%; max-height: 220px; overflow-y: auto; background: white; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 200; margin-top: 2px; }
.cm-dropdown-item { padding: 7px 10px; font-size: 12px; color: #334155; cursor: pointer; }
.cm-dropdown-item:hover { background: #f1f5f9; }
.cm-dropdown-item.selected { background: #eff6ff; color: #3b82f6; font-weight: 600; }

/* マスタ自動コピー通知 */
.cm-auto-copy-notice { display: flex; align-items: flex-start; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #1e40af; line-height: 1.6; margin-top: 8px; }

/* スライドアニメーション */
.slide-panel-enter-active, .slide-panel-leave-active { transition: opacity 0.25s ease; }
.slide-panel-enter-active .cm-panel-container, .slide-panel-leave-active .cm-panel-container { transition: transform 0.25s ease; }
.slide-panel-enter-from { opacity: 0; }
.slide-panel-enter-from .cm-panel-container { transform: translateX(100%); }
.slide-panel-leave-to { opacity: 0; }
.slide-panel-leave-to .cm-panel-container { transform: translateX(100%); }
</style>
