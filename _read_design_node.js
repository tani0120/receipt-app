
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { readFile, utils } = XLSX;
import * as fs from 'fs';
import * as path from 'path';

// Using ES modules style as per package.json type: module
const targetFile = "00_管理用_AI会計システム本体.xlsx";
const logFile = "design_dump.txt";

fs.writeFileSync(logFile, `Scanning ${targetFile} for Folder/Path definitions...\n`);

const fullPath = path.resolve(process.cwd(), targetFile);

if (fs.existsSync(fullPath)) {
  try {
    const workbook = readFile(fullPath);
    const keywords = ["フォルダ", "保存", "パス", "Path", "Folder", "Directory", "Drive"];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let sheetHasMatch = false;
      let sheetOutput = `\n--- SHEET: ${sheetName} ---\n`;

      data.forEach((row, rowIndex) => {
        const rowStr = row.join(" | ");
        if (keywords.some(k => rowStr.includes(k))) {
          sheetOutput += `[Row ${rowIndex + 1}] ${rowStr}\n`;
          sheetHasMatch = true;
        }
      });

      if (sheetHasMatch) {
        fs.appendFileSync(logFile, sheetOutput);
      }
    });

    console.log("Scan complete. Results saved to " + logFile);
  } catch (e) {
    console.error("Error reading Excel:", e);
    fs.appendFileSync(logFile, `Error reading Excel: ${e.message}\n`);
  }
} else {
  console.error("File not found:", fullPath);
  fs.appendFileSync(logFile, `File not found: ${fullPath}\n`);
}
