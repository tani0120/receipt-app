
import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'ai-accounting-88';
const LOCATION = 'us-central1';

const MODELS = [
  {
    name: 'Gemini 2.5 Flash',
    apiModelId: 'gemini-2.5-flash',
    userLabel: 'Flash (standard)'
  },
  {
    name: 'Gemini 2.5 Pro',
    apiModelId: 'gemini-2.5-pro',
    userLabel: 'Pro (high quality)'
  },
];

// --- Target Images ---
const IMAGE_PATHS = [
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_0_1767948122249.jpg',
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_1_1767948122249.jpg',
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_2_1767948122249.jpg'
];

// --- Universal OCR Schema ---
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      enum: ["RECEIPT", "INVOICE", "BANK_STATEMENT", "CARD_STATEMENT", "OTHER"]
    },
    meta: {
      type: Type.OBJECT,
      properties: {
        scan_date: { type: Type.STRING, description: "YYYY-MM-DD" },
        currency: { type: Type.STRING },
        language: { type: Type.STRING }
      },
      required: ["scan_date"]
    },
    issuer: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        name_reading: { type: Type.STRING },
        registration_number: { type: Type.STRING },
        phone_number: { type: Type.STRING },
        address: { type: Type.STRING },
        is_handwritten: { type: Type.BOOLEAN }
      },
      required: ["name"]
    },
    recipient: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING }
      }
    },
    transaction_header: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        total_amount: { type: Type.NUMBER },
        total_tax_amount: { type: Type.NUMBER },
        payment_method: { type: Type.STRING, enum: ["CASH", "CREDIT_CARD", "E_MONEY", "TRANSFER", "UNKNOWN"] },
        summary: { type: Type.STRING }
      },
      required: ["date", "total_amount"]
    },
    tax_breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rate: { type: Type.NUMBER },
          taxable_amount: { type: Type.NUMBER },
          tax_amount: { type: Type.NUMBER }
        }
      }
    },
    line_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          tax_rate: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ["ITEM", "TAX", "DISCOUNT"] },
          income_amount: { type: Type.NUMBER },
          expense_amount: { type: Type.NUMBER },
          balance: { type: Type.NUMBER }
        },
        required: ["description", "amount"]
      }
    },
    validation: {
      type: Type.OBJECT,
      properties: {
        is_invoice_qualified: { type: Type.BOOLEAN },
        has_stamp_duty: { type: Type.BOOLEAN },
        notes: { type: Type.STRING }
      },
      required: ["is_invoice_qualified"]
    }
  },
  required: ["document_type", "issuer", "transaction_header", "validation"]
};

// --- Execution Logic ---
async function main() {
  console.log('--- Starting Model Comparison Experiment ---');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Location: ${LOCATION}`);
  console.log(`Images: ${IMAGE_PATHS.length} files`);
  console.log('------------------------------------------\n');

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

  for (const modelConfig of MODELS) {
    console.log(`\n>>> Testing Model: ${modelConfig.name} [ID: ${modelConfig.apiModelId}]`);

    try {
      for (let i = 0; i < IMAGE_PATHS.length; i++) {
        const imagePath = IMAGE_PATHS[i];
        if (!imagePath) {
          console.error(`   ❌ IMAGE_PATHS[${i}] is undefined. Skipping.`);
          continue;
        }
        console.log(`   Processing Image ${i + 1}: ${path.basename(imagePath)}`);

        const startTime = Date.now();

        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');

          const result = await ai.models.generateContent({
            model: modelConfig.apiModelId,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: imageBase64,
                      mimeType: 'image/jpeg'
                    }
                  },
                  {
                    text: `Extract data from this accounting document according to the schema.
                                Pay attention to "Universal Logic Rules":
                                - Identify document_type accurately.
                                - For RECEIPTS, "line_items" are optional but preferred.
                                - For BANK/CARD STATEMENTS, "line_items" are MANDATORY (must extract all rows).
                                - Calculated fields like "is_invoice_qualified" should be determined by T-Number existence or amount < 30000.`
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
            },
          });

          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;

          const usage = result.usageMetadata;

          console.log(`      Duration: ${duration.toFixed(2)}s`);
          console.log(`      Token Usage: Input=${usage?.promptTokenCount || 0}, Output=${usage?.candidatesTokenCount || 0}, Total=${usage?.totalTokenCount || 0}`);

          const responseText = result.text ?? '';
          if (responseText) {
            try {
              const parsedData = JSON.parse(responseText) as Record<string, unknown>;
              console.log(`      Detected Type: ${parsedData['document_type']}`);
              const issuer = parsedData['issuer'];
              if (issuer !== null && typeof issuer === 'object' && !Array.isArray(issuer)) {
                console.log(`      Issuer: ${(issuer as Record<string, unknown>)['name']}`);
              }
              const txHeader = parsedData['transaction_header'];
              if (txHeader !== null && typeof txHeader === 'object' && !Array.isArray(txHeader)) {
                console.log(`      Total: ${(txHeader as Record<string, unknown>)['total_amount']}`);
              }
            } catch (e) {
              console.error('      JSON Parse Error:', e);
              console.log('      Raw Text:', responseText.substring(0, 100) + '...');
            }
          }

        } catch (fileErr) {
          console.error(`      Error processing file ${imagePath}:`, fileErr);
        }
      }

    } catch (modelErr) {
      console.error(`   Failed to initialize or run model ${modelConfig.apiModelId}:`, modelErr);
    }
  }
}

main().catch(console.error);
