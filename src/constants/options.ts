
export const TAX_OPTIONS = [
    { label: '課税売上 10%', value: 'tax_10', rate: 0.1, code: '110', type: 'sales' },
    { label: '軽減税率 8%', value: 'tax_8', rate: 0.08, code: '108', type: 'sales' },
    { label: '非課税売上', value: 'tax_free', rate: 0, code: 'TAX_SALES_NONE', type: 'sales' },
    { label: '課税仕入 10%', value: 'purchase_10', rate: 0.1, code: 'TAX_PURCHASE_10', type: 'purchase' },
    { label: '課税仕入 8%', value: 'purchase_8', rate: 0.08, code: 'TAX_PURCHASE_8', type: 'purchase' },
    { label: '対象外', value: 'none', rate: 0, code: 'TAX_PURCHASE_NONE', type: 'purchase' }
];
