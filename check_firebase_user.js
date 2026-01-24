/**
 * Firebase Authenticationのユーザーを確認するスクリプト
 *
 * 実行方法:
 * node check_firebase_user.js
 */

const admin = require('firebase-admin');

// サービスアカウントキーのパスを確認
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin SDKを初期化
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkUser(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        console.log('✅ ユーザーが見つかりました:');
        console.log('  Email:', user.email);
        console.log('  UID:', user.uid);
        console.log('  作成日:', user.metadata.creationTime);
        console.log('  最終ログイン:', user.metadata.lastSignInTime);
        return true;
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('❌ ユーザーが見つかりません:', email);
            console.log('  Firebase Consoleで新しくユーザーを作成する必要があります。');
        } else {
            console.error('エラー:', error.message);
        }
        return false;
    }
}

// admin@sugu-suru.comを確認
checkUser('admin@sugu-suru.com')
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('予期しないエラー:', error);
        process.exit(1);
    });
