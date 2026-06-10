<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">🔀 MF → マスタ → 仕訳一覧 フィールド遷移</h1>
      <p class="page-sub">マネーフォワードから取得したフィールドが、マスタ管理を経て、仕訳一覧のバリデーションでどう使われるかを一覧化</p>
    </div>

    <div class="page-body">

      <!-- ============================================ -->
      <!-- フェーズ① AIパイプライン（証票→仕訳生成） -->
      <!-- ============================================ -->
      <section class="card phase-card phase-ai">
        <h2 class="card-title">① AIパイプライン — 証票→仕訳を生成する</h2>
        <p class="note">客から来た資料をAIが分類し、仕訳を自動生成するフェーズ。ここで使われる用語は全て「生成側」の概念。</p>
      </section>
      <section class="card term-card" v-for="term in phase1Terms" :key="term.id">
        <h2 class="card-title">{{ term.id }}. <code>{{ term.code }}</code>{{ term.typeName ? ` / ${term.typeName}` : '' }} — {{ term.japanese }}</h2>
        <div class="term-section"><h3 class="term-heading">目的</h3><p class="term-text">{{ term.purpose }}</p></div>
        <div v-if="term.definedAt" class="term-section"><h3 class="term-heading">定義場所</h3><p class="term-text"><code>{{ term.definedAt }}</code></p></div>
        <div class="term-section">
          <h3 class="term-heading">全選択肢（{{ term.allValues.length }}種）</h3>
          <table class="tbl compact"><thead><tr><th>値</th><th>日本語</th><th>備考</th></tr></thead>
            <tbody><tr v-for="v in term.allValues" :key="v.value" :class="{ 'row-highlight': v.highlight }"><td><code>{{ v.value }}</code></td><td class="label-cell">{{ v.label }}</td><td class="note-cell">{{ v.note }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.roles && term.roles.length" class="term-section">
          <h3 class="term-heading">現状の役割</h3>
          <table class="tbl compact"><thead><tr><th>役割</th><th>十分か</th><th>説明</th></tr></thead>
            <tbody><tr v-for="r in term.roles" :key="r.role" :class="{ 'row-highlight': !r.sufficient }"><td class="label-cell">{{ r.role }}</td><td class="center-cell"><span :class="r.sufficient ? 'badge badge-ok' : 'badge badge-no'">{{ r.sufficient ? '✅ 十分' : '❌ 不足' }}</span></td><td class="note-cell">{{ r.description }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.problems && term.problems.length" class="term-section"><h3 class="term-heading">⚠️ 問題点</h3><ul class="problem-list"><li v-for="(p, i) in term.problems" :key="i">{{ p }}</li></ul></div>
        <div v-if="term.proposal && term.proposal.length" class="term-section"><h3 class="term-heading">💡 あるべき姿（提案）</h3><ul class="proposal-list"><li v-for="(p, i) in term.proposal" :key="i">{{ p }}</li></ul></div>
      </section>

      <!-- ============================================ -->
      <!-- ①→② 橋渡し（AI生成→人間検証をつなぐ） -->
      <!-- ============================================ -->
      <section class="card phase-card phase-bridge">
        <h2 class="card-title">①→② 橋渡し — AI生成の出力が人間検証の入力になる</h2>
        <p class="note">AIパイプラインで生成された値が、バリデーション（人間検証）のキーとして使われる。両フェーズにまたがる用語。</p>
      </section>
      <section class="card term-card term-bridge" v-for="term in bridgeTerms" :key="term.id">
        <h2 class="card-title">{{ term.id }}. <code>{{ term.code }}</code>{{ term.typeName ? ` / ${term.typeName}` : '' }} — {{ term.japanese }}</h2>
        <div class="term-section"><h3 class="term-heading">目的</h3><p class="term-text">{{ term.purpose }}</p></div>
        <div v-if="term.definedAt" class="term-section"><h3 class="term-heading">定義場所</h3><p class="term-text"><code>{{ term.definedAt }}</code></p></div>
        <div class="term-section">
          <h3 class="term-heading">全選択肢（{{ term.allValues.length }}種）</h3>
          <table class="tbl compact"><thead><tr><th>値</th><th>日本語</th><th>備考</th></tr></thead>
            <tbody><tr v-for="v in term.allValues" :key="v.value" :class="{ 'row-highlight': v.highlight }"><td><code>{{ v.value }}</code></td><td class="label-cell">{{ v.label }}</td><td class="note-cell">{{ v.note }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.roles && term.roles.length" class="term-section">
          <h3 class="term-heading">現状の役割</h3>
          <table class="tbl compact"><thead><tr><th>役割</th><th>十分か</th><th>説明</th></tr></thead>
            <tbody><tr v-for="r in term.roles" :key="r.role" :class="{ 'row-highlight': !r.sufficient }"><td class="label-cell">{{ r.role }}</td><td class="center-cell"><span :class="r.sufficient ? 'badge badge-ok' : 'badge badge-no'">{{ r.sufficient ? '✅ 十分' : '❌ 不足' }}</span></td><td class="note-cell">{{ r.description }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.problems && term.problems.length" class="term-section"><h3 class="term-heading">⚠️ 問題点</h3><ul class="problem-list"><li v-for="(p, i) in term.problems" :key="i">{{ p }}</li></ul></div>
        <div v-if="term.proposal && term.proposal.length" class="term-section"><h3 class="term-heading">💡 あるべき姿（提案）</h3><ul class="proposal-list"><li v-for="(p, i) in term.proposal" :key="i">{{ p }}</li></ul></div>
      </section>

      <!-- ============================================ -->
      <!-- フェーズ② バリデーション（人間が仕訳を検証・修正） -->
      <!-- ============================================ -->
      <section class="card phase-card phase-human">
        <h2 class="card-title">② バリデーション — 人間がAI仕訳を検証・修正する</h2>
        <p class="note">AIが生成した仕訳を人間が確認する画面で、科目・税区分の矛盾を検出するフェーズ。ここで使われる用語は全て「検証側」の概念。</p>
      </section>
      <section class="card term-card" v-for="term in phase2Terms" :key="term.id">
        <h2 class="card-title">{{ term.id }}. <code>{{ term.code }}</code>{{ term.typeName ? ` / ${term.typeName}` : '' }} — {{ term.japanese }}</h2>
        <div class="term-section"><h3 class="term-heading">目的</h3><p class="term-text">{{ term.purpose }}</p></div>
        <div v-if="term.definedAt" class="term-section"><h3 class="term-heading">定義場所</h3><p class="term-text"><code>{{ term.definedAt }}</code></p></div>
        <div class="term-section">
          <h3 class="term-heading">全選択肢（{{ term.allValues.length }}種）</h3>
          <table class="tbl compact"><thead><tr><th>値</th><th>日本語</th><th>備考</th></tr></thead>
            <tbody><tr v-for="v in term.allValues" :key="v.value" :class="{ 'row-highlight': v.highlight }"><td><code>{{ v.value }}</code></td><td class="label-cell">{{ v.label }}</td><td class="note-cell">{{ v.note }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.roles && term.roles.length" class="term-section">
          <h3 class="term-heading">現状の役割</h3>
          <table class="tbl compact"><thead><tr><th>役割</th><th>十分か</th><th>説明</th></tr></thead>
            <tbody><tr v-for="r in term.roles" :key="r.role" :class="{ 'row-highlight': !r.sufficient }"><td class="label-cell">{{ r.role }}</td><td class="center-cell"><span :class="r.sufficient ? 'badge badge-ok' : 'badge badge-no'">{{ r.sufficient ? '✅ 十分' : '❌ 不足' }}</span></td><td class="note-cell">{{ r.description }}</td></tr></tbody>
          </table>
        </div>
        <div v-if="term.problems && term.problems.length" class="term-section"><h3 class="term-heading">⚠️ 問題点</h3><ul class="problem-list"><li v-for="(p, i) in term.problems" :key="i">{{ p }}</li></ul></div>
        <div v-if="term.proposal && term.proposal.length" class="term-section"><h3 class="term-heading">💡 あるべき姿（提案）</h3><ul class="proposal-list"><li v-for="(p, i) in term.proposal" :key="i">{{ p }}</li></ul></div>
      </section>

      <!-- direction 3種の同名別概念 -->
      <section class="card">
        <h2 class="card-title">⚠️ 同名別概念の整理 — direction（3種）</h2>
        <p class="note">「direction」という名前で3つの全く異なる概念が存在する。①は2つ（書類/行）、②は1つ（税区分）。</p>
        <table class="tbl">
          <thead>
            <tr><th>フェーズ</th><th>区分</th><th>型名</th><th>粒度</th><th>値</th><th>用途</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in directionComparison" :key="d.label" class="row-highlight">
              <td><span :class="['badge', d.phaseClass]">{{ d.phaseLabel }}</span></td>
              <td class="label-cell">{{ d.label }}</td>
              <td><code>{{ d.typeName }}</code></td>
              <td class="note-cell">{{ d.level }}</td>
              <td class="values-cell"><span v-for="v in d.values" :key="v" class="value-tag">{{ v }}</span></td>
              <td class="note-cell">{{ d.usage }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 導出チェーン図 -->
      <section class="card">
        <h2 class="card-title">🔗 用語間の導出チェーン</h2>
        <pre class="chain-diagram">{{ derivationChain }}</pre>
      </section>

      <!-- 概要図 -->
      <section class="card">
        <h2 class="card-title">📐 全体像</h2>
        <div class="flow-diagram">
          <div class="flow-box flow-mf">
            <div class="flow-label">MF MCP</div>
            <div class="flow-desc">マネーフォワードのAPIから取得</div>
            <div class="flow-side">外部</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-box flow-master">
            <div class="flow-label">マスタ管理</div>
            <div class="flow-desc">バックエンド（サーバー側JSON）</div>
            <div class="flow-side">内部</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-box flow-journal">
            <div class="flow-label">仕訳一覧バリデーション</div>
            <div class="flow-desc">フロント＋バックエンド共用</div>
            <div class="flow-side">内部</div>
          </div>
        </div>
      </section>

      <!-- MF→マスタ→バリデーション遷移セクション -->
      <section class="card" v-for="sec in fieldSections" :key="sec.title">
        <h2 class="card-title">{{ sec.title }}</h2>
        <p v-if="sec.note" class="note">{{ sec.note }}</p>
        <div class="table-scroll">
          <table class="tbl">
            <thead>
              <tr>
                <th class="col-field">フィールド名</th>
                <th class="col-label">日本語</th>
                <th v-if="sec.hasMf" class="col-mf">MF取得</th>
                <th v-if="sec.hasMaster" class="col-master">マスタ管理</th>
                <th class="col-validation">バリデーションでの使われ方</th>
                <th class="col-side">フロント/バック</th>
                <th class="col-note">備考</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sec.rows" :key="row.field" :class="{ 'row-highlight': row.highlight }">
                <td><code>{{ row.field }}</code></td>
                <td class="label-cell">{{ row.label }}</td>
                <td v-if="sec.hasMf" class="center-cell">
                  <span v-if="row.mf === '✅'" class="badge badge-ok">✅ 取得</span>
                  <span v-else-if="row.mf === '🔄'" class="badge badge-conv">🔄 変換</span>
                  <span v-else class="badge badge-no">❌ なし</span>
                </td>
                <td v-if="sec.hasMaster" class="center-cell">
                  <span v-if="row.master === '✅'" class="badge badge-ok">✅ 管理</span>
                  <span v-else-if="row.master === '📊'" class="badge badge-derived">📊 導出</span>
                  <span v-else class="badge badge-no">—</span>
                </td>
                <td class="validation-cell">{{ row.validation }}</td>
                <td class="center-cell">
                  <span v-if="row.side === 'both'" class="side-badge side-both">共用</span>
                  <span v-else-if="row.side === 'back'" class="side-badge side-back">バック</span>
                  <span v-else-if="row.side === 'front'" class="side-badge side-front">フロント</span>
                  <span v-else>—</span>
                </td>
                <td class="note-cell">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- バリデーションルール対応表 -->
      <section class="card">
        <h2 class="card-title">🛡️ バリデーションルールとフィールドの対応</h2>
        <p class="note">番号はjournalValidationCore.tsのコメント番号と一致。全13チェック。</p>
        <table class="tbl">
          <thead>
            <tr>
              <th>コード番号</th>
              <th>定数名</th>
              <th>日本語名</th>
              <th>使用するフィールド</th>
              <th>フロント/バック</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in validationRules" :key="rule.id">
              <td><code>{{ rule.num }}</code></td>
              <td><code>{{ rule.id }}</code></td>
              <td>{{ rule.name }}</td>
              <td class="field-list">{{ rule.fields }}</td>
              <td class="center-cell">
                <span :class="['side-badge', rule.sideClass]">{{ rule.sideLabel }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- MF 5分類 → マスタ 4分類 変換表 -->
      <section class="card">
        <h2 class="card-title">🔄 MF 5分類 → マスタ 4分類 変換</h2>
        <p class="note">MFはASET/LIABILITY/CAPITAL/REVENUE/EXPENSEの5分類。マスタではBS_ASSET等の大分類を経て、バリデーション用の4分類（sales/expense/bs_al/bs_equity）に変換。資産と負債はバリデーション上の振る舞いが同一のためbs_alに統合。</p>
        <table class="tbl compact">
          <thead>
            <tr>
              <th>MFの科目グループ（5分類）</th>
              <th>日本語</th>
              <th>→</th>
              <th>マスタの大分類</th>
              <th>→</th>
              <th>バリデーション用4分類</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="conv in megaGroupConversions" :key="conv.mf">
              <td><code>{{ conv.mf }}</code></td>
              <td>{{ conv.mfLabel }}</td>
              <td class="center-cell">→</td>
              <td><code>{{ conv.master }}</code></td>
              <td class="center-cell">→</td>
              <td><span :class="['mega-badge', conv.megaClass]">{{ conv.mega }}（{{ conv.megaLabel }}）</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- MFにあるが未使用のフィールド一覧 -->
      <section class="card" v-for="unused in unusedFields" :key="unused.title">
        <h2 class="card-title">{{ unused.title }}</h2>
        <p v-if="unused.note" class="note">{{ unused.note }}</p>
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-field">MFフィールド名</th>
              <th class="col-label">日本語</th>
              <th>現状</th>
              <th>実測値</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in unused.rows" :key="row.field">
              <td><code>{{ row.field }}</code></td>
              <td class="label-cell">{{ row.label }}</td>
              <td class="note-cell">{{ row.status }}</td>
              <td class="note-cell">{{ row.sample }}</td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// ============================================================
// 用語 完全再定義（全15用語。phase: 1=①AI生成, 0=①→②橋渡し, 2=②人間検証）
// ============================================================
const glossaryTerms = [
  // ── 1. source_type ──
  {
    id: '①-1', phase: 1, code: 'source_type', typeName: 'SourceType', japanese: '証票種類（12種）',
    definedAt: 'src/types/pipeline/source_type.type.ts L68-83',
    purpose: '客から来た資料が何なのかを判定する種別。「仕訳に使うのか？使うなら自動か手入力か？」を決めるために存在する。',
    allValues: [
      { value: 'receipt', label: '領収書・レシート', note: '処理区分: auto。出金の証拠', highlight: false },
      { value: 'invoice_received', label: '受取請求書', note: '処理区分: auto。仕入・経費の請求', highlight: false },
      { value: 'tax_payment', label: '納付書', note: '処理区分: auto。税金・社保', highlight: false },
      { value: 'journal_voucher', label: '振替伝票', note: '処理区分: auto。内部振替', highlight: false },
      { value: 'bank_statement', label: '通帳・銀行明細', note: '処理区分: auto。入出金が混在', highlight: true },
      { value: 'credit_card', label: 'クレカ明細', note: '処理区分: auto。出金のみ', highlight: false },
      { value: 'cash_ledger', label: '現金出納帳', note: '処理区分: auto。入出金が混在', highlight: true },
      { value: 'invoice_issued', label: '発行請求書', note: '処理区分: manual。自社が発行', highlight: true },
      { value: 'receipt_issued', label: '発行領収書', note: '処理区分: manual。自社が発行', highlight: true },
      { value: 'non_journal', label: '仕訳対象外', note: '処理区分: excluded。名刺・メモ等', highlight: false },
      { value: 'supplementary_doc', label: '補助資料', note: '処理区分: excluded。見積書・契約書等', highlight: false },
      { value: 'other', label: '判別不能', note: '処理区分: excluded。AI分類失敗時', highlight: false },
    ],
    roles: [
      { role: '物理分類: 証票の形式を判定', sufficient: true, description: '「レシートか？通帳か？請求書か？」→ 12種で十分' },
      { role: '意味導出: voucher_typeの導出元', sufficient: false, description: 'VOUCHER_TYPE_MAP × LineItemDirection → voucher_type。通帳入金がnullになる等、粒度が不足' },
    ],
    problems: [
      'voucher_type導出元としての粒度不足。source_typeは「証票の物理的な形式」を分類する型であり「仕訳の意味」を判定するために設計されていない',
      'bank_statement × income = null（売上？振替？雑収入？返品？→不定）',
      'cash_ledger × income = null（同上）',
      'invoice_issued / receipt_issued の VOUCHER_TYPE_MAP が未定義 → null → #8スキップ',
    ],
    proposal: [
      'source_type自体は変更不要。12種のまま。物理分類としては完全',
      '問題はvoucher_typeの導出方法にある。source_typeを細分化するのではなく、voucher_typeの導出に第3の入力（AI判定結果=vendor_vector/non_vendor_type/counterpart_account）を追加すべき',
    ],
  },
  // ── 2. Direction ──
  {
    id: '①-2', phase: 1, code: 'direction（書類）', typeName: 'Direction', japanese: '書類レベル仕訳方向（4種）',
    definedAt: 'src/types/pipeline/source_type.type.ts L203',
    purpose: '書類レベルの仕訳方向を表す。通帳・現金出納帳など1つの書類に入出金が混在する場合にmixedを使う。',
    allValues: [
      { value: 'expense', label: '出金', note: 'レシート・請求書・納付書等（出金のみの書類）', highlight: false },
      { value: 'income', label: '入金', note: '発行請求書等（入金のみの書類）', highlight: false },
      { value: 'transfer', label: '振替', note: '振替伝票（口座間移動）', highlight: false },
      { value: 'mixed', label: '混在', note: '通帳・現金出納帳（入出金が混在する書類）', highlight: true },
    ],
    roles: [
      { role: '書類レベルの方向分類', sufficient: true, description: '書類単位で入出金の傾向を示す' },
    ],
    problems: [
      'VOUCHER_TYPE_MAPの入力に使われていない。実際の入力はLineItemDirection（2種）。用語表で「source_type × Direction → voucher_type」と書いたのは誤り',
    ],
    proposal: [
      '用語表の記述を修正。DirectionはVOUCHER_TYPE_MAPの入力ではなく、書類レベルの方向分類として残る',
    ],
  },
  // ── 3. LineItemDirection ──
  {
    id: '①-3', phase: 1, code: 'direction（行）', typeName: 'LineItemDirection', japanese: '行レベル方向（2種）',
    definedAt: 'src/types/pipeline/line_item.type.ts L71',
    purpose: '証票の1行ごとの入出金方向。Direction（書類レベル4種）とは明確に異なる。VOUCHER_TYPE_MAPの実際の入力。',
    allValues: [
      { value: 'expense', label: '出金', note: 'この行は出金（費用・支払い）', highlight: false },
      { value: 'income', label: '入金', note: 'この行は入金（売上・受取）', highlight: false },
    ],
    roles: [
      { role: 'VOUCHER_TYPE_MAPの入力', sufficient: true, description: 'source_type × LineItemDirection → voucher_type の実際の2軸の片方' },
      { role: '借方/貸方の割当', sufficient: true, description: 'expense → 借方:費用科目/貸方:相手勘定。income → 逆' },
    ],
    problems: [
      '名前が紛らわしい。Direction（4種）とLineItemDirection（2種）は名前が似ているが意味が異なる',
      'Direction（書類レベル）のtransfer/mixedの書類でも、個別の行は必ずexpense/incomeに確定する',
    ],
    proposal: [],
  },
  // ── 4. voucher_type ──
  {
    id: '①②', phase: 0, code: 'voucher_type', typeName: 'string | null', japanese: '証票意味（7種+null）',
    definedAt: 'src/utils/lineItemToJournalMock.ts L199-223（VOUCHER_TYPE_MAP）',
    purpose: '証票の仕訳上の意味を表す。#8(VOUCHER_TYPE_CONFLICT)のルール選択キー。この値でVOUCHER_TYPE_RULESテーブルを検索し、借方・貸方に許容される科目のホワイトリストを取得する。',
    allValues: [
      { value: '経費', label: '費用発生', note: '借方:PL_EXPENSE / 貸方:現金・預金・未払金', highlight: false },
      { value: '売上', label: '収益発生', note: '借方:売掛金・現預金 / 貸方:PL_REVENUE', highlight: false },
      { value: 'クレカ', label: 'クレカ利用', note: '借方:PL_EXPENSE / 貸方:未払金のみ', highlight: false },
      { value: 'クレカ引落', label: 'クレカ引落', note: '借方:未払金 / 貸方:預金', highlight: false },
      { value: '給与', label: '給与支払', note: '借方:給料手当等 / 貸方:預金+預り金', highlight: false },
      { value: '立替経費', label: '立替精算', note: '借方:PL_EXPENSE / 貸方:立替金・未収金', highlight: false },
      { value: '振替', label: '口座間移動', note: '借方:預金 / 貸方:預金', highlight: false },
      { value: 'null', label: '未定義', note: '#8スキップ。#7だけが防波堤', highlight: true },
    ],
    roles: [
      { role: '#8のルール選択キー', sufficient: false, description: '7種 + null。nullが多すぎてホワイトリスト方式の効果が限定的' },
    ],
    problems: [
      '返品・値引に対応するvoucher_typeが存在しない。売上返品（借方:売上/貸方:売掛金）→ null → #8スキップ → isContraフラグ（4件のみ）に依存',
      'nullになるケースが多すぎる: bank_statement×income, cash_ledger×income, invoice_issued, receipt_issued, 手入力仕訳',
      '導出元の情報不足。VOUCHER_TYPE_MAP = source_type × LineItemDirection の2軸。通帳入金は「売上/振替/雑収入/返品」が混在するため2軸では確定不可。第3の入力（AI判定結果）が必要',
    ],
    proposal: [
      '提案A: 導出方法の拡張。source_type × LineItemDirection × AI判定結果（vendor_vector/non_vendor_type/counterpart_account）→ voucher_type',
      '提案B: invoice_issued/receipt_issuedのVOUCHER_TYPE_MAP即追加。{ income: "売上" }。単純な追加で即実装可能',
      '提案C: 返品用voucher_type追加（売上返品/仕入返品）。ただしsource_type×LineItemDirectionだけでは返品を導出できない問題は残る',
    ],
  },
  // ── 5. ProcessingMode ──
  {
    id: '①-4', phase: 1, code: 'processing_mode', typeName: 'ProcessingMode', japanese: '処理区分（3種）',
    definedAt: 'src/types/pipeline/source_type.type.ts L116',
    purpose: 'source_typeから1:1で導出。「この証票をどう処理するか」を決める。drive-select UIの振り分け（自動/手入力/対象外）に直結する。',
    allValues: [
      { value: 'auto', label: '自動仕訳', note: '7種: receipt, invoice_received, tax_payment, journal_voucher, bank_statement, credit_card, cash_ledger', highlight: false },
      { value: 'manual', label: '手入力仕訳', note: '2種: invoice_issued, receipt_issued', highlight: false },
      { value: 'excluded', label: '対象外', note: '3種: non_journal, supplementary_doc, other', highlight: false },
    ],
    roles: [
      { role: 'パイプラインの処理振り分け', sufficient: true, description: 'source_typeから1:1で導出。設計上の問題なし' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 6. SourceCategory ──
  {
    id: '①-5', phase: 1, code: 'source_category', typeName: 'SourceCategory', japanese: '学習ルール照合カテゴリ（4種+null）',
    definedAt: 'src/types/pipeline/source_type.type.ts L157',
    purpose: '学習ルール（matchLearningRule.ts）の照合範囲を決める。source_typeから導出。',
    allValues: [
      { value: 'receipt', label: '領収書系', note: 'receipt, invoice_received, tax_payment', highlight: false },
      { value: 'bank', label: '銀行系', note: 'bank_statement, cash_ledger', highlight: false },
      { value: 'credit', label: 'クレカ系', note: 'credit_card', highlight: false },
      { value: 'all', label: '全共通', note: '照合時に全カテゴリにマッチ', highlight: false },
      { value: 'null', label: '照合対象外', note: 'journal_voucher, invoice_issued, receipt_issued, non_journal, supplementary_doc, other', highlight: false },
    ],
    roles: [
      { role: '学習ルールの照合範囲', sufficient: true, description: 'source_typeから導出。設計上の問題なし' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 7. accountGroup ──
  {
    id: '②-1', phase: 2, code: 'accountGroup', typeName: 'AccountGroup', japanese: '大分類（5種）',
    definedAt: '科目マスタの属性。MFの5分類から変換',
    purpose: '勘定科目の最上位の分類。#7でgetMegaGroup()により4分類に変換。#8でallowedGroupsのホワイトリスト照合に使用。',
    allValues: [
      { value: 'BS_ASSET', label: '資産', note: 'MF原値: ASSET。B/S', highlight: false },
      { value: 'BS_LIABILITY', label: '負債', note: 'MF原値: LIABILITY。B/S', highlight: false },
      { value: 'BS_EQUITY', label: '純資産', note: 'MF原値: CAPITAL。B/S', highlight: false },
      { value: 'PL_REVENUE', label: '収益', note: 'MF原値: REVENUE。P/L', highlight: false },
      { value: 'PL_EXPENSE', label: '費用', note: 'MF原値: EXPENSE。P/L', highlight: false },
    ],
    roles: [
      { role: '#7: 4分類の入力', sufficient: true, description: 'getMegaGroup()でMegaGroupTypeに変換' },
      { role: '#8: allowedGroupsで照合', sufficient: true, description: 'ホワイトリストの大分類照合' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 8. MegaGroupType ──
  {
    id: '②-2', phase: 2, code: '（バリデーション専用）', typeName: 'MegaGroupType', japanese: '4分類（4種+null）',
    definedAt: 'src/shared/validation/journalValidationCore.ts L54, L197-206',
    purpose: '#7(CATEGORY_CONFLICT)の借方×貸方の組合せ判定に使用。accountGroupから変換。資産と負債はバリデーション上の振る舞いが同一のため統合。',
    allValues: [
      { value: 'sales', label: '売上', note: '← PL_REVENUE', highlight: false },
      { value: 'expense', label: '経費', note: '← PL_EXPENSE', highlight: false },
      { value: 'bs_al', label: 'B/S資産負債', note: '← BS_ASSET + BS_LIABILITY。統合', highlight: true },
      { value: 'bs_equity', label: 'B/S純資産', note: '← BS_EQUITY', highlight: false },
      { value: 'null', label: '不明', note: 'マスタ未存在の科目', highlight: true },
    ],
    roles: [
      { role: '#7: 16パターンの組合せ判定', sufficient: true, description: '正常6+isContra2+警告8パターン' },
    ],
    problems: [
      '#7の二重ループ（全借方行×全貸方行のペアチェック）が複合仕訳で誤検知する問題あり（CATEGORY_CONFLICT解消タスク。別途対応）',
    ],
    proposal: [
      '二重ループ廃止 → 集合チェック（借方グループ vs 貸方グループ）への切り替え（別タスク）',
    ],
  },
  // ── 9. category ──
  {
    id: '②-3', phase: 2, code: 'category', typeName: 'string', japanese: '科目分類（中分類）',
    definedAt: '科目マスタの属性。MFから取得',
    purpose: '#8のallowedCategoriesでホワイトリスト照合に使用。証票意味（voucher_type）とは全く別の概念。',
    allValues: [
      { value: 'CASH_AND_DEPOSITS', label: '現預金', note: '現金・普通預金・当座預金等', highlight: false },
      { value: 'TRADE_RECEIVABLES', label: '売掛金', note: '売掛金・受取手形等', highlight: false },
      { value: 'OTHER_CURRENT_ASSETS', label: '他流動資産', note: '仮払金・立替金・未収金等', highlight: false },
      { value: 'OTHER_CURRENT_LIABILITIES', label: '他流動負債', note: '未払金・預り金等', highlight: false },
      { value: 'SALES_REVENUE', label: '売上高', note: '売上', highlight: false },
      { value: 'COST_OF_GOODS_SOLD', label: '売上原価', note: '仕入等', highlight: false },
      { value: '...', label: '...等', note: 'MFの全中分類。上記は#8で使われる主要なもの', highlight: false },
    ],
    roles: [
      { role: '#8: allowedCategoriesで照合', sufficient: true, description: 'ホワイトリストの中分類照合。コピー/カスタム科目も含む' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 10. target ──
  {
    id: '②-4', phase: 2, code: 'target', typeName: 'AccountTarget', japanese: '事業形態（2種）',
    definedAt: '科目マスタの属性',
    purpose: 'MFの科目体系に準拠。法人用科目と個人用科目を区別する。科目一覧の法人/個人フィルタで使用。',
    allValues: [
      { value: 'corp', label: '法人', note: '法人用科目', highlight: false },
      { value: 'individual', label: '個人事業主', note: '個人用科目', highlight: false },
    ],
    roles: [
      { role: '科目フィルタ', sufficient: true, description: '科目一覧の法人/個人表示切替' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 11. taxDetermination ──
  {
    id: '②-5', phase: 2, code: 'taxDetermination', typeName: 'TaxDetermination', japanese: '税区分判定方式（3種）',
    definedAt: '科目マスタの属性。マスタ独自定義。MFにはない',
    purpose: '#9(TAX_ACCOUNT_MISMATCH)で科目のtaxDeterminationと税区分のdirection（税区分方向）の矛盾を判定するために存在する。',
    allValues: [
      { value: 'fixed', label: '固定', note: '既定税区分と完全一致必須。BS科目に設定', highlight: false },
      { value: 'auto_purchase', label: '自動判定/仕入方向', note: '売上方向の税区分なら矛盾。費用科目に設定', highlight: false },
      { value: 'auto_sales', label: '自動判定/売上方向', note: '仕入方向の税区分なら矛盾。売上科目に設定', highlight: false },
    ],
    roles: [
      { role: '#9: 税区分方向との矛盾判定', sufficient: false, description: '60件の不一致が構造的に残る' },
    ],
    problems: [
      '廃止検討中のまま放置されている。60件の不一致が構造的に残る',
      '既定税区分のdirectionを直接参照すれば、taxDetermination自体が不要になる',
      'taxDetermination = auto_purchase なのに defaultTaxCategoryId の direction = sales、のような矛盾がマスタに存在する',
    ],
    proposal: [
      'taxDetermination（3値）を廃止。defaultTaxCategoryId → 税区分マスタ → direction を直接参照する方式へ移行',
      '移行後はtaxDeterminationフィールド自体を削除可能',
    ],
  },
  // ── 12. isContra系 ──
  {
    id: '②-6', phase: 2, code: 'isContraRevenue / isContraExpense', typeName: 'boolean', japanese: '逆仕訳許容フラグ',
    definedAt: '科目マスタの属性。マスタ独自定義',
    purpose: '#7(CATEGORY_CONFLICT)の例外判定。収益科目が借方にある場合（売上返品）、費用科目が貸方にある場合（仕入返品）に警告を抑制する。',
    allValues: [
      { value: 'true', label: '逆方向を許容', note: '売上値引・返品（Revenue）: 個人/法人各1件。仕入値引・返品（Expense）: 個人/法人各1件。計4件のみ', highlight: true },
      { value: 'false / undefined', label: '通常科目', note: 'その他全科目。逆方向にあれば#7で警告', highlight: false },
    ],
    roles: [
      { role: '#7の例外判定', sufficient: false, description: '4件のみtrue。返品用voucher_typeが存在しないため、このフラグだけが防波堤' },
    ],
    problems: [
      '4件のみにtrue。ユーザーが「売上高」科目（isContraRevenue=false）で返品仕訳を作ると#7で警告→確認ダイアログが必要',
      '返品・値引のvoucher_typeが存在しないため、isContraフラグだけが防波堤になっている。本来は#8のホワイトリストで精密に制御すべき',
    ],
    proposal: [
      'voucher_typeに返品・値引を追加すれば、isContraフラグへの依存度を下げられる',
    ],
  },
  // ── 13. TaxDirection ──
  {
    id: '②-7', phase: 2, code: 'direction（税区分）', typeName: 'TaxDirection', japanese: '税区分の方向（3種）',
    definedAt: 'src/types/shared-tax-category.ts。マスタ独自定義。MFにはない',
    purpose: '#9(TAX_ACCOUNT_MISMATCH)で科目のtaxDeterminationと組合せて、科目の期待する方向と税区分の方向が一致するかを判定する。',
    allValues: [
      { value: 'sales', label: '売上方向', note: '売上系の税区分（課税売上等）', highlight: false },
      { value: 'purchase', label: '仕入方向', note: '仕入系の税区分（課税仕入等）', highlight: false },
      { value: 'common', label: '共通/対象外', note: '対象外・不課税等（どの科目にも使える）', highlight: false },
    ],
    roles: [
      { role: '#9: 科目の期待方向との一致判定', sufficient: true, description: 'taxDeterminationと組合せて判定' },
    ],
    problems: [
      'taxDetermination廃止に伴い、direction直接参照方式への移行が必要。ただしdirection自体は正しい概念なので残る',
      '⚠️ 仕訳方向のDirection（A2）/ 行方向のLineItemDirection（A3）とは全く別の概念。値も異なる（sales/purchase vs expense/income）',
    ],
    proposal: [
      'taxDetermination廃止後は、科目のdefaultTaxCategoryId → 税区分マスタのdirectionを直接参照して方向判定する',
    ],
  },
  // ── 14. simplifiedOnly ──
  {
    id: '②-8', phase: 2, code: 'simplifiedOnly', typeName: 'boolean', japanese: '簡易課税専用フラグ',
    definedAt: '税区分マスタの属性。マスタ独自定義',
    purpose: '原則課税の顧問先で簡易課税専用の税区分を使用した場合に矛盾を検出する。baseIdと組合せて原則用への自動修正にも使用。',
    allValues: [
      { value: 'true', label: '簡易課税のみ使用可', note: '48件がtrue。原則課税で使うと矛盾', highlight: false },
      { value: 'false / undefined', label: '全方式で使用可', note: 'その他全件', highlight: false },
    ],
    roles: [
      { role: '課税方式矛盾判定', sufficient: true, description: 'isTaxCategoryInvalidForMode()で判定' },
      { role: '原則用への自動修正', sufficient: true, description: 'baseIdフィールドで対応する原則用税区分を特定' },
    ],
    problems: [],
    proposal: [],
  },
  // ── 15. consumptionTaxMode ──
  {
    id: '②-9', phase: 2, code: 'consumptionTaxMode', typeName: 'string', japanese: '課税方式（3種）',
    definedAt: '顧問先設定。MFのconsumption_tax_calculation_methodから変換',
    purpose: '顧問先の消費税の申告方式を表す。simplifiedOnly/isExemptDefaultフラグと組合せて、税区分フィルタと矛盾判定に使用。',
    allValues: [
      { value: 'exempt', label: '免税事業者', note: 'isExemptDefault=true以外の税区分は使用不可', highlight: false },
      { value: 'individual', label: '原則課税/個別対応方式', note: 'simplifiedOnly=trueの税区分は使用不可', highlight: false },
      { value: 'proportional', label: '原則課税/一括比例配分方式', note: '同上', highlight: false },
    ],
    roles: [
      { role: '課税方式矛盾判定', sufficient: true, description: 'isTaxCategoryInvalidForMode()の入力' },
    ],
    problems: [],
    proposal: [],
  },
]

// ── computed: フェーズ別フィルタ ──
const phase1Terms = computed(() => glossaryTerms.filter(t => t.phase === 1))
const bridgeTerms = computed(() => glossaryTerms.filter(t => t.phase === 0))
const phase2Terms = computed(() => glossaryTerms.filter(t => t.phase === 2))

// ── 同名別概念: direction（3種） ──
const directionComparison = [
  { label: '書類方向', typeName: 'Direction', level: '書類レベル', values: ['expense', 'income', 'transfer', 'mixed'], phaseLabel: '①', phaseClass: 'badge-phase1', usage: '書類の入出金方向。mixed=入出金混在' },
  { label: '行方向', typeName: 'LineItemDirection', level: '行レベル', values: ['expense', 'income'], phaseLabel: '①', phaseClass: 'badge-phase1', usage: '1行の入出金方向。VOUCHER_TYPE_MAPの入力' },
  { label: '税区分方向', typeName: 'TaxDirection', level: 'マスタ属性', values: ['sales', 'purchase', 'common'], phaseLabel: '②', phaseClass: 'badge-phase2', usage: '#9の科目×税区分の方向一致判定' },
]

// ── 導出チェーン図 ──
const derivationChain = `source_type（12種）
  ├→ VOUCHER_TYPE_MAP × LineItemDirection（行方向・2種）
  │    └→ resolveVoucherType()
  │         └→ voucher_type（7種+null）
  │              └→ VOUCHER_TYPE_RULES
  │                   └→ validateByVoucherType()  ← #8
  │                        ├ allowedGroups  ← accountGroup
  │                        ├ allowedIds     ← accountId
  │                        └ allowedCategories ← category
  ├→ PROCESSING_MODE_MAP → ProcessingMode（3種）
  └→ SOURCE_CATEGORY_MAP → SourceCategory（4種）

accountGroup（5種）
  └→ getMegaGroup() → MegaGroupType（4種）
       └→ validateDebitCreditCombination()  ← #7
            └ isContraRevenue / isContraExpense（例外判定）

taxDetermination（3種）× TaxDirection（3種）
  └→ #9: TAX_ACCOUNT_MISMATCH

consumptionTaxMode（3種）× simplifiedOnly / isExemptDefault
  └→ isTaxCategoryInvalidForMode()

全チェック統合:
  └→ syncWarningLabelsCore()  ← #1〜#13`

// ============================================================
// 行の型定義（全セクションで統一）
// ============================================================
type FieldRow = {
  field: string
  label: string
  mf: string
  master: string
  validation: string
  side: string
  note: string
  highlight: boolean
}

// ============================================================
// セクション1: 勘定科目 — フィールド遷移（全フィールド網羅）
// ============================================================
const fieldSections: { title: string; note: string; hasMf: boolean; hasMaster: boolean; rows: FieldRow[] }[] = [
  {
    title: '📋 勘定科目 — フィールド遷移',
    note: 'MFのMCPから取得した科目データが、マスタ管理を経てバリデーションでどう使われるか。AccountForValidation型（7フィールド）+ Account型の全フィールドを網羅。',
    hasMf: true,
    hasMaster: true,
    rows: [
      // --- バリデーションで使用する7フィールド（AccountForValidation型） ---
      { field: 'accountId',            label: '科目ID',                 mf: '🔄', master: '✅', validation: '全チェックの起点。仕訳行のaccount（選択された科目ID）でマスタを検索し以下の属性を取得。#1(ACCOUNT_UNKNOWN)で存在チェック。#8(allowedIds)でIDそのものをホワイトリスト照合',  side: 'both',  note: 'MFのBase64 IDをローマ字IDに変換', highlight: true },
      { field: 'accountGroup',         label: '大分類',                 mf: '🔄', master: '✅', validation: '#7(CATEGORY_CONFLICT): 4分類に変換し借方×貸方の組合せ判定。#8(VOUCHER_TYPE_CONFLICT): allowedGroupsでホワイトリスト照合',  side: 'both',  note: 'MFの5分類→マスタの大分類→4分類', highlight: true },
      { field: 'category',            label: '科目分類',               mf: '✅', master: '✅', validation: '#8(VOUCHER_TYPE_CONFLICT): allowedCategoriesでホワイトリスト照合。accountGroupのallowedGroups、accountIdのallowedIdsと合わせて3方式で判定',  side: 'both',  note: 'CASH_AND_DEPOSITS等。証票意味とは別の概念', highlight: true },
      { field: 'defaultTaxCategoryId', label: '既定の税区分',           mf: '🔄', master: '✅', validation: '#9(TAX_ACCOUNT_MISMATCH): taxDetermination=fixedの場合、この値と仕訳行の税区分IDが完全一致するか判定',  side: 'both',  note: 'MFのBase64 IDをマスタIDに変換', highlight: true },
      { field: 'taxDetermination',     label: '税区分判定方式',         mf: '❌', master: '✅', validation: '#9(TAX_ACCOUNT_MISMATCH): fixed=既定税区分と完全一致必須、auto_purchase=売上方向の税区分なら矛盾、auto_sales=仕入方向の税区分なら矛盾（廃止検討中→既定税区分のdirectionを直接参照する方式へ移行予定）', side: 'both', note: 'fixed/auto_purchase/auto_salesの3値', highlight: true },
      { field: 'isContraRevenue',      label: '逆仕訳許容（収益）',     mf: '❌', master: '✅', validation: '#7(CATEGORY_CONFLICT)の例外: この科目が借方にあっても「収益が借方にある」警告を出さない（売上返品の振替仕訳用）', side: 'both', note: '2科目×2対象=計4件。売上値引・返品（個人/法人各1件）', highlight: true },
      { field: 'isContraExpense',      label: '逆仕訳許容（費用）',     mf: '❌', master: '✅', validation: '#7(CATEGORY_CONFLICT)の例外: この科目が貸方にあっても「費用が貸方にある」警告を出さない（仕入返品の振替仕訳用）', side: 'both', note: '2科目×2対象=計4件。仕入値引・返品（個人/法人各1件）', highlight: true },
      // --- マスタ管理フィールド（バリデーション不使用） ---
      { field: 'name',                 label: '科目名',                 mf: '✅', master: '✅', validation: '判定には不使用。画面表示・警告メッセージの科目名表示に使用',  side: 'front', note: '', highlight: false },
      { field: 'target',              label: '事業形態',               mf: '❌', master: '✅', validation: '—（科目一覧の法人/個人フィルタで使用）',  side: 'back',  note: 'corp / individual', highlight: false },
      { field: 'effectiveFrom',        label: '適用開始日',             mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'effectiveTo',          label: '適用終了日',             mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'sortOrder',           label: '表示順',                 mf: '❌', master: '✅', validation: '—（科目プルダウンの表示順）',  side: 'front', note: '', highlight: false },
      { field: 'hidden',              label: '非表示フラグ',           mf: '❌', master: '✅', validation: '—（顧問先別の科目表示/非表示制御）',  side: 'front', note: '', highlight: false },
      { field: 'hiddenInMaster',      label: '全社マスタ非表示',       mf: '❌', master: '📊', validation: '—（deprecated=trueから導出。全社マスタ画面の表示制御）',  side: 'front', note: '導出値。26箇所以上で使用', highlight: false },
      { field: 'deprecated',          label: '廃止フラグ',             mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'source',              label: '出所',                   mf: '❌', master: '✅', validation: '—（default/mf/master-custom/client-custom）',  side: 'back',  note: '', highlight: false },
      { field: 'isCustom',            label: 'カスタム科目フラグ',     mf: '❌', master: '✅', validation: '—（現在は全件false）',  side: 'back',  note: '', highlight: false },
      { field: 'isMasterCustom',      label: 'マスタカスタム',         mf: '❌', master: '✅', validation: '—（現在は全件false）',  side: 'back',  note: '', highlight: false },
      { field: 'isClientCustom',      label: '顧問先カスタム',         mf: '❌', master: '✅', validation: '—（現在は全件false）',  side: 'back',  note: '', highlight: false },
      { field: 'sub',                 label: '補助科目',               mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'insertAfter',         label: '挿入位置ID',             mf: '❌', master: '✅', validation: '—（表示順復元用）',  side: 'back',  note: '', highlight: false },
      // --- MF連携フィールド（顧問先データのみ） ---
      { field: 'mfAccountId',         label: 'MF科目ID',              mf: '✅', master: '✅', validation: '—（MF仕訳送信時のaccount_idに使用。顧問先データのみ）',  side: 'back',  note: 'Base64。事業者固有', highlight: false },
      { field: 'mfAccountGroup',      label: 'MF大分類（原値）',       mf: '✅', master: '✅', validation: '—（MFの5分類を原値のまま保存。顧問先データのみ）',  side: 'back',  note: 'ASSET/LIABILITY等', highlight: false },
      { field: 'mfFinancialStatementType', label: 'MF財務諸表種別',   mf: '✅', master: '✅', validation: '—（BS/PL/不動産の区別。顧問先データのみ）',  side: 'back',  note: 'BALANCE_SHEET/PROFIT_LOSS/REAL_ESTATE', highlight: false },
    ],
  },
  // ============================================================
  // セクション2: 税区分 — フィールド遷移（全フィールド網羅）
  // ============================================================
  {
    title: '💰 税区分 — フィールド遷移',
    note: 'MFのMCPから取得した税区分データが、マスタ管理を経てバリデーションでどう使われるか。TaxCategoryForValidation型（6フィールド）+ TaxCategory型の全フィールドを網羅。',
    hasMf: true,
    hasMaster: true,
    rows: [
      // --- バリデーションで使用する6フィールド（TaxCategoryForValidation型） ---
      { field: 'taxCategoryId',   label: '税区分ID',           mf: '🔄', master: '✅', validation: '仕訳行のtax_category_idでマスタを検索し以下の属性を取得。#2(TAX_UNKNOWN)で存在チェック',  side: 'both',  note: 'MFのBase64 IDをマスタIDに変換', highlight: true },
      { field: 'direction',       label: '方向（売上/仕入/共通）', mf: '❌', master: '✅', validation: '#9(TAX_ACCOUNT_MISMATCH): 科目のtaxDeterminationと組合せ、科目の期待する方向と税区分の方向が一致するかを判定',  side: 'both', note: 'sales/purchase/common。マスタ独自定義', highlight: true },
      { field: 'simplifiedOnly',  label: '簡易課税専用',       mf: '❌', master: '✅', validation: '課税方式チェック: 顧問先が原則課税の場合にtrueの税区分は使用不可（isTaxCategoryInvalidForMode関数）',  side: 'both',  note: '48件がtrue', highlight: true },
      { field: 'baseId',          label: '基本税区分ID',       mf: '❌', master: '✅', validation: '課税方式不一致の修正: 簡易課税専用税区分から原則用の対応税区分を特定（resolveTaxCategoryForMode関数）',  side: 'both',  note: '48件に設定', highlight: false },
      { field: 'isExemptDefault', label: '免税時の既定',       mf: '❌', master: '✅', validation: '免税事業者の判定: 免税事業者はこの税区分（対象外）以外を使用すると矛盾（isTaxCategoryInvalidForMode関数）',  side: 'both',  note: '1件のみtrue', highlight: true },
      { field: 'isUnknownDefault', label: '不明（未確定）税区分', mf: '❌', master: '✅', validation: '免税事業者の判定: 免税時でもこの税区分は一時保存用として許容（isTaxCategoryInvalidForMode関数）',  side: 'both',  note: '1件のみtrue', highlight: true },
      // --- マスタ管理フィールド（バリデーション不使用） ---
      { field: 'name',            label: '税区分名',           mf: '✅', master: '✅', validation: '判定には不使用。画面表示・警告メッセージの税区分名表示に使用',  side: 'front', note: '「課税売上 10%」等', highlight: false },
      { field: 'shortName',       label: '省略名',             mf: '🔄', master: '✅', validation: '—（UI表示用。MFのabbreviationから変換）',  side: 'front', note: '課売 10%', highlight: false },
      { field: 'taxRate',         label: '税率',               mf: '✅', master: '✅', validation: '—（画面表示で使用）',  side: 'front', note: '0.1 = 10%', highlight: false },
      { field: 'qualified',       label: '適格判定対象',       mf: '❌', master: '✅', validation: '—（インボイス関連。3件がtrue）',  side: 'back',  note: '', highlight: false },
      { field: 'individualOnly',  label: '個別対応方式専用',   mf: '❌', master: '✅', validation: '—（個別対応方式でのみ使用可。48件がtrue）',  side: 'both',  note: '', highlight: false },
      { field: 'isSalesDefault',  label: '売上系の既定',       mf: '❌', master: '✅', validation: '—（新規売上科目のデフォルト税区分。1件のみtrue）',  side: 'back',  note: '', highlight: false },
      { field: 'isPurchaseDefault', label: '仕入系の既定',     mf: '❌', master: '✅', validation: '—（新規仕入科目のデフォルト税区分。1件のみtrue）',  side: 'back',  note: '', highlight: false },
      { field: 'aiSelectable',    label: 'AI自動選択可否',     mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'active',          label: '利用可否',           mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'deprecated',      label: '廃止フラグ',         mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'defaultVisible',  label: 'デフォルト表示',     mf: '❌', master: '✅', validation: '—（27件がtrue）',  side: 'front', note: '', highlight: false },
      { field: 'displayOrder',    label: '表示順',             mf: '❌', master: '✅', validation: '—',  side: 'front', note: '', highlight: false },
      { field: 'effectiveFrom',   label: '適用開始日',         mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'effectiveTo',     label: '適用終了日',         mf: '❌', master: '✅', validation: '—',  side: 'back',  note: '', highlight: false },
      { field: 'source',          label: '出所',               mf: '❌', master: '✅', validation: '—（mf/master/custom/default等）',  side: 'back',  note: '', highlight: false },
      { field: 'mfTaxId',         label: 'MF税区分ID',         mf: '✅', master: '✅', validation: '—（MF仕訳送信時のtax_idに使用。顧問先データのみ）',  side: 'back',  note: 'Base64。事業者固有', highlight: false },
    ],
  },
  // ============================================================
  // セクション3: 証票意味 — 導出フロー（スグスル独自の概念）
  // ============================================================
  {
    title: '🏷️ 証票意味 — 導出フロー（スグスル独自。MFにはない）',
    note: '証票意味（voucher_type）はMFのフィールドではなく、証票種類（レシート/通帳/振替伝票等）からスグスル内部で導出される値。#8(VOUCHER_TYPE_CONFLICT)のルール選択キーとして使用。',
    hasMf: false,
    hasMaster: false,
    rows: [
      { field: 'voucher_type', label: '証票意味', mf: '', master: '', validation: '#8のルール選択キー。この値で証票意味ルールテーブル（voucherTypeRules.ts）を検索。経費/売上/クレカ/クレカ引落/給与/立替経費/振替の7種。nullの仕訳は#8をスキップ',  side: 'front', note: '証票種類から導出: 通帳出金→経費、レシート→経費、振替伝票→振替、通帳入金→null、手入力→null', highlight: true },
    ],
  },
  // ============================================================
  // セクション4: 仕訳行 — バリデーション入力値
  // ============================================================
  {
    title: '📝 仕訳行 — バリデーション入力値',
    note: 'ユーザーが仕訳一覧画面で入力・選択する値。マスタの属性ではなく仕訳データとして保存される。バリデーションはこの入力値をキーにしてマスタを検索し、上記の属性を取得して判定する。',
    hasMf: false,
    hasMaster: false,
    rows: [
      { field: 'account',            label: '選択された科目ID',   mf: '', master: '', validation: 'マスタ検索のキー。この値で科目マスタからaccountGroup/category/defaultTaxCategoryId/taxDetermination/isContra系を取得し、#1/#7/#8/#9/#12で使用',  side: 'front', note: '科目セルで選択', highlight: true },
      { field: 'tax_category_id',    label: '選択された税区分ID', mf: '', master: '', validation: '#9(TAX_ACCOUNT_MISMATCH): この値で税区分マスタからdirectionを取得し科目の方向と照合。#2(TAX_UNKNOWN): 未入力またはマスタ未存在なら警告',  side: 'front', note: '税区分セルで選択', highlight: true },
      { field: 'amount',             label: '金額',               mf: '', master: '', validation: '#6(DEBIT_CREDIT_MISMATCH): 借方全行の合計と貸方全行の合計が一致するか判定。#5(AMOUNT_UNCLEAR): 未入力なら警告。#13(AUTO_INVOICE_SMALL): 合計額が1万円未満かの判定にも使用',  side: 'front', note: '金額セルに入力', highlight: false },
      { field: 'voucher_date',       label: '取引日',             mf: '', master: '', validation: '#4(DATE_UNKNOWN): 未入力なら警告。#10(FUTURE_DATE): 未来日なら警告。#11(DATE_OUT_OF_RANGE): 会計期間外なら警告',  side: 'front', note: '日付セルに入力', highlight: false },
      { field: 'description',        label: '摘要',               mf: '', master: '', validation: '#3(DESCRIPTION_UNKNOWN): 空欄なら警告',  side: 'front', note: '摘要セルに入力', highlight: false },
      { field: 'invoice_status',     label: 'インボイスステータス', mf: '', master: '', validation: '#13(AUTO_INVOICE_SMALL): 未設定かつ金額1万円未満かつ経過措置期間内なら少額特例として自動適格判定',  side: 'front', note: '適格/非適格/区分なし', highlight: false },
    ],
  },
  // ============================================================
  // セクション5: 仕訳 — バリデーション制御フィールド
  // ============================================================
  {
    title: '⚙️ 仕訳 — バリデーション制御フィールド',
    note: 'バリデーションの動作を制御するフィールド。ユーザー入力ではなくシステムが管理する。',
    hasMf: false,
    hasMaster: false,
    rows: [
      { field: 'journalId',          label: '仕訳ID',             mf: '', master: '', validation: 'JournalForValidation型の必須フィールド。警告ログ等で仕訳の特定に使用',  side: 'both', note: '', highlight: false },
      { field: 'labels',             label: '警告ラベル配列',     mf: '', master: '', validation: 'バリデーション結果の格納先。syncWarningLabelsCoreが直接mutateして警告を追加/除去する',  side: 'both', note: '["CATEGORY_CONFLICT", ...]', highlight: false },
      { field: 'warning_details',    label: '警告詳細メッセージ', mf: '', master: '', validation: '各警告の詳細メッセージ（日本語）を格納。ツールチップ表示に使用',  side: 'both', note: '{ "CATEGORY_CONFLICT": "費用×収益..." }', highlight: false },
      { field: 'warning_dismissals', label: '確認済み警告',       mf: '', master: '', validation: 'ユーザーが「確認済み」にした警告タイプの配列。この配列に含まれる警告はバリデーション時にスキップされる',  side: 'both', note: '["CATEGORY_CONFLICT", ...]', highlight: false },
    ],
  },
  // ============================================================
  // セクション6: バリデーションコンテキスト（顧問先情報）
  // ============================================================
  {
    title: '🏢 バリデーションコンテキスト（ValidationContext）',
    note: '顧問先ごとの設定値。syncWarningLabelsCoreの第5引数（context）で渡される。',
    hasMf: false,
    hasMaster: false,
    rows: [
      { field: 'fiscalMonth',              label: '決算月（1-12）',       mf: '', master: '', validation: '#11(DATE_OUT_OF_RANGE): この値から会計年度の開始月を算出し、仕訳の取引日が期間内かを判定',  side: 'both', note: '個人事業主=12', highlight: false },
      { field: 'directorLoanAccountIds',   label: '役員貸付金科目IDリスト', mf: '', master: '', validation: '#12(DIRECTOR_LOAN): 仕訳行の科目IDがこのリストに含まれていたら警告',  side: 'both', note: 'デフォルト=["OFFICER_LOANS"]', highlight: false },
    ],
  },
]

// ============================================================
// バリデーションルール対応表（実コードの番号と一致）
// ============================================================
const validationRules = [
  { num: '#1',  id: 'ACCOUNT_UNKNOWN',         name: '科目不明',             fields: 'account（科目ID）→ 科目マスタに存在するかチェック',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#2',  id: 'TAX_UNKNOWN',             name: '税区分不明/未入力',    fields: 'tax_category_id（税区分ID）→ 未入力チェック + 税区分マスタに存在するかチェック',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#3',  id: 'DESCRIPTION_UNKNOWN',     name: '摘要未入力',           fields: 'description（摘要）',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#4',  id: 'DATE_UNKNOWN',            name: '日付未入力',           fields: 'voucher_date（取引日）',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#5',  id: 'AMOUNT_UNCLEAR',          name: '金額未入力',           fields: 'amount（金額）',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#6',  id: 'DEBIT_CREDIT_MISMATCH',   name: '貸借不一致',           fields: 'amount（金額）× 借方全行 + 貸方全行の合計比較',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#7',  id: 'CATEGORY_CONFLICT',       name: '貸借組合せ矛盾',       fields: 'accountGroup→4分類変換 + isContraRevenue/isContraExpense（逆仕訳例外）。二重ループで全ペアチェック',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#7b', id: 'SAME_ACCOUNT_BOTH_SIDES', name: '借方貸方に同一科目',   fields: 'account（科目ID）× 借方全行と貸方全行の集合比較',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#8',  id: 'VOUCHER_TYPE_CONFLICT',   name: '証票意味ルール矛盾',   fields: 'voucher_type（証票意味） → ルールテーブル → allowedGroups(accountGroup) / allowedIds(accountId) / allowedCategories(category) の3方式で判定',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#9',  id: 'TAX_ACCOUNT_MISMATCH',    name: '科目×税区分矛盾',     fields: 'taxDetermination + defaultTaxCategoryId + direction（税区分の方向）。科目の期待する方向と選択された税区分の方向を照合',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#10', id: 'FUTURE_DATE',             name: '未来日付',             fields: 'voucher_date（取引日）。翌日以降なら警告',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#11', id: 'DATE_OUT_OF_RANGE',       name: '期間外日付',           fields: 'voucher_date + fiscalMonth（決算月。ValidationContext）。会計年度の開始月〜決算月末の範囲外なら警告',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#12', id: 'DIRECTOR_LOAN',           name: '役員貸付金検出',       fields: 'account（科目ID）+ directorLoanAccountIds（ValidationContext）。一致する科目があれば警告',  sideClass: 'side-both',  sideLabel: '共用' },
  { num: '#13', id: 'AUTO_INVOICE_SMALL',      name: '少額自動適格判定',     fields: 'amount（金額合計 < 1万円）+ invoice_status（未設定）+ voucher_date（経過措置期間内）',  sideClass: 'side-both',  sideLabel: '共用' },
]

// ============================================================
// MF 5分類 → マスタ 4分類 変換表
// ============================================================
const megaGroupConversions = [
  { mf: 'ASSET',     mfLabel: '資産',   master: 'BS_ASSET',     mega: 'bs_al',     megaLabel: 'B/S資産負債', megaClass: 'mega-bs' },
  { mf: 'LIABILITY', mfLabel: '負債',   master: 'BS_LIABILITY', mega: 'bs_al',     megaLabel: 'B/S資産負債', megaClass: 'mega-bs' },
  { mf: 'CAPITAL',   mfLabel: '資本',   master: 'BS_EQUITY',    mega: 'bs_equity', megaLabel: 'B/S純資産',   megaClass: 'mega-eq' },
  { mf: 'REVENUE',   mfLabel: '収益',   master: 'PL_REVENUE',   mega: 'sales',     megaLabel: '売上',        megaClass: 'mega-sales' },
  { mf: 'EXPENSE',   mfLabel: '費用',   master: 'PL_EXPENSE',   mega: 'expense',   megaLabel: '経費',        megaClass: 'mega-expense' },
]

// ============================================================
// MFにあるが未使用のフィールド一覧
// ============================================================
const unusedFields = [
  {
    title: '🔍 未使用フィールド — 事業者情報（currentOffice）',
    note: 'MFの事業者情報から取得できるが、マスタ管理・バリデーションで使っていないフィールド',
    rows: [
      { field: 'is_real_estate',                label: '不動産所得フラグ',       status: '△ 顧問先のhasRentalIncomeに保存済。バリデーション未使用',  sample: 'true（個人で不動産あり）' },
      { field: 'is_manufacturing',              label: '製造原価報告書フラグ',   status: '❌ 保存も利用もなし',                                       sample: 'false' },
      { field: 'employee_count',                label: '従業員数区分',           status: '❌ 保存も利用もなし',                                       sample: 'NOT_SELECTED（法人のみ）' },
      { field: 'pl_name_value_display_option',  label: 'PL表示オプション',       status: '❌ 保存も利用もなし',                                       sample: 'SWITCH_NAME_AND_VALUE（法人のみ）' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 会計年度設定（getTermSettings）',
    note: '',
    rows: [
      { field: 'accounting_method',          label: '経理方式（税込/税抜）',   status: '❌ 保存も利用もなし',  sample: 'TAX_EXCLUDED_INCLUDED（法人のみ）' },
      { field: 'business_types',             label: '業種',                   status: '❌ 保存も利用もなし',  sample: '["SERVICES"]（個人）/ []（法人）' },
      { field: 'prefecture',                 label: '都道府県',               status: '❌ 保存も利用もなし',  sample: '〇〇府' },
      { field: 'sales_rounding_method',      label: '売上消費税端数処理',     status: '❌ 保存も利用もなし',  sample: 'ROUND_DOWN（切り捨て）' },
      { field: 'purchases_rounding_method',  label: '仕入消費税端数処理',     status: '❌ 保存も利用もなし',  sample: 'ROUND_DOWN（切り捨て）' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 勘定科目（getAccounts）',
    note: '',
    rows: [
      { field: 'financial_statement_type',  label: '財務諸表種別（BS/PL/不動産）',  status: '△ 顧問先科目にmfFinancialStatementTypeとして保存済。バリデーション未使用',  sample: 'BALANCE_SHEET / PROFIT_LOSS / REAL_ESTATE' },
      { field: 'available',                 label: '利用可否',                     status: '△ インポート時に参照。マスタには未保存',                                    sample: 'true / false' },
      { field: 'search_key',                label: '検索キー',                     status: '❌ 保存も利用もなし',                                                       sample: '（空文字が多い）' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 税区分（getTaxes）',
    note: '',
    rows: [
      { field: 'abbreviation',  label: '略称',      status: '△ shortNameとして保存済。UI未表示',  sample: '課売 10%' },
      { field: 'search_key',    label: '検索キー',  status: '❌ 保存も利用もなし',                 sample: '（空文字が多い）' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 仕訳本体（getJournals）',
    note: '',
    rows: [
      { field: 'number',            label: '仕訳番号',         status: '❌ 保存も利用もなし',  sample: '1, 2, 3...（MF側の連番）' },
      { field: 'entered_by',        label: '入力方法',         status: '❌ 保存も利用もなし',  sample: 'JOURNAL_TYPE_AI_OCR / JOURNAL_TYPE_MANUAL 等' },
      { field: 'is_realized',       label: '実現済みフラグ',   status: '❌ 保存も利用もなし',  sample: 'true / false' },
      { field: 'tags',              label: 'タグ配列',         status: '❌ 保存も利用もなし',  sample: '[]（空配列が多い）' },
      { field: 'term_period',       label: '所属会計年度',     status: '❌ 保存も利用もなし',  sample: '2026 等' },
      { field: 'create_time',       label: '作成日時',         status: '❌ 保存も利用もなし',  sample: '2025-03-09T10:00:00+09:00' },
      { field: 'update_time',       label: '更新日時',         status: '❌ 保存も利用もなし',  sample: '2025-03-09T10:00:00+09:00' },
      { field: 'voucher_file_ids',  label: '証憑ファイルID配列', status: '❌ 保存も利用もなし', sample: '["xxxxxxxx-..."]' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 仕訳行の借方/貸方（branches[].debitor/creditor）',
    note: '',
    rows: [
      { field: 'account_name',       label: '科目名（名前解決済）',   status: '❌ 自前で名前解決しているため不使用',  sample: '消耗品費 等' },
      { field: 'tax_name',           label: '税区分名',               status: '❌ 自前で名前解決しているため不使用',  sample: '課税仕入 10%' },
      { field: 'tax_long_name',      label: '税区分正式名',           status: '❌ 同上',                             sample: '課税対象仕入れ 10%' },
      { field: 'tax_value',          label: '税額',                   status: '❌ 保存も利用もなし',                 sample: '114（円）' },
      { field: 'department_id',      label: '部門ID',                 status: '❌ 保存も利用もなし',                 sample: 'null（未設定が多い）' },
      { field: 'department_name',    label: '部門名',                 status: '❌ 同上',                             sample: 'null' },
      { field: 'sub_account_id',     label: '補助科目ID',             status: '❌ 保存も利用もなし',                 sample: 'null / xxxxxxxx...' },
      { field: 'sub_account_name',   label: '補助科目名',             status: '❌ 同上',                             sample: 'null / 小口現金' },
      { field: 'trade_partner_code', label: '取引先コード',           status: '❌ 保存も利用もなし',                 sample: 'null / A0000000001' },
      { field: 'trade_partner_name', label: '取引先名',               status: '❌ 同上',                             sample: 'null / サンプル商事' },
    ],
  },
  {
    title: '🔍 未使用フィールド — 取引先（getTradePartners）',
    note: '',
    rows: [
      { field: 'search_key',                    label: '検索キー',             status: '❌ 保存も利用もなし',  sample: '（空文字）' },
      { field: 'corporate_number',              label: '法人番号',             status: '❌ 保存も利用もなし',  sample: '""（未登録は空文字）' },
      { field: 'invoice_registration_number',   label: 'インボイス登録番号',   status: '❌ 保存も利用もなし',  sample: '""（T+13桁）' },
      { field: 'available',                     label: '利用可否',             status: '❌ 保存も利用もなし',  sample: 'true / false' },
    ],
  },
]
</script>

<style scoped>
.page { height: 100%; overflow-y: auto; background: #f8fafc; font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; }
.page-header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 28px 32px 20px; position: sticky; top: 0; z-index: 10; }
.page-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.page-sub { font-size: 12px; opacity: .8; margin: 0; }
.page-body { padding: 20px 28px; max-width: 1400px; }
.card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin-bottom: 16px; }
.card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }

/* フロー図 */
.flow-diagram { display: flex; align-items: center; gap: 12px; padding: 16px 0; flex-wrap: wrap; }
.flow-box { flex: 1; min-width: 180px; padding: 16px; border-radius: 8px; text-align: center; }
.flow-mf { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; }
.flow-master { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #3b82f6; }
.flow-journal { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; }
.flow-label { font-size: 14px; font-weight: 700; color: #0f172a; }
.flow-desc { font-size: 11px; color: #64748b; margin-top: 4px; }
.flow-side { font-size: 10px; color: #94a3b8; margin-top: 4px; }
.flow-arrow { font-size: 24px; color: #94a3b8; font-weight: 700; }

/* テーブル */
.table-scroll { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.tbl th { background: #f8fafc; padding: 7px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
.tbl td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
.tbl tr:last-child td { border-bottom: none; }
.tbl.compact td { padding: 5px 8px; }
.row-highlight { background: #fefce8; }
code { font-family: monospace; font-size: 11px; color: #0369a1; background: #f0f9ff; padding: 1px 4px; border-radius: 3px; white-space: nowrap; }
.center-cell { text-align: center; }
.label-cell { font-weight: 600; white-space: nowrap; }
.validation-cell { color: #1e40af; font-size: 11px; max-width: 420px; }
.note-cell { color: #64748b; font-size: 11px; max-width: 240px; }
.field-list { font-size: 11px; color: #334155; }
.note { font-size: 11px; color: #64748b; background: #f8fafc; border-left: 3px solid #94a3b8; padding: 7px 12px; margin: 0 0 12px; border-radius: 0 4px 4px 0; }

/* 用語表の値タグ */
.values-cell { max-width: 360px; }
.value-tag { display: inline-block; background: #f1f5f9; color: #334155; padding: 1px 6px; margin: 1px 2px; border-radius: 3px; font-size: 10px; font-family: monospace; white-space: nowrap; }

/* バッジ */
.badge { display: inline-block; padding: 1px 7px; border-radius: 9999px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.badge-ok { background: #dcfce7; color: #15803d; }
.badge-conv { background: #e0f2fe; color: #0369a1; }
.badge-derived { background: #fef3c7; color: #b45309; }
.badge-no { background: #f1f5f9; color: #94a3b8; }

/* フロント/バック バッジ */
.side-badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
.side-both { background: #e0e7ff; color: #4338ca; }
.side-back { background: #fce7f3; color: #be185d; }
.side-front { background: #d1fae5; color: #065f46; }

/* 4分類バッジ */
.mega-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.mega-bs { background: #e0f2fe; color: #0369a1; }
.mega-eq { background: #f3e8ff; color: #7c3aed; }
.mega-sales { background: #dcfce7; color: #15803d; }
.mega-expense { background: #fee2e2; color: #b91c1c; }

/* 列幅 */
.col-field { width: 160px; }
.col-label { width: 140px; }
.col-mf { width: 80px; text-align: center; }
.col-master { width: 80px; text-align: center; }
.col-validation { width: 420px; }
.col-side { width: 80px; text-align: center; }
.col-note { width: 200px; }
.col-term-en { width: 220px; }
.col-term-ja { width: 160px; }
.col-term-values { width: 360px; }

/* 導出チェーン図 */
.chain-diagram { font-family: monospace; font-size: 12px; line-height: 1.7; color: #1e3a5f; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 0; white-space: pre; overflow-x: auto; }

/* 型名コード */
.type-code { font-size: 10px; color: #7c3aed; background: #f3e8ff; }

/* 完全再定義カード */
.term-card { border-left: 3px solid #3b82f6; }
.term-bridge { border-left-color: #f59e0b; }
.term-section { margin: 12px 0 0; }
.term-heading { font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 6px; padding: 0; }
.term-text { font-size: 12px; color: #334155; margin: 0; line-height: 1.6; }
.problem-list, .proposal-list { margin: 0; padding: 0 0 0 18px; font-size: 11px; line-height: 1.7; }
.problem-list li { color: #b91c1c; }
.proposal-list li { color: #0369a1; }

/* フェーズヘッダーカード */
.phase-card { border-left: 4px solid; }
.phase-ai { border-left-color: #3b82f6; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); }
.phase-ai .card-title { color: #1d4ed8; }
.phase-bridge { border-left-color: #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); }
.phase-bridge .card-title { color: #b45309; }
.phase-human { border-left-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%); }
.phase-human .card-title { color: #047857; }

/* フェーズバッジ */
.badge-phase1 { background: #dbeafe; color: #1d4ed8; }
.badge-phase2 { background: #d1fae5; color: #047857; }
</style>
