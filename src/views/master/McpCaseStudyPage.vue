<template>
  <div ref="pageRef" class="page" @scroll="handleScroll">
    <div class="page-header">
      <h1 class="page-title">🎓 税理士向け MCP活用事例セミナー</h1>
      <p class="page-sub">2026年6月 税理士向けMCP活用セミナーで紹介された5つの事例と実装イメージ</p>
    </div>

    <!-- 目次ナビゲーション -->
    <nav class="toc">
      <h2 class="toc-title">📑 目次</h2>
      <div class="toc-grid">
        <a v-for="sec in sections" :key="sec.id" href="javascript:void(0)" class="toc-item" :class="sec.tocClass" @click="scrollToSection(sec.id)">
          <span class="toc-icon">{{ sec.icon }}</span>
          <span class="toc-label">{{ sec.label }}</span>
        </a>
      </div>
    </nav>

    <div class="page-body">

      <!-- ============================================ -->
      <!-- 事例1: 仕訳入力 -->
      <!-- ============================================ -->
      <section :id="sec1.id" class="card card--blue">
        <h2 class="card-title">{{ sec1.icon }} 事例1: 仕訳入力</h2>
        <p class="card-lead">普通に仕訳をAIに依頼 = 他のAIによるダブルチェック</p>

        <div class="feature-box">
          <h3 class="feature-heading">💡 コンセプト</h3>
          <ul class="feature-list">
            <li>人間が作成した仕訳をAIに依頼してダブルチェックする</li>
            <li>AIが別の視点で仕訳内容を検証し、誤りを指摘する</li>
            <li>MCP経由でMFの仕訳帳から取得 → AIが検証 → 修正提案</li>
          </ul>
        </div>

        <div class="feature-box">
          <h3 class="feature-heading">📄 JSON形式（仕訳データ構造）</h3>
          <div class="table-scroll">
            <table class="tbl">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>借方</th>
                  <th>貸方</th>
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1/1</td>
                  <td class="cell-debit">100</td>
                  <td></td>
                  <td>接待交際費 / 鳥貴族 谷町四丁目店</td>
                </tr>
                <tr>
                  <td>1/1</td>
                  <td></td>
                  <td class="cell-credit">100</td>
                  <td>現金</td>
                </tr>
                <tr class="row-tax">
                  <td></td>
                  <td class="cell-debit">20</td>
                  <td></td>
                  <td>消費税（仮払消費税）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flow-diagram">
          <div class="flow-step">📥 MF仕訳帳<br>getJournals</div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">🤖 AIダブルチェック<br>科目・金額・税区分</div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">📝 修正提案<br>承認→putJournals</div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- 事例2: 仕訳チェック -->
      <!-- ============================================ -->
      <section :id="sec2.id" class="card card--purple">
        <h2 class="card-title">{{ sec2.icon }} 事例2: 仕訳チェック（ルールベース + AI）</h2>
        <p class="card-lead">写真のチェックリストをAIが実施し、AIの所感を書く。顧問先別にルールをカスタマイズ。</p>

        <div class="feature-box">
          <h3 class="feature-heading">🔧 チェックフロー</h3>
          <div class="check-flow">
            <div class="check-step">
              <div class="check-num">1</div>
              <div class="check-content">
                <strong>ルールID + 指摘内容 + 修正提案</strong>
                <p>各仕訳に対してルールベースのチェックを実行</p>
              </div>
            </div>
            <div class="check-step">
              <div class="check-num">2</div>
              <div class="check-content">
                <strong>3ボタンで対応</strong>
                <div class="btn-group">
                  <span class="btn-auto">自動修正</span>
                  <span class="btn-later">後で確認</span>
                  <span class="btn-skip">スキップ</span>
                </div>
              </div>
            </div>
            <div class="check-step">
              <div class="check-num">3</div>
              <div class="check-content">
                <strong>自動修正押下 → MF更新</strong>
                <p>putJournals でMFの仕訳を直接更新</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 具体例 -->
        <div class="feature-box feature-box--example">
          <h3 class="feature-heading">📋 チェック結果の例</h3>
          <div class="table-scroll">
            <table class="tbl">
              <thead>
                <tr>
                  <th>ルールID</th>
                  <th>指摘内容</th>
                  <th>修正提案</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>R101</code></td>
                  <td>1万円以上ですが会議費になっています</td>
                  <td>接待交際費に修正すべきです</td>
                  <td>
                    <div class="btn-group-sm">
                      <span class="btn-auto-sm">自動修正</span>
                      <span class="btn-later-sm">後で確認</span>
                      <span class="btn-skip-sm">スキップ</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="alert alert-info">
            <strong>学習機能:</strong> 2回以上の修正提案はルール化して固定。同じパターンの指摘を自動でルールに昇格させる。
          </div>
        </div>

        <!-- 仕訳ルールチェック一覧（写真の内容） -->
        <div class="feature-box feature-box--rules">
          <h3 class="feature-heading">📊 仕訳ルールチェック一覧（62項目・14カテゴリ）</h3>
          <p class="note">マネーフォワード公式マニュアル＋実務経験から抽出した62項目をカテゴリ別に整理。</p>

          <div class="stats-row">
            <div class="stat-box"><div class="stat-num">62</div><div class="stat-label">既定ルール数</div></div>
            <div class="stat-box"><div class="stat-num">14</div><div class="stat-label">カテゴリ</div></div>
            <div class="stat-box"><div class="stat-num">13</div><div class="stat-label">自動修正対応</div></div>
          </div>

          <div class="rules-grid">
            <div v-for="cat in ruleCategories" :key="cat.name" class="rule-card">
              <h4 class="rule-card-title">{{ cat.name }}</h4>
              <ul class="rule-list">
                <li v-for="rule in cat.rules" :key="rule.id">
                  <code>{{ rule.id }}</code> {{ rule.desc }}
                </li>
              </ul>
            </div>
          </div>

          <div class="alert alert-warning">
            <strong>⚡ ルールカバー外の論点もAIが判断:</strong>
            上記ルールに該当しない仕訳でも、AIがこれは確認すべきと判断した場合は事例コード <code>EX001</code> <code>EX002</code> … として自動採番され、チェック結果に追加されます。採用する論点は正規ルール（R067〜）として正式ルールテーブルに追記できるように、利便性を担保しています。
          </div>
        </div>

        <!-- 顧問先用チェックエクセル -->
        <div class="feature-box feature-box--excel">
          <h3 class="feature-heading">📗 顧問先用チェックエクセル</h3>
          <p class="note">AIチェックで顧問先に確認が必要な項目を、エクセル形式で出力。顧問先が回答欄に記入して返送。</p>
          <div class="table-scroll">
            <table class="tbl tbl--excel">
              <thead>
                <tr>
                  <th class="col-id">ID</th>
                  <th class="col-content">内容</th>
                  <th class="col-answer">回答</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>001</code></td>
                  <td>3/11の取引はどんな取引ですか？</td>
                  <td class="cell-answer">（客が回答記載）</td>
                </tr>
                <tr>
                  <td><code>002</code></td>
                  <td>4/15の10万円の振込先を教えてください</td>
                  <td class="cell-answer">（客が回答記載）</td>
                </tr>
                <tr>
                  <td><code>003</code></td>
                  <td>5/20のカード利用は事業用ですか？</td>
                  <td class="cell-answer">（客が回答記載）</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="excel-flow">
            <div class="flow-step">🤖 AIチェック<br>不明な取引を検出</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">📗 エクセル生成<br>ID/内容/回答欄</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">📧 顧問先に送付</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">✏️ 顧問先が回答記入</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step step-ok">📥 回答取込<br>仕訳に反映</div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- 事例3: 月次レポート -->
      <!-- ============================================ -->
      <section :id="sec3.id" class="card card--green">
        <h2 class="card-title">{{ sec3.icon }} 事例3: 月次レポート</h2>
        <p class="card-lead">B/S論点・P/L論点・AI論点を各20項目ずつ事前設定し、AIに書かせる。</p>

        <div class="feature-box">
          <h3 class="feature-heading">📐 レポート生成フロー</h3>
          <div class="flow-diagram">
            <div class="flow-step">📊 MFから取得<br>試算表BS/PL<br>推移表</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">🤖 AI分析<br>B/S論点 × 20<br>P/L論点 × 20<br>AI論点 × 20</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">✅ 人間が選択<br>採用する論点に<br>チェック</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step step-ok">📄 HTML形式<br>レポート出力<br>修正可能</div>
          </div>
        </div>

        <div class="report-grid">
          <div class="report-col report-bs">
            <h4>B/S論点（約20項目）</h4>
            <ul>
              <li>現預金残高の前月比変動</li>
              <li>売掛金の滞留分析</li>
              <li>借入金の返済予定</li>
              <li>固定資産の減価償却状況</li>
              <li>…etc</li>
            </ul>
          </div>
          <div class="report-col report-pl">
            <h4>P/L論点（約20項目）</h4>
            <ul>
              <li>売上高の前年同月比</li>
              <li>粗利率の推移</li>
              <li>経費の異常値</li>
              <li>営業利益率の変動</li>
              <li>…etc</li>
            </ul>
          </div>
          <div class="report-col report-ai">
            <h4>AI論点（約20項目）</h4>
            <ul>
              <li>AI独自の気づき</li>
              <li>業種平均との比較</li>
              <li>季節変動の異常</li>
              <li>キャッシュフロー予測</li>
              <li>…etc</li>
            </ul>
          </div>
        </div>

        <div class="alert alert-info">
          採用する論点をチェックし、<strong>HTML形式のレポートに表示</strong>。人間が自由に修正できる。
        </div>
      </section>

      <!-- ============================================ -->
      <!-- 事例4: 面談後報告書 -->
      <!-- ============================================ -->
      <section :id="sec4.id" class="card card--orange">
        <h2 class="card-title">{{ sec4.icon }} 事例4: 面談後報告書</h2>
        <p class="card-lead">Zoomテキスト → マークダウン → AIに以下フォーマットで作成させる。HTML形式で修正可能。</p>

        <div class="feature-box">
          <h3 class="feature-heading">🔄 生成フロー</h3>
          <div class="flow-diagram">
            <div class="flow-step">🎥 Zoom面談</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">📝 テキスト化<br>Zoom文字起こし</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">📋 マークダウン<br>構造化</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">🤖 AI生成<br>フォーマット適用</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step step-ok">📄 HTML<br>修正可能</div>
          </div>
        </div>

        <div class="format-list">
          <div class="format-item">
            <div class="format-num">①</div>
            <div class="format-body">
              <h4>議事録</h4>
              <p>面談内容を<strong>500字程度</strong>で要約させる</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num">②</div>
            <div class="format-body">
              <h4>面談時の報告</h4>
              <p>税理士から顧問先への報告事項</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num">③</div>
            <div class="format-body">
              <h4>依頼内容</h4>
              <p>例: 「…の資料のご共有」「…の回答」</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num">④</div>
            <div class="format-body">
              <h4>次回アクション</h4>
              <p>例: 次回面談日 1/1 ／ 節税提案 ／ 銀行紹介</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num">⑤</div>
            <div class="format-body">
              <h4>次回ドラフト</h4>
              <p>次回面談時の面談シート（事前準備用）</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- 事例5: 営業面談報告 -->
      <!-- ============================================ -->
      <section :id="sec5.id" class="card card--red">
        <h2 class="card-title">{{ sec5.icon }} 事例5: 営業面談報告</h2>
        <p class="card-lead">面談時のZoomテキスト → AIに以下フォーマットで作成させる。HTML形式で修正可能。</p>

        <div class="feature-box">
          <h3 class="feature-heading">🔄 生成フロー</h3>
          <div class="flow-diagram">
            <div class="flow-step">🎥 営業面談<br>Zoom</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">📝 テキスト化</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">🤖 AI生成<br>フォーマット適用</div>
            <div class="flow-arrow">→</div>
            <div class="flow-step step-ok">📄 HTML<br>修正可能</div>
          </div>
        </div>

        <div class="format-list">
          <div class="format-item">
            <div class="format-num format-num--ai">AI</div>
            <div class="format-body">
              <h4>面談内容</h4>
              <p>面談内容を<strong>500字程度</strong>で要約させる</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num format-num--human">人</div>
            <div class="format-body">
              <h4>料金提案</h4>
              <p>人間が入力（AI生成対象外）</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num format-num--ai">AI</div>
            <div class="format-body">
              <h4>年間納税スケジュール</h4>
              <p><strong>決算月に合わせて動的に</strong>生成。法人税・消費税・住民税等の年間スケジュール。</p>
            </div>
          </div>
          <div class="format-item">
            <div class="format-num format-num--human">人</div>
            <div class="format-body">
              <h4>今後の流れ</h4>
              <p>人間が入力（AI生成対象外）</p>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- ページトップへ戻るボタン -->
    <button v-show="showTopBtn" class="top-btn" @click="scrollToTop">▲ トップへ</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sec1 = { id: 'journal-entry', icon: '📝', label: '事例1: 仕訳入力', tocClass: 'toc--blue' }
const sec2 = { id: 'journal-check', icon: '🔍', label: '事例2: 仕訳チェック', tocClass: 'toc--purple' }
const sec3 = { id: 'monthly-report', icon: '📊', label: '事例3: 月次レポート', tocClass: 'toc--green' }
const sec4 = { id: 'meeting-report', icon: '📋', label: '事例4: 面談後報告書', tocClass: 'toc--orange' }
const sec5 = { id: 'sales-report', icon: '🤝', label: '事例5: 営業面談報告', tocClass: 'toc--red' }
const sections = [sec1, sec2, sec3, sec4, sec5]

// 仕訳ルールチェック一覧（写真から読み取り）
const ruleCategories = [
  {
    name: 'BS残高チェック',
    rules: [
      { id: 'R001', desc: 'マイナス残高の全科目チェック' },
      { id: 'R003', desc: '売掛金の月齢比較' },
      { id: 'R004', desc: '固定資産額の増減取得' },
      { id: 'R005', desc: '通常動かない項目の月移動' },
      { id: 'R006', desc: '借入金返済の確認（科目差確認）' },
      { id: 'R007', desc: '資金の不合理な増減超過' },
      { id: 'R008', desc: '前払金と上記未収金で同一計上' },
    ],
  },
  {
    name: '給与・社保・福利厚生・税金預り',
    rules: [
      { id: 'R018', desc: '給与の手取額と支給大体の一致' },
      { id: 'R019', desc: '社会保険料の同月金額元' },
      { id: 'R020', desc: '源泉所得税の納期特例処理' },
      { id: 'R028', desc: '給与・法定福利厚生の消費税区分' },
    ],
  },
  {
    name: '経費科目（交際・広告・水光熱）',
    rules: [
      { id: 'AP', desc: '交際費・会議費振替の税区分' },
      { id: 'R031', desc: '広告宣伝費等の税区分' },
      { id: 'R032', desc: '寄付金区分20万円以上の割勘算' },
      { id: 'R033', desc: '運送先外費・通信費のの区分' },
      { id: 'R034', desc: '水道光熱費の税区分' },
      { id: 'R035', desc: '福利厚生費の上限確認' },
    ],
  },
  {
    name: '売上・仕入',
    rules: [
      { id: 'R022', desc: '売上の税区分' },
      { id: 'R023', desc: '売上の二重計上' },
      { id: 'R024', desc: '仕入の税区分' },
      { id: 'R025', desc: '仕入金の一斉計上' },
    ],
  },
  {
    name: '経費科目（その他）',
    rules: [
      { id: 'R036', desc: '保険/未科目10万円以上の税区分' },
      { id: 'R037', desc: '支払手数料・諸会費の税区分' },
      { id: 'R038', desc: '地代家賃・リース料の上限確認' },
    ],
  },
  {
    name: '営業外・雑収支',
    rules: [
      { id: 'R044', desc: '受取利息・雑収入の税区分' },
      { id: 'R045', desc: '個人事業主の元金金額' },
      { id: 'R046', desc: '補助金の勘定科目チェック' },
      { id: 'R047', desc: '支払利息 / 経理処理の計上確認' },
      { id: 'R048', desc: '経理原人の同規模 のルール判定' },
    ],
  },
  {
    name: '摘要・科目整合性',
    rules: [
      { id: 'R054', desc: '摘要キーワードと勘定科目の不整合' },
      { id: 'R055', desc: '同一支払先で複数科目の揺れ' },
    ],
  },
  {
    name: '推移表分析',
    rules: [
      { id: 'R049', desc: 'BS項目の異常値の前月比検出' },
      { id: 'R050', desc: 'PL科目の異常項目確認' },
    ],
  },
  {
    name: '重複・異常値検出',
    rules: [
      { id: 'R051', desc: '個別単票の異常（同一日同額の入出金がマッチする合）' },
      { id: 'R052', desc: '取引記述の重複（typo含む）' },
      { id: 'R057', desc: '取引金額月異入力確定' },
    ],
  },
  {
    name: '消費税・経理設定',
    rules: [
      { id: 'R058', desc: '免税/課税の判定確認' },
      { id: 'R060', desc: '消費税コード月別入力の確定' },
    ],
  },
  {
    name: '役員・専従者',
    rules: [
      { id: 'R026', desc: '役員報酬の定期固期間変更のチェック' },
      { id: 'R027', desc: '事業を兼ねる役員の査定と年額検計' },
    ],
  },
  {
    name: '固定資産・取得',
    rules: [
      { id: 'R013', desc: '10万円以上の消耗品（資産計上要否の検討）' },
      { id: 'R014', desc: '一括償却資産/未完の判定' },
    ],
  },
  {
    name: '現預金・売掛資産',
    rules: [
      { id: 'R006', desc: '現預金残高のマイナス' },
      { id: 'R009', desc: '資金の不合理な増減超過' },
    ],
  },
  {
    name: '日付・期間・振替',
    rules: [
      { id: 'R056', desc: '月初外日付' },
      { id: 'R061', desc: '期首/期末の振替確認' },
    ],
  },
]

// ページコンテナ参照
const pageRef = ref<HTMLDivElement | null>(null)

// 目次クリック → セクションにスクロール
const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

// トップへ戻るボタン
const showTopBtn = ref(false)
const handleScroll = () => {
  if (pageRef.value) {
    showTopBtn.value = pageRef.value.scrollTop > 400
  }
}
const scrollToTop = () => {
  if (pageRef.value) {
    pageRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* ============================================ */
/* ページ全体 */
/* ============================================ */
.page {
  height: 100%;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  color: #1e293b;
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 3px solid #1e293b;
}

.page-title { font-size: 26px; font-weight: 800; margin: 0 0 8px; }
.page-sub { font-size: 13px; color: #64748b; margin: 0; }

.page-body { display: flex; flex-direction: column; gap: 32px; }

/* ============================================ */
/* 目次ナビゲーション */
/* ============================================ */
.toc {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 8px;
}

.toc-title { font-size: 16px; font-weight: 700; margin: 0 0 16px; }

.toc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.toc-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.toc--blue { background: #dbeafe; color: #1e40af; }
.toc--blue:hover { border-color: #3b82f6; }
.toc--purple { background: #f3e8ff; color: #6b21a8; }
.toc--purple:hover { border-color: #8b5cf6; }
.toc--green { background: #dcfce7; color: #166534; }
.toc--green:hover { border-color: #22c55e; }
.toc--orange { background: #ffedd5; color: #9a3412; }
.toc--orange:hover { border-color: #f97316; }
.toc--red { background: #fee2e2; color: #991b1b; }
.toc--red:hover { border-color: #ef4444; }

.toc-icon { font-size: 18px; }

/* ============================================ */
/* カード */
/* ============================================ */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  scroll-margin-top: 20px;
}

.card--blue { border: 2px solid #3b82f6; border-top: 6px solid #3b82f6; }
.card--purple { border: 2px solid #8b5cf6; border-top: 6px solid #8b5cf6; }
.card--green { border: 2px solid #22c55e; border-top: 6px solid #22c55e; }
.card--orange { border: 2px solid #f97316; border-top: 6px solid #f97316; }
.card--red { border: 2px solid #ef4444; border-top: 6px solid #ef4444; }

.card-title { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
.card-lead { font-size: 14px; color: #475569; margin: 0 0 20px; line-height: 1.6; }

/* ============================================ */
/* 機能ボックス */
/* ============================================ */
.feature-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.feature-box--example { background: #faf5ff; border-color: #e9d5ff; }
.feature-box--rules { background: #fffbeb; border-color: #fde68a; }

.feature-heading { font-size: 15px; font-weight: 700; margin: 0 0 12px; }
.feature-list { margin: 0; padding: 0 0 0 20px; font-size: 13px; line-height: 2; }

/* ============================================ */
/* テーブル */
/* ============================================ */
.table-scroll { overflow-x: auto; }

.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
.tbl td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }

.cell-debit { color: #dc2626; font-weight: 700; }
.cell-credit { color: #2563eb; font-weight: 700; }
.row-tax { background: #fffbeb; }

.note { font-size: 12px; color: #64748b; margin: 0 0 12px; }

/* ============================================ */
/* フロー図 */
/* ============================================ */
.flow-diagram {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
  justify-content: center;
}

.flow-step {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 12px;
  text-align: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  min-width: 120px;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.step-ok { border-color: #22c55e; background: #f0fdf4; font-weight: 700; }

.flow-arrow { font-size: 18px; color: #94a3b8; font-weight: 700; }

/* ============================================ */
/* チェックフロー */
/* ============================================ */
.check-flow { display: flex; flex-direction: column; gap: 12px; }

.check-step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.check-num {
  width: 32px; height: 32px;
  background: #8b5cf6; color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
  flex-shrink: 0;
}

.check-content { flex: 1; }
.check-content strong { font-size: 14px; }
.check-content p { font-size: 12px; color: #64748b; margin: 4px 0 0; }

.btn-group { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

.btn-auto, .btn-later, .btn-skip {
  padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.btn-auto { background: #3b82f6; color: #fff; }
.btn-later { background: #f59e0b; color: #fff; }
.btn-skip { background: #94a3b8; color: #fff; }

.btn-group-sm { display: flex; gap: 4px; flex-wrap: wrap; }
.btn-auto-sm, .btn-later-sm, .btn-skip-sm {
  padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;
}
.btn-auto-sm { background: #3b82f6; color: #fff; }
.btn-later-sm { background: #f59e0b; color: #fff; }
.btn-skip-sm { background: #94a3b8; color: #fff; }

/* ============================================ */
/* ルール一覧 */
/* ============================================ */
.stats-row {
  display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
}

.stat-box {
  background: #fff; border: 2px solid #e2e8f0; border-radius: 10px;
  padding: 12px 24px; text-align: center; flex: 1; min-width: 100px;
}

.stat-num { font-size: 28px; font-weight: 800; color: #1e293b; }
.stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.rule-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.rule-card-title { font-size: 13px; font-weight: 700; margin: 0 0 8px; color: #334155; }

.rule-list {
  margin: 0; padding: 0 0 0 16px; font-size: 11px; line-height: 1.8; color: #475569;
}

/* ============================================ */
/* アラート */
/* ============================================ */
.alert {
  padding: 14px 18px; border-radius: 8px; font-size: 13px; line-height: 1.7; margin: 12px 0;
}
.alert-info { background: #dbeafe; border-left: 4px solid #3b82f6; color: #1e40af; }
.alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; }

/* ============================================ */
/* レポートグリッド */
/* ============================================ */
.report-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }

.report-col {
  border-radius: 8px; padding: 16px;
}
.report-col h4 { font-size: 13px; font-weight: 700; margin: 0 0 8px; }
.report-col ul { margin: 0; padding: 0 0 0 16px; font-size: 11px; line-height: 1.8; }

.report-bs { background: #eff6ff; border: 1px solid #bfdbfe; }
.report-pl { background: #f0fdf4; border: 1px solid #bbf7d0; }
.report-ai { background: #faf5ff; border: 1px solid #e9d5ff; }

/* ============================================ */
/* フォーマットリスト */
/* ============================================ */
.format-list { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; }

.format-item {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 14px 18px; background: #f8fafc;
  border-radius: 8px; border: 1px solid #e2e8f0;
}

.format-num {
  width: 36px; height: 36px;
  background: #f97316; color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 16px; flex-shrink: 0;
}

.format-num--ai { background: #8b5cf6; }
.format-num--human { background: #64748b; }

.format-body { flex: 1; }
.format-body h4 { font-size: 14px; font-weight: 700; margin: 0 0 4px; }
.format-body p { font-size: 12px; color: #475569; margin: 0; line-height: 1.6; }

/* ============================================ */
/* トップへ戻るボタン */
/* ============================================ */
.top-btn {
  position: fixed;
  bottom: 24px; right: 24px;
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #1e293b; color: #fff;
  border: none; cursor: pointer;
  font-size: 14px; font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.2s;
  z-index: 100;
}

.top-btn:hover { background: #334155; transform: scale(1.1); }

/* ============================================ */
/* 顧問先用チェックエクセル */
/* ============================================ */
.feature-box--excel { background: #f0fdf4; border-color: #86efac; }

.tbl--excel th { background: #166534; color: #fff; }
.tbl--excel td { border-bottom: 1px solid #d1fae5; }
.col-id { width: 60px; }
.col-answer { min-width: 200px; }
.cell-answer { color: #94a3b8; font-style: italic; background: #f8fafc; }

.excel-flow {
  display: flex; align-items: center; gap: 8px;
  margin-top: 16px; flex-wrap: wrap; justify-content: center;
}

/* ============================================ */
/* レスポンシブ */
/* ============================================ */
@media (max-width: 768px) {
  .report-grid { grid-template-columns: 1fr; }
  .rules-grid { grid-template-columns: 1fr; }
  .flow-diagram, .excel-flow { flex-direction: column; }
  .toc-grid { grid-template-columns: 1fr 1fr; }
}
</style>
