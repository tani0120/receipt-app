import { config } from 'dotenv';
import path from 'path';

// .env.localを明示的に読み込み
const result = config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('=== dotenv result ===');
console.log(result);
console.log('\n=== Environment Variables ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY);
console.log('\n=== All env keys containing GEMINI ===');
Object.keys(process.env).filter(k => k.includes('GEMINI')).forEach(k => {
    console.log(`${k}: ${process.env[k]?.substring(0, 20)}...`);
});
