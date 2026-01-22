# ADR-010-Part2: 実装手順

**親ドキュメント**: [ADR-010](./ADR-010-ai-api-migration.md)

---

## ディレクトリ構成

```
src/
├── services/
│   ├── ai/
│   │   ├── AIServiceInterface.ts       # インターフェース定義
│   │   ├── GeminiAPIService.ts         # Gemini API実装
│   │   ├── VertexAIService.ts          # Vertex AI実装
│   │   ├── createAIService.ts          # ファクトリー関数
│   │   └── types.ts                    # 型定義

functions/（本番移行時）
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── analyzeReceipt.ts     # Vertex AI呼び出し
│   └── types.ts              # 型定義
├── package.json
└── tsconfig.json
```

---

## ステップ1: 型定義（types.ts）

**ファイル**: `src/services/ai/types.ts`

```typescript
export type ReceiptAnalysisResult = {
  店名: string;
  日付: string; // YYYY-MM-DD
  金額: number;
  内容: string;
  推奨勘定科目: string;
  信頼度: number; // 0.0-1.0
};

export type AnalysisError = {
  code: 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'AUTH_ERROR';
  message: string;
  details?: unknown;
};
```

---

## ステップ2: インターフェース（AIServiceInterface.ts）

**ファイル**: `src/services/ai/AIServiceInterface.ts`

```typescript
import type { ReceiptAnalysisResult } from './types';

export interface AIServiceInterface {
  analyzeReceipt(imageFile: File): Promise<ReceiptAnalysisResult>;
  isInitialized(): boolean;
  getServiceName(): string; // 'GeminiAPI' | 'VertexAI'
}
```

---

## ステップ3: Gemini API実装（テスト環境用）

**ファイル**: `src/services/ai/GeminiAPIService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIServiceInterface } from './AIServiceInterface';
import type { ReceiptAnalysisResult, AnalysisError } from './types';

export class GeminiAPIService implements AIServiceInterface {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.length === 0) {
      throw new Error('Gemini API Key が設定されていません');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeReceipt(imageFile: File): Promise<ReceiptAnalysisResult> {
    try {
      const imageBase64 = await this.fileToBase64(imageFile);
      const base64Data = imageBase64.split(',')[1];

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash'
      });

      const prompt = `
この領収書を解析し、以下のJSON形式で返してください。
日付はYYYY-MM-DD形式で返してください。

{
  "店名": "店舗名",
  "日付": "YYYY-MM-DD",
  "金額": 1234,
  "内容": "購入した商品の説明",
  "推奨勘定科目": "消耗品費",
  "信頼度": 0.95
}
`;

      const result = await model.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                data: base64Data, 
                mimeType: imageFile.type || 'image/jpeg'
              } 
            }
          ]
        }]
      });

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('JSON形式のレスポンスが見つかりません');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText) as ReceiptAnalysisResult;

      this.validateResult(parsed);
      return parsed;

    } catch (error) {
      console.error('[GeminiAPIService] エラー:', error);
      throw this.handleError(error);
    }
  }

  isInitialized(): boolean {
    return !!this.apiKey;
  }

  getServiceName(): string {
    return 'GeminiAPI';
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private validateResult(result: ReceiptAnalysisResult): void {
    if (!result.店名) throw new Error('店名が取得できません');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result.日付)) throw new Error('日付形式不正');
    if (typeof result.金額 !== 'number') throw new Error('金額が不正');
    if (result.信頼度 < 0 || result.信頼度 > 1) throw new Error('信頼度が不正');
  }

  private handleError(error: unknown): AnalysisError {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return { code: 'AUTH_ERROR', message: 'API Keyが無効', details: error };
      }
      if (error.message.includes('network')) {
        return { code: 'NETWORK_ERROR', message: 'ネットワークエラー', details: error };
      }
      if (error.message.includes('JSON')) {
        return { code: 'PARSE_ERROR', message: 'レスポンス解析失敗', details: error };
      }
    }
    return { code: 'API_ERROR', message: 'AI解析失敗', details: error };
  }
}
```

---

## ステップ4: Vertex AI実装（本番環境用）

**ファイル**: `src/services/ai/VertexAIService.ts`

```typescript
import type { AIServiceInterface } from './AIServiceInterface';
import type { ReceiptAnalysisResult, AnalysisError } from './types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

export class VertexAIService implements AIServiceInterface {
  private functions = getFunctions();
  private auth = getAuth();

  async analyzeReceipt(imageFile: File): Promise<ReceiptAnalysisResult> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('認証が必要です');
      }

      const imageBase64 = await this.fileToBase64(imageFile);
      const base64Data = imageBase64.split(',')[1];

      const analyzeReceipt = httpsCallable<
        { imageBase64: string; mimeType: string },
        ReceiptAnalysisResult
      >(this.functions, 'analyzeReceipt');

      const result = await analyzeReceipt({
        imageBase64: base64Data,
        mimeType: imageFile.type || 'image/jpeg'
      });

      if (!result.data) {
        throw new Error('Cloud Functionsからレスポンスなし');
      }

      return result.data;

    } catch (error) {
      console.error('[VertexAIService] エラー:', error);
      throw this.handleError(error);
    }
  }

  isInitialized(): boolean {
    return !!this.auth.currentUser;
  }

  getServiceName(): string {
    return 'VertexAI';
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private handleError(error: unknown): AnalysisError {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return { code: 'AUTH_ERROR', message: '再ログインしてください', details: error };
      }
      if (error.message.includes('network')) {
        return { code: 'NETWORK_ERROR', message: 'ネットワークエラー', details: error };
      }
    }
    return { code: 'API_ERROR', message: 'AI解析失敗', details: error };
  }
}
```

---

## ステップ5: ファクトリー関数（createAIService.ts）

**ファイル**: `src/services/ai/createAIService.ts`

```typescript
import type { AIServiceInterface } from './AIServiceInterface';
import { GeminiAPIService } from './GeminiAPIService';
import { VertexAIService } from './VertexAIService';

export function createAIService(): AIServiceInterface {
  const useVertexAI = import.meta.env.VITE_USE_VERTEX_AI === 'true';

  if (useVertexAI) {
    console.log('[AI Service] Vertex AI（本番）を使用');
    return new VertexAIService();
  } else {
    console.log('[AI Service] Gemini API（テスト）を使用');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY が未設定');
    }
    return new GeminiAPIService(apiKey);
  }
}
```

---

## ステップ6: Vueコンポーネントでの使用

**ファイル**: `src/components/ReceiptUpload.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { createAIService } from '@/services/ai/createAIService';
import type { ReceiptAnalysisResult } from '@/services/ai/types';

const aiService = createAIService();
const result = ref<ReceiptAnalysisResult | null>(null);
const error = ref<string | null>(null);
const isLoading = ref(false);

async function handleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  isLoading.value = true;
  error.value = null;

  try {
    console.log(`[${aiService.getServiceName()}] 解析中...`);
    result.value = await aiService.analyzeReceipt(file);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <h2>領収書アップロード</h2>
    <input type="file" accept="image/*" @change="handleUpload" :disabled="isLoading" />
    
    <div v-if="isLoading">解析中...</div>
    <div v-if="error" class="error">エラー: {{ error }}</div>
    
    <div v-if="result">
      <h3>解析結果</h3>
      <dl>
        <dt>店名</dt><dd>{{ result.店名 }}</dd>
        <dt>日付</dt><dd>{{ result.日付 }}</dd>
        <dt>金額</dt><dd>{{ result.金額.toLocaleString() }}円</dd>
        <dt>内容</dt><dd>{{ result.内容 }}</dd>
        <dt>勘定科目</dt><dd>{{ result.推奨勘定科目 }}</dd>
        <dt>信頼度</dt><dd>{{ (result.信頼度 * 100).toFixed(1) }}%</dd>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.error { color: red; }
</style>
```

---

## ステップ7: 環境変数設定

**`.env.local`（テスト環境）**:
```bash
VITE_USE_VERTEX_AI=false
VITE_GEMINI_API_KEY=AIzaSy...
```

**`.env.production`（本番環境）**:
```bash
VITE_USE_VERTEX_AI=true
# VITE_GEMINI_API_KEY は不要
```

**`.gitignore`に追加**:
```
.env.local
.env.production
.env*.local
```

---

## ステップ8: 依存関係インストール

```bash
npm install @google/generative-ai
```

---

## Cloud Functions実装（本番移行時のみ）

**ファイル**: `functions/src/analyzeReceipt.ts`

```typescript
import * as functions from 'firebase-functions';
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || 'your-project',
  location: 'us-central1',
});

export const analyzeReceipt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
  }

  const { imageBase64, mimeType } = data;

  const model = vertexAI.preview.getGenerativeModel({
    model: 'gemini-1.5-flash',
  });

  const prompt = `
この領収書を解析し、以下のJSON形式で返してください。

{
  "店名": "店舗名",
  "日付": "YYYY-MM-DD",
  "金額": 1234,
  "内容": "説明",
  "推奨勘定科目": "消耗品費",
  "信頼度": 0.95
}
`;

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } }
      ]
    }]
  });

  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
});
```

---

## 次に読むドキュメント

→ [ADR-010-Part3: チェックリスト](./ADR-010-Part3-checklist.md)
