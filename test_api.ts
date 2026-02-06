/**
 * テストAPI実行スクリプト
 *
 * 実API実装の動作確認用（1回実行）
 *
 * 実行:
 * npx tsx test_api.ts
 */

import { executeOCR } from './src/api/gemini/ocr_service';

async function test() {
    console.log('🚀 実API実行テスト開始...\n');

    try {
        const result = await executeOCR({
            client_id: 'CL-001',
            image_path: './test_receipt_001.jpg'
        });

        console.log('\n✅ OCR実行成功\n');
        console.log('--- 結果JSON ---');
        console.log(JSON.stringify(result, null, 2));
        console.log('---------------\n');

        // Done Definition確認
        console.log('📋 Done Definition確認:');
        console.log(`  ✓ category: ${result.category}`);
        console.log(`  ✓ vendor: ${result.vendor}`);
        console.log(`  ✓ date: ${result.date}`);
        console.log(`  ✓ total_amount: ${result.total_amount}`);
        console.log(`  ✓ t_number: ${result.t_number || '(なし)'}`);
        console.log(`  ✓ tax_items: ${result.tax_items.length}件`);
        console.log(`  ✓ errors: ${result.errors.length}件`);
        console.log(`  ✓ balance_check: ${result.audit_results.balance_check}`);

    } catch (error) {
        console.error('\n❌ OCR実行失敗:', error);
        process.exit(1);
    }
}

test();
