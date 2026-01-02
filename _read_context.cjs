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
                if (row.some(c => c !== "")) console.log(row.join(" | "));
            });
        }
    } catch (e) { console.error(e.message); }
});
