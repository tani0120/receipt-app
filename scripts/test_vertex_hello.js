/**
 * Phase 6.3 Step 1.5: Hello Vertex
 * 目的: Vertex AI基盤検証（認証・IAM・リージョン・SDK）
 *
 * 検証項目:
 * 1. ADC認証が動作するか
 * 2. asia-northeast1リージョンに接続できるか
 * 3. gemini-2.0-flash-expモデルが利用できるか
 * 4. レスポンスが正常に返るか
 */
import { VertexAI } from '@google-cloud/vertexai';
async function testVertexAI() {
    console.log('=== Phase 6.3 Step 1.5: Hello Vertex ===');
    console.log('開始時刻:', new Date().toISOString());
    try {
        // Step 1: Vertex AI初期化
        console.log('\n[1/4] Vertex AI初期化...');
        const vertexAI = new VertexAI({
            project: 'sugu-suru',
            location: 'asia-northeast1'
        });
        console.log('✅ プロジェクト: sugu-suru');
        console.log('✅ リージョン: asia-northeast1');
        // Step 2: モデル取得
        console.log('\n[2/4] モデル取得...');
        const model = vertexAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp'
        });
        console.log('✅ モデル: gemini-2.0-flash-exp');
        // Step 3: テストリクエスト送信
        console.log('\n[3/4] テストリクエスト送信...');
        const prompt = 'Hello Vertex AI! Please respond with "OK".';
        console.log('プロンプト:', prompt);
        const result = await model.generateContent(prompt);
        console.log('✅ リクエスト成功');
        // Step 4: レスポンス検証
        console.log('\n[4/4] レスポンス検証...');
        const responseText = result.response.text();
        console.log('レスポンス:', responseText);
        if (responseText && responseText.length > 0) {
            console.log('✅ レスポンス正常');
        }
        else {
            console.error('❌ レスポンスが空');
            process.exit(1);
        }
        // 成功
        console.log('\n=== ✅ Step 1.5 完了 ===');
        console.log('終了時刻:', new Date().toISOString());
        console.log('\n検証結果:');
        console.log('✅ ADC認証: 成功');
        console.log('✅ IAMロール: 成功');
        console.log('✅ リージョン接続: 成功');
        console.log('✅ SDK導線: 成功');
        console.log('\n👉 Vertex AI基盤構築完了');
    }
    catch (error) {
        console.error('\n=== ❌ エラー発生 ===');
        console.error('エラー詳細:', error);
        if (error instanceof Error) {
            console.error('メッセージ:', error.message);
            console.error('スタック:', error.stack);
        }
        console.log('\n⚠️ トラブルシューティング:');
        console.log('1. ADC設定確認: gcloud auth application-default login');
        console.log('2. プロジェクト確認: gcloud config get-value project');
        console.log('3. API有効化確認: gcloud services list --enabled | grep aiplatform');
        process.exit(1);
    }
}
// 実行
testVertexAI();
