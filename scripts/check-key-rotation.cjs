/**
 * サービスアカウントキー ローテーションチェッカー
 * npm run dev 実行時に自動で呼ばれる
 * キー作成から90日以上経過していたら警告を表示
 */
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.resolve(__dirname, '..', 'service-account-key.json');
const MAX_AGE_DAYS = 90;
const WARN_DAYS = 75; // 75日で事前警告

try {
  if (!fs.existsSync(KEY_PATH)) {
    console.warn('\n⚠️  service-account-key.json が見つかりません。Drive機能が動作しません。\n');
    process.exit(0);
  }

  const stat = fs.statSync(KEY_PATH);
  const createdAt = stat.birthtime || stat.ctime;
  const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const remainDays = MAX_AGE_DAYS - ageDays;

  if (ageDays >= MAX_AGE_DAYS) {
    console.error('\n' + '='.repeat(60));
    console.error('🚨 サービスアカウントキーが期限切れです（' + ageDays + '日経過）');
    console.error('   今すぐローテーションしてください:');
    console.error('');
    console.error('   gcloud iam service-accounts keys create service-account-key.json \\');
    console.error('     --iam-account=sugu-suru@gen-lang-client-0837543731.iam.gserviceaccount.com \\');
    console.error('     --project=gen-lang-client-0837543731');
    console.error('='.repeat(60) + '\n');
  } else if (ageDays >= WARN_DAYS) {
    console.warn('\n' + '-'.repeat(60));
    console.warn('⚠️  サービスアカウントキーの残り有効日数: ' + remainDays + '日');
    console.warn('   ' + MAX_AGE_DAYS + '日以内にローテーションしてください');
    console.warn('-'.repeat(60) + '\n');
  }
} catch (e) {
  // チェック失敗してもサーバー起動は止めない
}
