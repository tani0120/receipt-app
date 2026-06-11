<template>
  <div ref="pageRef" class="page" @scroll="handleScroll">
    <div class="page-header">
      <h1 class="page-title">📋 バリデーションルール一覧</h1>
      <p class="page-sub">外形的に判断できるバリデーション・異常値検知（{{ totalRules }}件・{{ categories.length }}カテゴリ）</p>
      <p class="page-def">定義：仕訳データ（科目・金額・日付・摘要・税区分）だけで機械的に判定できるもの → 人間の解釈・調査不要</p>
    </div>

    <!-- 目次 -->
    <nav class="toc">
      <div class="toc-grid">
        <a v-for="cat in categories" :key="cat.id" href="javascript:void(0)" class="toc-item" @click="scrollToSection(cat.id)">
          <span class="toc-icon">{{ cat.icon }}</span>
          <span class="toc-label">{{ cat.title }}</span>
          <span class="toc-count">{{ cat.rules.length }}</span>
        </a>
      </div>
    </nav>

    <div class="page-body">
      <section v-for="cat in categories" :key="cat.id" :id="cat.id" class="cat-section">
        <h2 class="cat-title">{{ cat.icon }} {{ cat.title }}</h2>
        <div class="rules-table-wrap">
          <table class="rules-tbl">
            <thead>
              <tr>
                <th class="col-id">ルールID</th>
                <th class="col-name">ルール名</th>
                <th class="col-desc">判定条件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in cat.rules" :key="rule.id">
                <td><code class="rule-id">{{ rule.id }}</code></td>
                <td class="rule-name">{{ rule.name }}</td>
                <td class="rule-desc">{{ rule.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <button v-show="showTopBtn" class="top-btn" @click="scrollToTop">▲</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Rule { id: string; name: string; desc: string }
interface Category { id: string; icon: string; title: string; rules: Rule[] }

const categories: Category[] = [
  {
    id: 'cat-duplicate', icon: '🔁', title: '1. 重複・二重計上',
    rules: [
      { id: 'R051', name: '完全重複仕訳', desc: '同日・同科目・同金額・同摘要が複数存在' },
      { id: 'R052', name: '近接日の重複候補', desc: '3日以内に同科目・同金額が複数存在' },
      { id: 'R053', name: '同一取引先への重複支払', desc: '同月内に同取引先・同金額が複数存在' },
      { id: 'R023', name: '売上の二重計上', desc: '同日・同金額・同取引先の売上が複数存在' },
      { id: 'R025', name: '仕入の二重計上', desc: '同上・仕入版' },
    ],
  },
  {
    id: 'cat-amount', icon: '💰', title: '2. 金額の異常',
    rules: [
      { id: 'R056', name: '桁誤り検出', desc: '前月比で10倍・1/10の金額変動' },
      { id: 'R057', name: '前年同月比の大幅変動', desc: '前年同月比±50%以上の変動' },
      { id: 'R068', name: '異常に大きい金額', desc: '科目ごとの月平均の3倍以上' },
      { id: 'R069', name: '端数のない大きい金額', desc: '100万・1000万等の丸い金額 → 概算計上の可能性' },
    ],
  },
  {
    id: 'cat-tax', icon: '🏷️', title: '3. 科目・税区分の整合性',
    rules: [
      { id: 'R022', name: '売上の税区分', desc: '売上科目に不課税・対象外が使われている' },
      { id: 'R024', name: '仕入の税区分', desc: '仕入科目に不課税・対象外が使われている' },
      { id: 'R028', name: '給与の税区分', desc: '給与科目に課税税区分が使われている → 給与は不課税' },
      { id: 'R037', name: '地代家賃の税区分', desc: '土地賃借料に課税税区分 → 土地は非課税' },
      { id: 'R039', name: '保険料の税区分', desc: '保険料に課税税区分 → 保険は非課税' },
      { id: 'R041', name: '租税公課の税区分', desc: '租税公課に課税税区分 → 税金は不課税' },
      { id: 'R044', name: '受取利息の税区分', desc: '受取利息に課税税区分 → 利息は非課税' },
      { id: 'R083', name: '不課税取引の課税計上', desc: '給与・保険・土地に課税税区分' },
    ],
  },
  {
    id: 'cat-memo', icon: '📝', title: '4. 科目と摘要の整合性',
    rules: [
      { id: 'R054', name: '摘要キーワードと科目の矛盾', desc: '摘要「給与」なのに科目が外注費、摘要「保険」なのに科目が交際費、摘要「家賃」なのに科目が消耗品費' },
      { id: 'R055', name: '同一摘要で科目ブレ', desc: '同じ取引先・摘要で科目が月によって異なる' },
      { id: 'R064', name: '同一取引先での科目ブレ', desc: '同一取引先への支払科目が月によって異なる' },
    ],
  },
  {
    id: 'cat-bs', icon: '📊', title: '5. BS残高の異常',
    rules: [
      { id: 'R002', name: 'マイナス残高', desc: '現金・売掛金・棚卸資産がマイナス' },
      { id: 'R003', name: '売掛金の月商比率', desc: '売掛金残高が月商の3ヶ月分超' },
      { id: 'R005', name: '通常動かない科目の変動', desc: '資本金・創立費等が変動している' },
      { id: 'R006', name: '借入金返済と利息の整合', desc: '借入金が減っているのに支払利息がない、または支払利息があるのに借入金がない' },
      { id: 'R061', name: '仮払金・仮受金の長期未精算', desc: '3ヶ月以上残高が動いていない' },
    ],
  },
  {
    id: 'cat-timing', icon: '📅', title: '6. 計上タイミングの異常',
    rules: [
      { id: 'R059', name: '期間外仕訳', desc: '前期・翌期の日付で仕訳が存在' },
      { id: 'R060', name: '月跨ぎ経費の計上', desc: 'サービス期間が複数月なのに一括計上' },
      { id: 'R062', name: '前払費用の費用化確認', desc: '前払費用計上後に費用化仕訳がない' },
      { id: 'R007', name: '未払税金の取り崩し', desc: '前期計上の未払税金が当期に消込されていない' },
    ],
  },
  {
    id: 'cat-threshold', icon: '📏', title: '7. 金額基準の判定',
    rules: [
      { id: 'R013', name: '10万円以上の費用科目計上', desc: '消耗品・修繕費等に10万円超 → 固定資産計上漏れの可能性' },
      { id: 'R032', name: '広告宣伝費20万円以上', desc: '一括計上 → 前払処理の可能性' },
      { id: 'R035', name: '修繕費20万円以上', desc: '一括計上 → 資本的支出の可能性' },
      { id: 'R036', name: '備品消耗品10万円基準', desc: '10万円超の消耗品計上' },
      { id: 'R073', name: '交際費の年間累計', desc: '法人800万円超の交際費累計' },
    ],
  },
  {
    id: 'cat-invoice', icon: '🧾', title: '8. インボイス関連',
    rules: [
      { id: 'R070', name: '免税事業者からの課税仕入', desc: '取引先マスタで免税事業者フラグありの取引先への課税仕入計上 → 仕入税額控除不可' },
      { id: 'R080', name: '経過措置税区分の使用確認', desc: '免税事業者取引に経過措置税区分が使われているか' },
    ],
  },
  {
    id: 'cat-withholding', icon: '🏦', title: '9. 源泉徴収',
    rules: [
      { id: 'R084', name: '個人への報酬支払に源泉計上なし', desc: '外注費・報酬・原稿料等の個人支払で預り金（源泉）の計上がない' },
      { id: 'R086', name: '不動産賃借料の源泉確認', desc: '個人地主への地代家賃で預り金（源泉）の計上がない' },
    ],
  },
  {
    id: 'cat-officer', icon: '👔', title: '10. 役員関連',
    rules: [
      { id: 'R026', name: '役員報酬の定期同額', desc: '毎月の役員報酬が変動している → 損金不算入リスク' },
      { id: 'R027', name: '役員報酬の範囲外支払', desc: '役員報酬額を超える給与計上' },
      { id: 'R065', name: '役員貸付金の発生・増加', desc: '役員貸付金残高が発生または増加 → 認定利息の計上漏れリスク' },
      { id: 'R079', name: '関連会社取引の異常', desc: '役員・関連会社への支払が通常取引と乖離した金額' },
    ],
  },
  {
    id: 'cat-sole', icon: '🏠', title: '11. 個人事業主特有',
    rules: [
      { id: 'R094', name: '家事按分100%計上', desc: '自宅兼事務所の地代家賃・水光熱費が按分なしで全額計上' },
      { id: 'R095', name: '専従者給与の確認', desc: '生計一親族への給与で専従者給与科目を使っているか' },
    ],
  },
]

const totalRules = computed(() => categories.reduce((sum, c) => sum + c.rules.length, 0))

const pageRef = ref<HTMLDivElement | null>(null)
const showTopBtn = ref(false)

const handleScroll = () => {
  if (pageRef.value) showTopBtn.value = pageRef.value.scrollTop > 400
}
const scrollToTop = () => {
  if (pageRef.value) pageRef.value.scrollTo({ top: 0, behavior: 'smooth' })
}
const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.page {
  height: 100%;
  overflow-y: auto;
  background: #f8fafc;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  color: #1e293b;
}

.page-header {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%);
  color: white;
  padding: 28px 32px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
.page-sub { font-size: 13px; opacity: .9; margin: 0 0 4px; }
.page-def { font-size: 11px; opacity: .7; margin: 0; }

/* 目次 */
.toc {
  padding: 16px 28px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.toc-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  transition: all 0.15s;
  white-space: nowrap;
}

.toc-item:hover { background: #e2e8f0; }
.toc-icon { font-size: 13px; }
.toc-count {
  background: #dc2626;
  color: #fff;
  padding: 0 5px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
}

/* 本体 */
.page-body { padding: 20px 28px; max-width: 1400px; }

.cat-section {
  margin-bottom: 24px;
  scroll-margin-top: 120px;
}

.cat-title {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

/* テーブル */
.rules-table-wrap { overflow-x: auto; }

.rules-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.rules-tbl th {
  background: #1e293b;
  color: #fff;
  padding: 8px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
}

.rules-tbl td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.rules-tbl tr:hover { background: #f8fafc; }

.col-id { width: 80px; }
.col-name { width: 220px; }

.rule-id {
  background: #fef2f2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.rule-name { font-weight: 600; color: #0f172a; }
.rule-desc { color: #475569; line-height: 1.6; }

/* トップへ戻る */
.top-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  transition: all 0.2s;
  z-index: 100;
}

.top-btn:hover { background: #b91c1c; transform: scale(1.1); }

@media (max-width: 768px) {
  .toc-grid { flex-direction: column; }
  .col-name { width: auto; }
}
</style>
