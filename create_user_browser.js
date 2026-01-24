/**
 * Firebase Authenticationにユーザーを作成するスクリプト
 *
 * 実行方法:
 * 1. ブラウザでローカルアプリを開く
 * 2. F12でコンソールを開く
 * 3. このコードをコピー＆ペースト
 */

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const email = 'admin@sugu-suru.com';
const password = 'tani0120';

createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        console.log('✅ ユーザーを作成しました:', userCredential.user.email);
        console.log('  UID:', userCredential.user.uid);
    })
    .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
            console.log('✅ ユーザーは既に存在します:', email);
            console.log('  パスワードを確認してください。');
        } else {
            console.error('❌ エラー:', error.code, error.message);
        }
    });
