import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStaff } from '@/features/staff-management/composables/useStaff'

// =============================================
// 型定義
// =============================================

/** クライアント（一覧・詳細で共通利用） */
export interface Client {
    clientId: string;   // 不変。DB primary key。形式: {3コード}-{5桁連番}（例: ABC-00001）
    threeCode: string;  // 可変。人間用の識別コード。大文字3文字（例: ABC）
    companyName: string;
    companyNameKana: string;
    type: 'corp' | 'individual';
    repName: string;
    repNameKana: string;
    phoneNumber: string;
    email: string;
    chatRoomUrl: string;
    contact: { type: 'email' | 'chatwork' | 'none'; value: string };
    fiscalMonth: number;
    fiscalDay: string | number;
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
    /** 不動産所得あり（個人事業主の場合のみ有効。account-master.tsの不動産関連15科目の表示可否を制御） */
    hasRentalIncome: boolean;
    /** 主担当スタッフID（useStaff紐付けと同期。Phase C: clients.staff_id FKに移行） */
    staffId: string | null;
    advisoryFee: number;
    bookkeepingFee: number;
    settlementFee: number;
    taxFilingFee: number;
}

/** パネルフォーム用型（ClientからclientIdを除き、contactをフラット化） */
export interface ClientForm extends Omit<Client, 'clientId' | 'contact'> {
    contactType: 'email' | 'chatwork' | 'none';
    contactValue: string;
}

// =============================================
// ヘルパー関数
// =============================================

/**
 * 新しいclientIdを生成する。
 * 形式: {3コード}-{5桁連番}（例: ABC-00001）
 * 既存クライアントの連番の最大値+1を割り当てる。
 */
export const createClientId = (threeCode: string, existingClients: Client[]): string => {
    let maxSeq = 0;
    for (const c of existingClients) {
        const dash = c.clientId.indexOf('-');
        if (dash >= 0) {
            const seq = parseInt(c.clientId.substring(dash + 1), 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
    }
    const nextSeq = String(maxSeq + 1).padStart(5, '0');
    return `${threeCode}-${nextSeq}`;
};

/** 空のフォームを生成 */
export const emptyClientForm = (): ClientForm => ({
    threeCode: '', companyName: '', companyNameKana: '', type: 'corp',
    repName: '', repNameKana: '', phoneNumber: '',
    email: '', chatRoomUrl: '',
    contactType: 'email', contactValue: '',
    fiscalMonth: 3, fiscalDay: '末日', industry: '', establishedDate: '', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: null,
    advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
});

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

// 旧useStaff紐付けテーブルのlocalStorageゴミデータをクリーンアップ
// （Client.staffIdがsource of truthに移行したため不要）
localStorage.removeItem('sugu-suru:staff-assignments')

const clients = ref<Client[]>([
    {
        clientId: 'ABC-00001', threeCode: 'ABC', companyName: '株式会社ABC商事', companyNameKana: 'カブシキガイシャエービーシーショウジ',
        type: 'corp', repName: '山田 太郎', repNameKana: 'ヤマダ タロウ',
        phoneNumber: '03-1234-5678', email: 'info@abc-shoij.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@abc-shoij.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '卸売業・小売業', establishedDate: '20100401', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1234567890123',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: 'staff-0002',
        advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        clientId: 'DEF-00002', threeCode: 'DEF', companyName: '有限会社DEF建設', companyNameKana: 'ユウゲンガイシャディーイーエフケンセツ',
        type: 'corp', repName: '鈴木 一郎', repNameKana: 'スズキ イチロウ',
        phoneNumber: '06-9876-5432', email: 'suzuki@def-kensetsu.co.jp', chatRoomUrl: 'https://www.chatwork.com/#!rid00001',
        contact: { type: 'chatwork', value: 'def-kensetsu' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '建設業', establishedDate: '20050915', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 3, taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9876543210987',
        hasDepartmentManagement: true, hasRentalIncome: false,
        staffId: 'staff-0004',
        advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
    },
    {
        clientId: 'GHI-00003', threeCode: 'GHI', companyName: '個人事業 高橋デザイン', companyNameKana: 'コジンジギョウ タカハシデザイン',
        type: 'individual', repName: '高橋 美咲', repNameKana: 'タカハシ ミサキ',
        phoneNumber: '090-1111-2222', email: 'misaki@design.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'misaki@design.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20200101', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: true,
        staffId: 'staff-0002',
        advisoryFee: 20000, bookkeepingFee: 10000, settlementFee: 80000, taxFilingFee: 0,
    },
    {
        clientId: 'JKL-00004', threeCode: 'JKL', companyName: '医療法人社団 健康会', companyNameKana: 'イリョウホウジンシャダン ケンコウカイ',
        type: 'corp', repName: '中村 健太', repNameKana: 'ナカムラ ケンタ',
        phoneNumber: '03-5555-6666', email: '', chatRoomUrl: '',
        contact: { type: 'none', value: '' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '19950601', status: 'inactive',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555666677778',
        hasDepartmentManagement: true, hasRentalIncome: false,
        staffId: 'staff-0004',
        advisoryFee: 80000, bookkeepingFee: 50000, settlementFee: 300000, taxFilingFee: 150000,
    },
    {
        clientId: 'MNO-00005', threeCode: 'MNO', companyName: '株式会社MNOフーズ', companyNameKana: 'カブシキガイシャエムエヌオーフーズ',
        type: 'corp', repName: '小林 洋子', repNameKana: 'コバヤシ ヨウコ',
        phoneNumber: '045-7777-8888', email: 'info@mno-foods.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@mno-foods.co.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20180301', status: 'suspension',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777888899990',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: 'staff-0002',
        advisoryFee: 35000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    // --- 以下: 進捗管理用に追加した顧問先 ---
    {
        clientId: 'ANE-00006', threeCode: 'ANE', companyName: '有限会社ANE工業', companyNameKana: 'ユウゲンガイシャアネコウギョウ',
        type: 'corp', repName: '佐々木 誠', repNameKana: 'ササキ マコト',
        phoneNumber: '048-6666-7777', email: 'sasaki@ane-kogyo.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'sasaki@ane-kogyo.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '製造業', establishedDate: '20000301', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T6666777788880',
        hasDepartmentManagement: true, hasRentalIncome: false,
        staffId: null,
        advisoryFee: 60000, bookkeepingFee: 40000, settlementFee: 250000, taxFilingFee: 120000,
    },
    {
        clientId: 'ORD-00007', threeCode: 'ORD', companyName: 'ORDER壱口店 吉井芳然', companyNameKana: 'オーダーイチグチテン ヨシイヨシノリ',
        type: 'individual', repName: '吉井 芳然', repNameKana: 'ヨシイ ヨシノリ',
        phoneNumber: '090-3333-4444', email: 'yoshii@order.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'yoshii@order.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20210801', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 4, taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: null,
        advisoryFee: 15000, bookkeepingFee: 10000, settlementFee: 60000, taxFilingFee: 0,
    },
    {
        clientId: 'LDI-00008', threeCode: 'LDI', companyName: '株式会社LDIデジタル', companyNameKana: 'カブシキガイシャエルディーアイデジタル',
        type: 'corp', repName: '田村 智子', repNameKana: 'タムラ トモコ',
        phoneNumber: '03-9999-0000', email: 'tamura@ldi-digital.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'tamura@ldi-digital.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20160301', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9999000011110',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: null,
        advisoryFee: 45000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    {
        clientId: 'MHL-00009', threeCode: 'MHL', companyName: '合同会社MHLメディカル', companyNameKana: 'ゴウドウガイシャエムエイチエルメディカル',
        type: 'corp', repName: '橋本 恵子', repNameKana: 'ハシモト ケイコ',
        phoneNumber: '045-1111-2222', email: 'hashimoto@mhl-med.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'hashimoto@mhl-med.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '20110301', status: 'active',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1111222233330',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: null,
        advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        clientId: 'MUK-00010', threeCode: 'MUK', companyName: '個人事業 MUKU工房', companyNameKana: 'コジンジギョウ ムクコウボウ',
        type: 'individual', repName: '村上 翔太', repNameKana: 'ムラカミ ショウタ',
        phoneNumber: '090-7777-8888', email: 'murakami@muku.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'murakami@muku.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: '製造業', establishedDate: '20230401', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: false,
        staffId: null,
        advisoryFee: 15000, bookkeepingFee: 8000, settlementFee: 50000, taxFilingFee: 0,
    },
]);

// =============================================
// Composable
// =============================================

export function useClients() {
    const route = useRoute();

    /** ルートパスまたはクエリパラメータから現在選択中のクライアントを動的に取得 */
    const currentClient = computed<Client | null>(() => {
        const path = route.path;
        // 1. パターンB: /client/journal-list/:clientId, /client/drive-select/:clientId 等
        const patternB = path.match(/^\/client\/(journal-list|drive-select|export|export-history|export-detail|settings\/accounts|settings\/tax|settings|upload|learning)\/([^/]+)/);
        if (patternB && patternB[2]) {
            const cid = patternB[2];
            const found = clients.value.find(c => c.clientId === cid);
            if (found) return found;
        }
        // 2. /clients/:clientId/settings パターン（旧ページ互換）
        const clientsMatch = path.match(/\/clients\/([^/]+)/);
        if (clientsMatch && clientsMatch[1]) {
            const paramId = clientsMatch[1];
            const found = clients.value.find(c => c.threeCode.toLowerCase() === paramId.toLowerCase() || c.clientId === paramId);
            if (found) return found;
        }
        // 3. クエリパラメータ ?client=clientId から取得（互換用）
        const clientQuery = route.query.client;
        if (clientQuery && typeof clientQuery === 'string') {
            const found = clients.value.find(c => c.clientId === clientQuery);
            if (found) return found;
        }
        // 4. 該当なし → null（マスタページ等ではcurrentClientなし）
        return null;
    });

    /** 顧問先IDから担当者名を取得（Client.staffIdから導出） */
    function getStaffNameForClient(clientId: string): string {
        const client = clients.value.find(c => c.clientId === clientId)
        if (!client?.staffId) return ''
        const { getStaffName } = useStaff()
        return getStaffName(client.staffId)
    }

    return {
        clients,
        currentClient,
        getStaffNameForClient,
    };
}
