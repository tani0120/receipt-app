import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// =============================================
// 型定義
// =============================================

/** クライアント（一覧・詳細で共通利用） */
export interface Client {
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
    advisoryFee: number;
    bookkeepingFee: number;
    settlementFee: number;
    taxFilingFee: number;
}

/** パネルフォーム用型（Clientからid/uuidを除き、contactをフラット化） */
export interface ClientForm extends Omit<Client, 'id' | 'uuid' | 'contact'> {
    contactType: 'email' | 'chatwork' | 'none';
    contactValue: string;
}

// =============================================
// ヘルパー関数
// =============================================

/** UUID生成 */
export const generateUuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/** 顧問先IDを生成し、id（URL用）とuuid（内部用）を返す */
export const createClientId = (clientCode: string): { id: string; uuid: string } => {
    const uuid = generateUuid();
    return { id: `${clientCode}-${uuid}`, uuid };
};

/** URLのclientIdパラメータから3コードとUUIDを分離 */
export const parseClientId = (clientId: string): { clientCode: string; uuid: string } => {
    const sep = clientId.indexOf('-');
    return {
        clientCode: clientId.substring(0, sep),
        uuid: clientId.substring(sep + 1),
    };
};

/** 空のフォームを生成 */
export const emptyClientForm = (): ClientForm => ({
    clientCode: '', companyName: '', companyNameKana: '', type: 'corp',
    repName: '', repNameKana: '', staffName: '', phoneNumber: '',
    email: '', chatRoomUrl: '',
    contactType: 'email', contactValue: '',
    fiscalMonth: 3, fiscalDay: '末日', industry: '', establishedDate: '', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
});

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

const clients = ref<Client[]>([
    {
        ...createClientId('ABC'), clientCode: 'ABC', companyName: '株式会社ABC商事', companyNameKana: 'カブシキガイシャエービーシーショウジ',
        type: 'corp', repName: '山田 太郎', repNameKana: 'ヤマダ タロウ', staffName: '佐藤 花子',
        phoneNumber: '03-1234-5678', email: 'info@abc-shoij.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@abc-shoij.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '卸売業・小売業', establishedDate: '20100401', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1234567890123',
        hasDepartmentManagement: false, advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        ...createClientId('DEF'), clientCode: 'DEF', companyName: '有限会社DEF建設', companyNameKana: 'ユウゲンガイシャディーイーエフケンセツ',
        type: 'corp', repName: '鈴木 一郎', repNameKana: 'スズキ イチロウ', staffName: '田中 次郎',
        phoneNumber: '06-9876-5432', email: 'suzuki@def-kensetsu.co.jp', chatRoomUrl: 'https://www.chatwork.com/#!rid00001',
        contact: { type: 'chatwork', value: 'def-kensetsu' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '建設業', establishedDate: '20050915', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 3, taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9876543210987',
        hasDepartmentManagement: true, advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
    },
    {
        ...createClientId('GHI'), clientCode: 'GHI', companyName: '個人事業 高橋デザイン', companyNameKana: 'コジンジギョウ タカハシデザイン',
        type: 'individual', repName: '高橋 美咲', repNameKana: 'タカハシ ミサキ', staffName: '佐藤 花子',
        phoneNumber: '090-1111-2222', email: 'misaki@design.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'misaki@design.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20200101', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, advisoryFee: 20000, bookkeepingFee: 10000, settlementFee: 80000, taxFilingFee: 0,
    },
    {
        ...createClientId('JKL'), clientCode: 'JKL', companyName: '医療法人社団 健康会', companyNameKana: 'イリョウホウジンシャダン ケンコウカイ',
        type: 'corp', repName: '中村 健太', repNameKana: 'ナカムラ ケンタ', staffName: '田中 次郎',
        phoneNumber: '03-5555-6666', email: '', chatRoomUrl: '',
        contact: { type: 'none', value: '' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '19950601', status: 'inactive',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555666677778',
        hasDepartmentManagement: true, advisoryFee: 80000, bookkeepingFee: 50000, settlementFee: 300000, taxFilingFee: 150000,
    },
    {
        ...createClientId('MNO'), clientCode: 'MNO', companyName: '株式会社MNOフーズ', companyNameKana: 'カブシキガイシャエムエヌオーフーズ',
        type: 'corp', repName: '小林 洋子', repNameKana: 'コバヤシ ヨウコ', staffName: '佐藤 花子',
        phoneNumber: '045-7777-8888', email: 'info@mno-foods.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@mno-foods.co.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20180301', status: 'suspension',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777888899990',
        hasDepartmentManagement: false, advisoryFee: 35000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
]);

// =============================================
// Composable
// =============================================

export function useClients() {
    const route = useRoute();

    /** ルートパスから現在選択中のクライアントを動的に取得 */
    const currentClient = computed<{ code: string; name: string } | null>(() => {
        const path = route.path;
        // /clients/:clientId/ パターンからclientId抽出
        const match = path.match(/\/clients\/([^/]+)/);
        if (match && match[1]) {
            const clientId = match[1];
            const found = clients.value.find(c => c.clientCode.toLowerCase() === clientId.toLowerCase());
            if (found) return { code: found.clientCode, name: found.companyName };
        }
        // デフォルト: 先頭クライアント
        const first = clients.value[0];
        return first ? { code: first.clientCode, name: first.companyName } : null;
    });

    return {
        clients,
        currentClient,
    };
}
