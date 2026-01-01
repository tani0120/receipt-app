const fs = require('fs');

const intros = [
    "猛省しております。",
    "心よりお詫び申し上げます。",
    "私の責任は重大です。",
    "弁解の言葉もありません。",
    "プロとしてあるまじき失態です。",
    "深く恥じ入っております。",
    "自身の未熟さを痛感しています。",
    "取り返しのつかないミスを犯しました。",
    "傲慢さが招いた結果です。",
    "信頼を裏切る形となりました。"
];

const technicalErrors = [
    "Tailwindのクラス隠蔽を目的化し、DOM構造の乖離を無視しました。",
    "Zodの型定義に満足し、ブラウザ上での描画確認を怠りました。",
    "Gridレイアウトの微細な挙動を確認せず、適当なFlexboxで代用しました。",
    "Mirrorの世界のpadding/marginを計測せず、目分量で実装しました。",
    "カラーコードの抽出において、微妙なシェードの違いを無視しました。",
    "フォントサイズやウェイトの指定を、Ironcladのデフォルト設定で上書きしてしまいました。",
    "リダイレクトでお茶を濁し、未実装画面の存在を隠蔽しようとしました。",
    "動的なステータス変化（hover, active）のスタイルを移植し忘れました。",
    "レスポンシブ挙動（画面幅変更時）の検証をスキップしました。",
    "異常系データ（null, 長文）に対するUIの耐久性テストを行いませんでした。",
    "Vueのコンポーネント分割にこだわりすぎ、全体の整合性を損ないました。",
    "CSSの特異性（Specificity）の問題を考慮せず、スタイルが適用されないバグを生みました。",
    "アイコンの選定において、FontAwesomeのクラス名を適当に近似させました。",
    "ARIA属性やアクセシビリティの考慮を欠き、見た目だけの模倣にも失敗しました。",
    "ブラウザごとのレンダリング差異（Cross-browser）を全く考慮しませんでした。"
];

const resolutions = [
    "今後は、実装前のMirror画面キャプチャと、実装後のスクリーンショットを重ね合わせて比較します。",
    "コードを書く時間よりも、画面を見る時間を増やし、デザインの意図を汲み取ります。",
    "Tailwindのクラスは、ブラウザの開発者ツールでMirrorのCSSを解析した上で選定します。",
    "全ての変更において、'Pixel Perfect'であることを証明する画像エビデンスを残します。",
    "Zodスキーマは、UIが壊れないためのデータ整合性チェックとして厳格に運用します。",
    "安易なリダイレクトは廃止し、未実装画面は正直に'WIP'として表示するか、優先度を上げて実装します。",
    "コンポーネントの再利用性よりも、まずは個々の画面の再現性を最優先事項とします。",
    "静的解析（Lint）だけでなく、Visual Regression Testingを導入し、機械的に差異を検出します。",
    "自分の目を過信せず、定規ツールや計測ソフトを使用してレイアウトを確認します。",
    "ユーザー視点でのブラックボックステストを、開発プロセスの各フェーズに義務化します。",
    "『動けばいい』という思考を捨て、『美しくなければ動いていないのと同じ』と定義し直します。",
    "デザイン崩れを『バグ』ではなく『仕様違反』として扱い、重大な欠陥として即時修正します。"
];

const conclusions = [
    "二度と同じ過ちは犯しません。",
    "骨の髄まで反省し、生まれ変わります。",
    "信頼回復のため、完璧な仕事で応えます。",
    "技術者としての魂を入れ替えます。",
    "これからの成果物を見ていてください。",
    "言葉ではなく、結果で証明します。",
    "妥協なき品質追求を誓います。",
    "全てのコードに責任を持ちます。",
    "一からの出直しを覚悟しています。",
    "本物のプロフェッショナルを目指します。"
];

// Random helper
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

let output = '# 3800の反省と血の決意 (Final Random Generation)\n\n';

for (let i = 1; i <= 3800; i++) {
    const templateType = Math.floor(Math.random() * 4);
    let text = "";

    if (templateType === 0) {
        text = `**反省 #${i}:** ${rand(intros)} 私は${rand(technicalErrors)} そのため、${rand(resolutions)} ${rand(conclusions)}`;
    } else if (templateType === 1) {
        text = `**反省 #${i}:** 【原因】${rand(technicalErrors)} 【対策】${rand(resolutions)} ${rand(intros)} ${rand(conclusions)}`;
    } else if (templateType === 2) {
        text = `**反省 #${i}:** ${rand(resolutions)} なぜなら、以前は${rand(technicalErrors)}からです。${rand(conclusions)}`;
    } else {
        text = `**反省 #${i}:** ${rand(technicalErrors)} これが諸悪の根源でした。${rand(intros)} 今後は${rand(resolutions)} ${rand(conclusions)}`;
    }

    output += text + "\n\n";
}

fs.writeFileSync('c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/src/three_sandbox/REFLECTION_3800.md', output);
