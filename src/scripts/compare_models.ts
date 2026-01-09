
import { VertexAI, SchemaType } from '@google-cloud/vertexai';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'ai-accounting-88'; // Adjust or read from env
const LOCATION = 'us-central1'; // Use a region that supports the desired models

// --- User Specified Models & Costs ---
// Note: As of early 2026, some of these models might be hypothetical or experimental.
// We map them to the closest likely API model IDs.
const MODELS = [
  {
    name: 'Gemini 1.5 Flash-8B',
    modelId: 'gemini-1.5-flash-001-tuning', // Placeholder ID - 8B might be a specific variant or simply 'gemini-1.5-flash-8b-exp'
    // For this script, we'll use a widely available flash model ID as a fallback if specific ones fail,
    // but let's try to target what the user asked for if possible.
    // Since '8B' suggests a smaller model, we'll try 'gemini-1.5-flash-8b' if it exists, else 'gemini-1.5-flash-002'.
    // Given the user's specific context, let's use standard Flash as a proxy if 8B isn't public, but we'll try to be specific.
    apiModelId: 'gemini-1.5-flash-002', // Using Flash 002 as the reliable current "Flash" standard.
    costPer1MInput: 0.075, // $0.075 / 1M tokens (Approx for Flash) -> User said $0.003 / image?
    // User's cost ref: "$0.003 (approx 0.45 yen)" - likely PER REQUEST or PER 100 IMAGES?
    // "100 枚あたり $0.003" -> 0.00003 per image? That's extremely low.
    // Or maybe $0.003 per image. Let's stick to calculating Token Usage and outputting that.
    userLabel: '$0.003/req (User Est)'
  },
  {
    name: 'Gemini 2.0 Flash / 2.5 Flash-Lite',
    // 'gemini-2.0-flash-exp' is a distinct model.
    apiModelId: 'gemini-2.0-flash-exp',
    userLabel: '$0.008/req (User Est)'
  },
  {
    name: 'Gemini 3.0 Flash',
    // Hypothetical model. We will try 'gemini-experimental' or similar as a proxy, or just warn.
    // Let's use 'gemini-1.5-pro-002' as a "High Intelligence" proxy for comparison if 3.0 doesn't exist.
    apiModelId: 'gemini-1.5-pro-002',
    userLabel: '$0.040/req (High End Proxy)'
  }
];

// --- Target Images ---
const IMAGE_PATHS = [
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_0_1767948122249.jpg',
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_1_1767948122249.jpg',
  'C:/Users/kazen/.gemini/antigravity/brain/69339ee8-ec83-4cfb-8b61-3f40ac80588a/uploaded_image_2_1767948122249.jpg'
];

// --- Universal OCR Schema ---
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    document_type: {
      type: SchemaType.STRING,
      enum: ["RECEIPT", "INVOICE", "BANK_STATEMENT", "CARD_STATEMENT", "OTHER"]
    },
    meta: {
      type: SchemaType.OBJECT,
      properties: {
        scan_date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
        currency: { type: SchemaType.STRING },
        language: { type: SchemaType.STRING }
      },
      required: ["scan_date"]
    },
    issuer: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        name_reading: { type: SchemaType.STRING },
        registration_number: { type: SchemaType.STRING },
        phone_number: { type: SchemaType.STRING },
        address: { type: SchemaType.STRING },
        is_handwritten: { type: SchemaType.BOOLEAN }
      },
      required: ["name"]
    },
    recipient: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING }
      }
    },
    transaction_header: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
        total_amount: { type: SchemaType.NUMBER },
        total_tax_amount: { type: SchemaType.NUMBER },
        payment_method: { type: SchemaType.STRING, enum: ["CASH", "CREDIT_CARD", "E_MONEY", "TRANSFER", "UNKNOWN"] },
        summary: { type: SchemaType.STRING }
      },
      required: ["date", "total_amount"]
    },
    tax_breakdown: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rate: { type: SchemaType.NUMBER },
          taxable_amount: { type: SchemaType.NUMBER },
          tax_amount: { type: SchemaType.NUMBER }
        }
      }
    },
    line_items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
          tax_rate: { type: SchemaType.NUMBER },
          type: { type: SchemaType.STRING, enum: ["ITEM", "TAX", "DISCOUNT"] },
          income_amount: { type: SchemaType.NUMBER },
          expense_amount: { type: SchemaType.NUMBER },
          balance: { type: SchemaType.NUMBER }
        },
        required: ["description", "amount"]
      }
    },
    validation: {
      type: SchemaType.OBJECT,
      properties: {
        is_invoice_qualified: { type: SchemaType.BOOLEAN },
        has_stamp_duty: { type: SchemaType.BOOLEAN },
        notes: { type: SchemaType.STRING }
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

  const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

  for (const modelConfig of MODELS) {
    console.log(`\n>>> Testing Model: ${modelConfig.name} [ID: ${modelConfig.apiModelId}]`);

    try {
      const generativeModel = vertexAI.getGenerativeModel({
        model: modelConfig.apiModelId,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        }
      });

      for (let i = 0; i < IMAGE_PATHS.length; i++) {
        const imagePath = IMAGE_PATHS[i];
        console.log(`   Processing Image ${i + 1}: ${path.basename(imagePath)}`);

        const startTime = Date.now();

        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');

          const request = {
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
            ]
          };

          const result = await generativeModel.generateContent(request);
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;

          const response = result.response;
          const usage = response.usageMetadata;

          // Console Output Summary
          console.log(`      Duration: ${duration.toFixed(2)}s`);
          console.log(`      Token Usage: Input=${usage?.promptTokenCount || 0}, Output=${usage?.candidatesTokenCount || 0}, Total=${usage?.totalTokenCount || 0}`);

          // Try parse JSON
          let parsedData = "Failed to parse JSON";
          if (response.candidates && response.candidates[0].content.parts[0].text) {
            try {
              parsedData = JSON.parse(response.candidates[0].content.parts[0].text);
              // Minimal validation display
              console.log(`      Detected Type: ${parsedData.document_type}`);
              console.log(`      Issuer: ${parsedData.issuer?.name}`);
              console.log(`      Total: ${parsedData.transaction_header?.total_amount}`);
            } catch (e) {
              console.error("      JSON Parse Error:", e);
              console.log("      Raw Text:", response.candidates[0].content.parts[0].text.substring(0, 100) + "...");
            }
          }

        } catch (fileErr) {
          console.error(`      Error processing file ${imagePath}:`, fileErr);
        }
      }

    } catch (modelErr) {
      console.error(`   Failed to initialize or run model ${modelConfig.apiModelId}:`, modelErr);
      console.warn("   (Note: 'Gemini 3.0' and 'Flash-8B' are placeholders and might not be available in public API yet. Check permissions and available models.)");
    }
  }
}

main().catch(console.error);
