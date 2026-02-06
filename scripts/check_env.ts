/**
 * 環境確認スクリプト
 *
 * 実API実装前に必要な環境が整っているか確認
 *
 * 実行:
 * npx tsx scripts/check_env.ts
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// .env.localを明示的に読み込み
config({ path: path.resolve(process.cwd(), '.env.local') });

function checkEnvironment() {
    console.log('🔍 環境確認開始...\n');

    let hasError = false;

    // 1. API Key確認（フォールバック対応）
    const API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('❌ GEMINI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
        console.log('   .env.local に以下を追加してください:');
        console.log('   GEMINI_API_KEY=your_api_key_here\n');
        hasError = true;
    } else {
        console.log('✅ API Key 設定済み\n');
    }

    // 2. パッケージ確認
    try {
        require.resolve('@google/generative-ai');
        console.log('✅ @google/generative-ai インストール済み\n');
    } catch {
        console.error('❌ @google/generative-ai が未インストール');
        console.log('   以下を実行してください:');
        console.log('   npm install @google/generative-ai\n');
        hasError = true;
    }

    // 3. テスト画像確認（警告のみ）
    const testImagePath = path.resolve(process.cwd(), 'test_receipt_001.jpg');
    if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️  test_receipt_001.jpg が存在しません');
        console.log('   テスト実行時にエラーになる可能性があります\n');
        // hasError = true にはしない（画像なしでも環境確認はOK）
    } else {
        console.log('✅ test_receipt_001.jpg 存在確認\n');
    }

    // 4. マスタファイル確認
    const masterPath = path.resolve(process.cwd(), 'data/masters/CL-001/cache_master_CL-001.txt');
    if (!fs.existsSync(masterPath)) {
        console.error('❌ cache_master_CL-001.txt が存在しません');
        console.log(`   パス: ${masterPath}\n`);
        hasError = true;
    } else {
        console.log('✅ cache_master_CL-001.txt 存在確認\n');
    }

    if (hasError) {
        console.error('❌ 環境確認失敗。上記のエラーを修正してください。');
        throw new Error('Environment check failed');
    }

    console.log('✅ 環境確認完了\n');
}

// 実行
try {
    checkEnvironment();
} catch (error) {
    process.exit(1);
}
