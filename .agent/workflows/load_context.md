---
description: チャット開始時に設計書とルールを読み込む
---

// turbo-all
1. SESSION_START.md を読んで全体像を把握します。

以下のファイルを view_file ツールで開いて確認してください:
- `C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\docs\sessions\SESSION_START.md`

2. task.md を読んで現在のタスクを確認します。

現在の会話の brain/ ディレクトリ内にある task.md を view_file ツールで確認してください。
（会話IDごとに異なるため、具体的なパスは会話ID次第）

3. （任意）Excel設計書の読み込み

以下のスクリプトを作成・実行して、Excel設計書の内容（シート一覧と重要な定義シート）を読み込みます。

```javascript
/* _read_context.cjs */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
    "00_管理用_AI会計システム本体.xlsx",
    "10_実務用_ワークベンチ.xlsx"
];

console.log("\n【プロジェクト作業方針・ルール定義】");
console.log("1. 基本設計書の絶対視: 00_..., 10_... を正(Source of Truth)とする。");
console.log("2. 独自実装禁止: 設計書を無視した実装は禁止。");
console.log("3. 矛盾時は確認: 実装前に必ずユーザーへ告知・確認。");
console.log("4. 整合性の維持: 論理地図(Phase等)を意識しコメントに残す。");
console.log("5. 外部仕様の調査: 外部連携仕様は公式情報を裏付け調査する。\n");

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) return;

    try {
        const workbook = XLSX.readFile(fullPath);
        console.log(`\nFILE: ${file}`);
        console.log(`SHEETS: ${workbook.SheetNames.join(", ")}`);
        
        // 特定の重要シートがあれば一部を表示（コンテキスト圧縮のため全量ではない）
        const logicSheet = workbook.SheetNames.find(n => n.includes("98_ロジック"));
        if (logicSheet) {
             console.log(`--- Sheet: ${logicSheet} (抜粋) ---`);
             const sheet = workbook.Sheets[logicSheet];
             const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
             data.slice(0, 15).forEach(row => { // 最初の15行のみ
                if(row.some(c=>c!=="")) console.log(row.join(" | "));
             });
        }
    } catch(e) { console.error(e.message); }
});
```

`node _read_context.cjs` を実行して、設計書の構造とルールをメモリにロードします。

