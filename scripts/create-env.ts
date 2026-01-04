
import fs from 'fs';
import path from 'path';

const content = `PORT=3000
ENABLE_REAL_FIRESTORE=true
ENABLE_REAL_GEMINI=true
USE_VERTEX_AI=true
GOOGLE_APPLICATION_CREDENTIALS=./certs/service-account.json
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=gen-lang-client-0837543731
FIREBASE_CLIENT_EMAIL=sugu-suru@gen-lang-client-0837543731.iam.gserviceaccount.com
`;

fs.writeFileSync(path.join(process.cwd(), '.env'), content, 'utf8');
console.log('.env created successfully');
