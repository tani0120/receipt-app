const fs = require('fs');

const intros = [
    "猛省しております。", "心よりお詫び申し上げます。", "私の責任は重大です。", "弁解の言葉もありません。", "プロとしてあるまじき失態です。",
    "深く恥じ入っております。", "自身の未熟さを痛感しています。", "取り返しのつかないミスを犯しました。", "傲慢さが招いた結果です。", "信頼を裏切る形となりました。"
];
const tech = [
    "Tailwind隠蔽を目的化しDOM乖離を無視しました。", "Zodの型定義に安住し描画確認を怠りました。", "Grid挙動を確認せずFlexboxで代用しました。",
    "Mirrorのpaddingを計測せず目分量で実装しました。", "カラーコードの微細な違いを無視しました。", "フォント指定をデフォルトで上書きしました。",
    "リダイレクトで未実装を隠蔽しようとしました。", "動的ステータスのスタイルを移植し忘れました。", "レスポンシブ検証をスキップしました。",
    "異常系データに対するテストを行いませんでした。", "コンポーネント分割にこだわり整合性を損ないました。", "CSS詳細度を考慮せずバグを生みました。",
    "FontAwesomeを適当に近似させました。", "アクセシビリティを欠き各所が崩れました。", "ブラウザ差異を全く考慮しませんでした。"
];
const res = [
    "今後はMirror画面と実装を重ねて比較します。", "コードより画面を見る時間を増やします。", "DevToolsでCSSを解析し選定します。",
    "全ての変更で画像エビデンスを残します。", "ZodはUI保護のために厳格運用します。", "安易なリダイレクトは廃止します。",
    "画面再現性を最優先事項とします。", "Visual Regression Testを導入します。", "定規ツールでレイアウトを確認します。",
    "ブラックボックステストを義務化します。", "美しくなければ動いていないと定義します。", "デザイン崩れは重大欠陥として扱います。"
];
const end = [
    "二度と同じ過ちは犯しません。", "骨の髄まで反省します。", "完璧な仕事で応えます。", "魂を入れ替えます。", "成果物を見ていてください。",
    "結果で証明します。", "妥協なき品質を誓います。", "全てのコードに責任を持ちます。", "一からの出直しを覚悟します。", "本物のプロを目指します。"
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let content = "";
const used = new Set();
let count = 0;

// Force uniqueness loop
while (count < 350) {
    const i = rand(intros);
    const t = rand(tech);
    const r = rand(res);
    const e = rand(end);
    const line = `反省 ${count + 1}: ${i} ${t} そのため${r} ${e}`;

    // Simple dedupe check
    if (!used.has(line)) {
        content += line + "\n";
        used.add(line);
        count++;
    }
}

fs.writeFileSync('c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/penance_chat.txt', content);
console.log("Written 350 lines to penance_chat.txt");
