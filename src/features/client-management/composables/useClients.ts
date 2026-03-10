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
    /** 不動産所得あり（個人事業主の場合のみ有効。account-master.tsの不動産関連15科目の表示可否を制御） */
    hasRentalIncome: boolean;
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
    hasDepartmentManagement: false, hasRentalIncome: false,
    advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
});

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

const clients = ref<Client[]>([
    {
        id: 'ABC-a0000001-0001-4000-8000-000000000001', uuid: 'a0000001-0001-4000-8000-000000000001',
        clientCode: 'ABC', companyName: '株式会社ABC商事', companyNameKana: 'カブシキガイシャエービーシーショウジ',
        type: 'corp', repName: '山田 太郎', repNameKana: 'ヤマダ タロウ', staffName: '佐藤 花子',
        phoneNumber: '03-1234-5678', email: 'info@abc-shoij.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@abc-shoij.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '卸売業・小売業', establishedDate: '20100401', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1234567890123',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        id: 'DEF-b0000002-0002-4000-8000-000000000002', uuid: 'b0000002-0002-4000-8000-000000000002',
        clientCode: 'DEF', companyName: '有限会社DEF建設', companyNameKana: 'ユウゲンガイシャディーイーエフケンセツ',
        type: 'corp', repName: '鈴木 一郎', repNameKana: 'スズキ イチロウ', staffName: '田中 次郎',
        phoneNumber: '06-9876-5432', email: 'suzuki@def-kensetsu.co.jp', chatRoomUrl: 'https://www.chatwork.com/#!rid00001',
        contact: { type: 'chatwork', value: 'def-kensetsu' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '建設業', establishedDate: '20050915', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 3, taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9876543210987',
        hasDepartmentManagement: true, hasRentalIncome: false,
        advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
    },
    {
        id: 'GHI-c0000003-0003-4000-8000-000000000003', uuid: 'c0000003-0003-4000-8000-000000000003',
        clientCode: 'GHI', companyName: '個人事業 高橋デザイン', companyNameKana: 'コジンジギョウ タカハシデザイン',
        type: 'individual', repName: '高橋 美咲', repNameKana: 'タカハシ ミサキ', staffName: '佐藤 花子',
        phoneNumber: '090-1111-2222', email: 'misaki@design.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'misaki@design.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20200101', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: true,
        advisoryFee: 20000, bookkeepingFee: 10000, settlementFee: 80000, taxFilingFee: 0,
    },
    {
        id: 'JKL-d0000004-0004-4000-8000-000000000004', uuid: 'd0000004-0004-4000-8000-000000000004',
        clientCode: 'JKL', companyName: '医療法人社団 健康会', companyNameKana: 'イリョウホウジンシャダン ケンコウカイ',
        type: 'corp', repName: '中村 健太', repNameKana: 'ナカムラ ケンタ', staffName: '田中 次郎',
        phoneNumber: '03-5555-6666', email: '', chatRoomUrl: '',
        contact: { type: 'none', value: '' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '19950601', status: 'inactive',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555666677778',
        hasDepartmentManagement: true, hasRentalIncome: false,
        advisoryFee: 80000, bookkeepingFee: 50000, settlementFee: 300000, taxFilingFee: 150000,
    },
    {
        id: 'MNO-e0000005-0005-4000-8000-000000000005', uuid: 'e0000005-0005-4000-8000-000000000005',
        clientCode: 'MNO', companyName: '株式会社MNOフーズ', companyNameKana: 'カブシキガイシャエムエヌオーフーズ',
        type: 'corp', repName: '小林 洋子', repNameKana: 'コバヤシ ヨウコ', staffName: '佐藤 花子',
        phoneNumber: '045-7777-8888', email: 'info@mno-foods.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@mno-foods.co.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20180301', status: 'suspension',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777888899990',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 35000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    // --- 以下: 進捗管理用に追加した顧問先（固定UUID） ---
    {
        id: 'JTR-f0000001-0001-4000-8000-000000000001', uuid: 'f0000001-0001-4000-8000-000000000001',
        clientCode: 'JTR', companyName: '株式会社JTRロジスティクス', companyNameKana: 'カブシキガイシャジェイティーアールロジスティクス',
        type: 'corp', repName: '渡辺 剛', repNameKana: 'ワタナベ タケシ', staffName: '',
        phoneNumber: '03-2222-3333', email: 'info@jtr-logi.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'info@jtr-logi.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '運輸業', establishedDate: '20120401', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T2222333344440',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
    },
    {
        id: 'AMT-f0000002-0002-4000-8000-000000000002', uuid: 'f0000002-0002-4000-8000-000000000002',
        clientCode: 'AMT', companyName: '合同会社AMTアセット', companyNameKana: 'ゴウドウガイシャエーエムティーアセット',
        type: 'corp', repName: '伊藤 真一', repNameKana: 'イトウ シンイチ', staffName: '',
        phoneNumber: '03-4444-5555', email: 'ito@amt-asset.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'ito@amt-asset.co.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: '不動産業', establishedDate: '20190601', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T4444555566660',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 30000, bookkeepingFee: 15000, settlementFee: 120000, taxFilingFee: 60000,
    },
    {
        id: 'ANE-f0000003-0003-4000-8000-000000000003', uuid: 'f0000003-0003-4000-8000-000000000003',
        clientCode: 'ANE', companyName: '有限会社ANE工業', companyNameKana: 'ユウゲンガイシャアネコウギョウ',
        type: 'corp', repName: '佐々木 誠', repNameKana: 'ササキ マコト', staffName: '',
        phoneNumber: '048-6666-7777', email: 'sasaki@ane-kogyo.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'sasaki@ane-kogyo.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '製造業', establishedDate: '20000301', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T6666777788880',
        hasDepartmentManagement: true, hasRentalIncome: false,
        advisoryFee: 60000, bookkeepingFee: 40000, settlementFee: 250000, taxFilingFee: 120000,
    },
    {
        id: 'ORD-f0000004-0004-4000-8000-000000000004', uuid: 'f0000004-0004-4000-8000-000000000004',
        clientCode: 'ORD', companyName: 'ORDER壱口店 吉井芳然', companyNameKana: 'オーダーイチグチテン ヨシイヨシノリ',
        type: 'individual', repName: '吉井 芳然', repNameKana: 'ヨシイ ヨシノリ', staffName: '',
        phoneNumber: '090-3333-4444', email: 'yoshii@order.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'yoshii@order.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20210801', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 4, taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 15000, bookkeepingFee: 10000, settlementFee: 60000, taxFilingFee: 0,
    },
    {
        id: 'EDL-f0000005-0005-4000-8000-000000000005', uuid: 'f0000005-0005-4000-8000-000000000005',
        clientCode: 'EDL', companyName: '株式会社EDLエデュケーション', companyNameKana: 'カブシキガイシャイーディーエルエデュケーション',
        type: 'corp', repName: '松本 裕美', repNameKana: 'マツモト ヒロミ', staffName: '',
        phoneNumber: '03-8888-9999', email: 'matsumoto@edl-edu.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'matsumoto@edl-edu.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: 'サービス業', establishedDate: '20150901', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T8888999900001',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 45000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    {
        id: 'FPC-f0000006-0006-4000-8000-000000000006', uuid: 'f0000006-0006-4000-8000-000000000006',
        clientCode: 'FPC', companyName: '株式会社FPCコンサルティング', companyNameKana: 'カブシキガイシャエフピーシーコンサルティング',
        type: 'corp', repName: '井上 直樹', repNameKana: 'イノウエ ナオキ', staffName: '',
        phoneNumber: '03-1111-0000', email: 'inoue@fpc-consul.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'inoue@fpc-consul.co.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: 'サービス業', establishedDate: '20170501', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1111000011110',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        id: 'GAC-f0000007-0007-4000-8000-000000000007', uuid: 'f0000007-0007-4000-8000-000000000007',
        clientCode: 'GAC', companyName: '合資会社GAC商会', companyNameKana: 'ゴウシガイシャジーエーシーショウカイ',
        type: 'corp', repName: '加藤 雅之', repNameKana: 'カトウ マサユキ', staffName: '',
        phoneNumber: '052-2222-3333', email: 'kato@gac-shokai.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'kato@gac-shokai.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '卸売業・小売業', establishedDate: '20080701', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T2222333300001',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 35000, bookkeepingFee: 20000, settlementFee: 140000, taxFilingFee: 70000,
    },
    {
        id: 'HIR-f0000008-0008-4000-8000-000000000008', uuid: 'f0000008-0008-4000-8000-000000000008',
        clientCode: 'HIR', companyName: '個人事業 廣瀬写真事務所', companyNameKana: 'コジンジギョウ ヒロセシャシンジムショ',
        type: 'individual', repName: '廣瀬 健一', repNameKana: 'ヒロセ ケンイチ', staffName: '',
        phoneNumber: '090-5555-6666', email: 'hirose@photo.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'hirose@photo.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: 'サービス業', establishedDate: '20220101', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'white', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: true,
        advisoryFee: 10000, bookkeepingFee: 5000, settlementFee: 50000, taxFilingFee: 0,
    },
    {
        id: 'KFP-f0000009-0009-4000-8000-000000000009', uuid: 'f0000009-0009-4000-8000-000000000009',
        clientCode: 'KFP', companyName: '株式会社KFPフィナンシャル', companyNameKana: 'カブシキガイシャケーエフピーフィナンシャル',
        type: 'corp', repName: '木村 大輔', repNameKana: 'キムラ ダイスケ', staffName: '',
        phoneNumber: '03-7777-0000', email: 'kimura@kfp-fin.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'kimura@kfp-fin.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '金融・保険業', establishedDate: '20130401', status: 'active',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777000088880',
        hasDepartmentManagement: true, hasRentalIncome: false,
        advisoryFee: 70000, bookkeepingFee: 40000, settlementFee: 280000, taxFilingFee: 140000,
    },
    {
        id: 'KHK-f0000010-0010-4000-8000-000000000010', uuid: 'f0000010-0010-4000-8000-000000000010',
        clientCode: 'KHK', companyName: '株式会社KHK化学', companyNameKana: 'カブシキガイシャケーエイチケーカガク',
        type: 'corp', repName: '清水 良太', repNameKana: 'シミズ リョウタ', staffName: '',
        phoneNumber: '06-3333-4444', email: 'shimizu@khk-chem.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'shimizu@khk-chem.co.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: '製造業', establishedDate: '19980601', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T3333444455550',
        hasDepartmentManagement: true, hasRentalIncome: false,
        advisoryFee: 55000, bookkeepingFee: 35000, settlementFee: 220000, taxFilingFee: 110000,
    },
    {
        id: 'LDI-f0000011-0011-4000-8000-000000000011', uuid: 'f0000011-0011-4000-8000-000000000011',
        clientCode: 'LDI', companyName: '株式会社LDIデジタル', companyNameKana: 'カブシキガイシャエルディーアイデジタル',
        type: 'corp', repName: '田村 智子', repNameKana: 'タムラ トモコ', staffName: '',
        phoneNumber: '03-9999-0000', email: 'tamura@ldi-digital.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'tamura@ldi-digital.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20160301', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9999000011110',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 45000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    {
        id: 'LIG-f0000012-0012-4000-8000-000000000012', uuid: 'f0000012-0012-4000-8000-000000000012',
        clientCode: 'LIG', companyName: '株式会社LIGライティング', companyNameKana: 'カブシキガイシャリグライティング',
        type: 'corp', repName: '森田 光一', repNameKana: 'モリタ コウイチ', staffName: '',
        phoneNumber: '03-0000-1111', email: 'morita@lig-light.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'morita@lig-light.co.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: '電気・ガス', establishedDate: '20140801', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T0000111122220',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 160000, taxFilingFee: 80000,
    },
    {
        id: 'MHL-f0000013-0013-4000-8000-000000000013', uuid: 'f0000013-0013-4000-8000-000000000013',
        clientCode: 'MHL', companyName: '合同会社MHLメディカル', companyNameKana: 'ゴウドウガイシャエムエイチエルメディカル',
        type: 'corp', repName: '橋本 恵子', repNameKana: 'ハシモト ケイコ', staffName: '',
        phoneNumber: '045-1111-2222', email: 'hashimoto@mhl-med.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'hashimoto@mhl-med.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '20110301', status: 'active',
        accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1111222233330',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
    },
    {
        id: 'MUK-f0000014-0014-4000-8000-000000000014', uuid: 'f0000014-0014-4000-8000-000000000014',
        clientCode: 'MUK', companyName: '個人事業 MUKU工房', companyNameKana: 'コジンジギョウ ムクコウボウ',
        type: 'individual', repName: '村上 翔太', repNameKana: 'ムラカミ ショウタ', staffName: '',
        phoneNumber: '090-7777-8888', email: 'murakami@muku.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'murakami@muku.jp' },
        fiscalMonth: 12, fiscalDay: '末日', industry: '製造業', establishedDate: '20230401', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
        taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
        isInvoiceRegistered: false, invoiceRegistrationNumber: '',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 15000, bookkeepingFee: 8000, settlementFee: 50000, taxFilingFee: 0,
    },
    {
        id: 'NDF-f0000015-0015-4000-8000-000000000015', uuid: 'f0000015-0015-4000-8000-000000000015',
        clientCode: 'NDF', companyName: '株式会社NDFネットワーク', companyNameKana: 'カブシキガイシャエヌディーエフネットワーク',
        type: 'corp', repName: '岡田 浩二', repNameKana: 'オカダ コウジ', staffName: '',
        phoneNumber: '03-5555-0000', email: 'okada@ndf-net.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'okada@ndf-net.co.jp' },
        fiscalMonth: 3, fiscalDay: '末日', industry: '情報通信業', establishedDate: '20070901', status: 'active',
        accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555000066660',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 45000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
    },
    {
        id: 'NOV-f0000016-0016-4000-8000-000000000016', uuid: 'f0000016-0016-4000-8000-000000000016',
        clientCode: 'NOV', companyName: '株式会社NOVトラベル', companyNameKana: 'カブシキガイシャノブトラベル',
        type: 'corp', repName: '吉田 亮', repNameKana: 'ヨシダ リョウ', staffName: '',
        phoneNumber: '06-8888-9999', email: 'yoshida@nov-travel.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'yoshida@nov-travel.co.jp' },
        fiscalMonth: 6, fiscalDay: '末日', industry: 'サービス業', establishedDate: '20190101', status: 'active',
        accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
        simplifiedTaxCategory: 5, taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T8888999900002',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 30000, bookkeepingFee: 15000, settlementFee: 120000, taxFilingFee: 60000,
    },
    {
        id: 'QRN-f0000017-0017-4000-8000-000000000017', uuid: 'f0000017-0017-4000-8000-000000000017',
        clientCode: 'QRN', companyName: '有限会社QRNプランニング', companyNameKana: 'ユウゲンガイシャキューアールエヌプランニング',
        type: 'corp', repName: '藤井 恵', repNameKana: 'フジイ メグミ', staffName: '',
        phoneNumber: '052-0000-1111', email: 'fujii@qrn-plan.co.jp', chatRoomUrl: '',
        contact: { type: 'email', value: 'fujii@qrn-plan.co.jp' },
        fiscalMonth: 9, fiscalDay: '末日', industry: '建設業', establishedDate: '20030601', status: 'active',
        accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
        taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
        isInvoiceRegistered: true, invoiceRegistrationNumber: 'T0000111100002',
        hasDepartmentManagement: false, hasRentalIncome: false,
        advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
    },
]);

// =============================================
// Composable
// =============================================

export function useClients() {
    const route = useRoute();

    /** ルートパスまたはクエリパラメータから現在選択中のクライアントを動的に取得 */
    const currentClient = computed<{ code: string; name: string; uuid: string } | null>(() => {
        const path = route.path;
        // 1. /clients/:clientId/ パターンからclientId抽出（旧ページ互換）
        const match = path.match(/\/clients\/([^/]+)/);
        if (match && match[1]) {
            const clientId = match[1];
            const found = clients.value.find(c => c.clientCode.toLowerCase() === clientId.toLowerCase());
            if (found) return { code: found.clientCode, name: found.companyName, uuid: found.uuid };
        }
        // 2. クエリパラメータ ?client=UUID から取得（進捗管理→仕訳一覧遷移）
        const clientQuery = route.query.client;
        if (clientQuery && typeof clientQuery === 'string') {
            const found = clients.value.find(c => c.uuid === clientQuery);
            if (found) return { code: found.clientCode, name: found.companyName, uuid: found.uuid };
        }
        // 3. 該当なし → null（全体管理エリア: 進捗管理/顧問先管理/スタッフ管理等）
        return null;
    });

    return {
        clients,
        currentClient,
    };
}
