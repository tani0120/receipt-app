export const AI_PROMPTS = {
  WORKER: 'WORKER_PROMPT_CONTENT',
  LEARNER: 'LEARNER_PROMPT_CONTENT',
  UPDATER: 'UPDATER_PROMPT_CONTENT',
  BUILDER: 'BUILDER_PROMPT_CONTENT',
  OPTIMIZER: 'OPTIMIZER_PROMPT_CONTENT',
  AUDITOR: 'AUDITOR_PROMPT_CONTENT',
};

export const GAS_LOGIC_DEFINITIONS = {
  FILE_RESCUE: 'Logic for File Rescue',
  DEDUPLICATION: 'Logic for Deduplication',
  OUT_OF_PERIOD: 'Logic for Out of Period Check',
  KNOWLEDGE_INJECTION: 'Logic for Knowledge Injection',
  TAX_VALIDATION: 'Logic for Tax Validation',
  COMPLEMENT: 'Logic for System Complement',
  IMAGE_OPTIMIZATION: 'Logic for Image Optimization',
  WATCHDOG: 'Logic for Watchdog',
  TAX_TRANSLATION: 'Logic for Tax Translation',
  INFERENCE_LOGIC: 'Logic for Inference',
  DIFFERENCE_ANALYSIS: 'Logic for Difference Analysis',
  SANDWICH_DEFENSE: 'Logic for Sandwich Defense',
};

export const AI_LOGIC_MAP_TREE = [
  {
    id: 'L-001',
    label: '基本ロジック',
    children: [
      { id: 'L-001-A', label: '日付判定', children: [] },
      { id: 'L-001-B', label: '金額計算', children: [] }
    ]
  }
];

export const SOFTWARE_EXPORT_CSV_SCHEMAS = {
  YAYOI: { label: '弥生会計', columns: [] },
  FREEE: { label: 'freee', columns: [] },
  MF: { label: 'マネーフォワード', columns: [] }
};

export const SOFTWARE_TAX_MAPPINGS_TEXT = {
  YAYOI: '弥生会計の税区分マッピング定義...',
  FREEE: 'freeeの税区分マッピング定義...',
  MF: 'マネーフォワードの税区分マッピング定義...'
};

export const TAX_SCOPE_DEFINITIONS = "非課税取引の定義テキスト...";

export const SPECIFIC_RISK_RULES = "特定リスク判定ルールの定義テキスト...";
