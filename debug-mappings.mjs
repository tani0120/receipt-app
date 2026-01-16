// デバッグ用テストスクリプト
import { Mappings } from './src/mappings/ocr-to-accounting';

console.log('Mappings keys:', Object.keys(Mappings));
console.log('GeminiToYayoi exists:', 'GeminiToYayoi' in Mappings);
console.log('Mappings:', Mappings);
