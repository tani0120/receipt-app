<template>
  <div class="prompt-root">
    <h2 class="prompt-title"><i class="fa-solid fa-wand-magic-sparkles"></i> AIプロンプト一覧</h2>
    <p class="prompt-desc">現行のAIプロンプト構成。previewExtract API（アップロード/選別AI）と本番AI（Extract API）の2段階。</p>

    <!-- アップロード/選別AI -->
    <section class="prompt-section">
      <div class="prompt-section-header prompt-section-previewExtract">
        <i class="fa-solid fa-brain"></i>
        <div>
          <h3>アップロード/選別AI（previewExtract API）</h3>
          <span class="prompt-badge prompt-badge-active">稼働中</span>
          <span class="prompt-badge prompt-badge-model">gemini-2.5-flash</span>
        </div>
      </div>

      <div class="prompt-meta">
        <div class="prompt-meta-item"><span class="prompt-meta-label">用途</span> 証票画像1枚を受け取り、種別判定（12種）+ 仕訳方向判定 + 行データ抽出を実行</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">実行タイミング</span> 独自アップロード: 画像投入直後 / Drive: 選別OK後にサーバーバッチ（フェーズ3.5）</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">レスポンス形式</span> Structured Output（JSON Schema強制）</div>
      </div>

      <!-- System Instruction -->
      <details class="prompt-block" open>
        <summary class="prompt-block-title">
          <i class="fa-solid fa-terminal"></i> System Instruction
        </summary>
        <div class="prompt-block-content">
          <h4>ベース指示</h4>
          <pre class="prompt-code">あなたは日本の会計事務所向けのAI証票分類エンジンです。
【最優先タスク】まず画像内に独立した情報源が1つだけか、2つ以上あるかを判定せよ。
判定後、主要な1つについて詳細情報を抽出せよ。
1枚の証票画像から、証票種別（source_type）と仕訳方向（direction）を判定し、
行データ（line_items）を抽出してください。</pre>

          <h4>仕訳方向（direction）判定基準</h4>
          <table class="prompt-table">
            <thead><tr><th>direction</th><th>判定基準</th></tr></thead>
            <tbody>
              <tr><td><code>expense</code></td><td>出金・支払い。レシート、請求書の支払い等</td></tr>
              <tr><td><code>income</code></td><td>入金・受取り。売上入金、利息入金等</td></tr>
              <tr><td><code>transfer</code></td><td>振替。口座間移動、クレカ引落し等</td></tr>
              <tr><td><code>mixed</code></td><td>混在。通帳ページ等で入金と出金が混在</td></tr>
            </tbody>
          </table>

          <h4>行データ（line_items）抽出ルール</h4>
          <table class="prompt-table">
            <thead><tr><th>source_type</th><th>抽出方法</th></tr></thead>
            <tbody>
              <tr><td><code>bank_statement</code></td><td>全取引行。date/description/amount/direction/balance</td></tr>
              <tr><td><code>credit_card</code></td><td>全利用行。balanceはnull</td></tr>
              <tr><td><code>cash_ledger</code></td><td>全取引行。balanceあり</td></tr>
              <tr><td><code>supplementary_doc</code></td><td>可能な限り全行抽出</td></tr>
              <tr><td><code>receipt</code></td><td>1行。date=取引日、amount=税込合計、direction=expense</td></tr>
              <tr><td><code>invoice_received</code></td><td>1行。同上</td></tr>
              <tr><td><code>tax_payment</code></td><td>1行。同上</td></tr>
              <tr><td><code>non_journal / other</code></td><td>空配列[]</td></tr>
            </tbody>
          </table>

          <h4>出力フィールドルール</h4>
          <ul class="prompt-rules">
            <li><code>source_type</code> / <code>direction</code> — 必ずenumから選択</li>
            <li><code>confidence</code> — 0.0〜1.0で評価</li>
            <li><code>description</code> — 取引内容を1文で要約</li>
            <li><code>issuer_name</code> — 発行者名。全種別で読み取りを試みる</li>
            <li><code>date</code> — YYYY-MM-DD。読み取れない場合null</li>
            <li><code>total_amount</code> — 合計金額（税込）。読み取れない場合null</li>
            <li><code>preview_extract_reason</code> — 判定根拠を日本語1〜2文</li>
            <li><code>document_count</code> — 画像内の証票枚数。1枚のみなら1、複数/重なり/他書類混入は2以上</li>
            <li><code>document_count_reason</code> — 枚数判定根拠を日本語1〜2文</li>
            <li><code>line_items</code> — amountは正の整数。入出金はdirectionで区別</li>
          </ul>
        </div>
      </details>

      <!-- キーワード集 -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-tags"></i> 証票種別キーワード集（12種）
          <span class="prompt-badge-count">{{ keywords.length }}種</span>
        </summary>
        <div class="prompt-block-content">
          <table class="prompt-table prompt-table-keywords">
            <thead>
              <tr>
                <th>source_type</th>
                <th>日本語名</th>
                <th>判定キーワード</th>
                <th>除外ルール</th>
                <th>補足</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kw in keywords" :key="kw.type">
                <td><code>{{ kw.type }}</code></td>
                <td>{{ kw.label }}</td>
                <td class="prompt-kw-cell">
                  <span v-for="k in kw.keywords" :key="k" class="prompt-kw-tag">{{ k }}</span>
                </td>
                <td class="prompt-ex-cell">
                  <div v-for="ex in kw.exclude" :key="ex" class="prompt-ex-item">{{ ex }}</div>
                  <span v-if="kw.exclude.length === 0" class="prompt-na">—</span>
                </td>
                <td class="prompt-note-cell">{{ kw.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <!-- 境界ガイド -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-triangle-exclamation"></i> 紛らわしい境界の判定ガイド
          <span class="prompt-badge-count">{{ boundaries.length }}件</span>
        </summary>
        <div class="prompt-block-content">
          <table class="prompt-table">
            <thead>
              <tr><th>書類</th><th>誤判定</th><th>→</th><th>正しい種別</th><th>判定ポイント</th></tr>
            </thead>
            <tbody>
              <tr v-for="bg in boundaries" :key="bg.document">
                <td><strong>{{ bg.document }}</strong></td>
                <td><code class="prompt-wrong">{{ bg.wrongType }}</code></td>
                <td>→</td>
                <td><code class="prompt-correct">{{ bg.correctType }}</code></td>
                <td>{{ bg.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <!-- Request Prompt -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-paper-plane"></i> Request Prompt（ユーザーメッセージ）
        </summary>
        <div class="prompt-block-content">
          <pre class="prompt-code">この証票画像を分析し、証票種別と仕訳方向を判定し、行データを抽出してください。</pre>
        </div>
      </details>
    </section>

    <!-- 本番AI -->
    <section class="prompt-section">
      <div class="prompt-section-header prompt-section-extract">
        <i class="fa-solid fa-magic"></i>
        <div>
          <h3>本番AI（Extract API）</h3>
          <span class="prompt-badge prompt-badge-future">将来実装</span>
          <span class="prompt-badge prompt-badge-test">テスト版プロンプトあり</span>
        </div>
      </div>

      <div class="prompt-meta">
        <div class="prompt-meta-item"><span class="prompt-meta-label">用途</span> previewExtract確定後、証票画像から本番仕訳データ（勘定科目・税区分等）を抽出</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">実行タイミング</span> 資料選別OK後。顧問先設定（勘定科目体系・過去仕訳パターン）を参照</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">ステータス</span> types.tsに型定義のみ。previewExtract_test.tsにテスト版プロンプトが存在</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">ソース</span> <code>src/scripts/previewExtract_test.ts</code>（Phase A-2 v2）</div>
      </div>

      <!-- テスト版 System Instruction -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-flask"></i> テスト版 System Instruction
          <span class="prompt-badge prompt-badge-test">Phase A-2 v2</span>
        </summary>
        <div class="prompt-block-content">
          <h4>ベース指示</h4>
          <pre class="prompt-code">あなたは日本の個人事業主会計に精通した「AI公認会計士」兼「高度画像解析エンジン」です。
1枚の証票画像（またはCSVテキスト）から、会計処理に必要な全データを1回のレスポンスで抽出します。</pre>

          <h4>基本原則</h4>
          <ol class="prompt-rules">
            <li><strong>勘定科目制限</strong>: 提供リストの科目のみ使用。リスト外は一切不可。</li>
            <li><strong>3状態の区別</strong>: 値あり→値を入れる / 欄が存在しない→null / 文字が潰れて読めない→unreadableフラグtrue+値null</li>
            <li><strong>数値優先</strong>: 画像上の印字数値を最優先。計算値と不整合でも画像の数値を採用</li>
            <li><strong>T番号</strong>: 「T」+数字13桁。ハイフン除去（例: T6120002074677）</li>
            <li><strong>構造化出力厳守</strong>: 指定JSONスキーマを正確に出力。テキスト解説不要</li>
          </ol>

          <h4>証票タイプ判定（テスト版: 7種）</h4>
          <table class="prompt-table">
            <thead><tr><th>タイプ</th><th>判定基準</th></tr></thead>
            <tbody>
              <tr><td><code>RECEIPT</code></td><td>「領収証」「レシート」の表記、POS端末出力</td></tr>
              <tr><td><code>INVOICE</code></td><td>「請求書」「御請求書」「納品書兼請求書」の表記</td></tr>
              <tr><td><code>TRANSPORT</code></td><td>「乗車券」「ICカード利用明細」「タクシー領収書」</td></tr>
              <tr><td><code>CREDIT_CARD</code></td><td>「クレジットカード利用明細」「カードご利用」</td></tr>
              <tr><td><code>BANK_STATEMENT</code></td><td>通帳ページ、「普通預金」「当座預金」</td></tr>
              <tr><td><code>MEDICAL</code></td><td>「診療」「薬局」「医療費」「クリニック」</td></tr>
              <tr><td><code>NOT_APPLICABLE</code></td><td>名刺、メモ、風景写真、謄本等の仕訳不要書類</td></tr>
            </tbody>
          </table>

          <h4>追加機能（現行previewExtractにはない）</h4>
          <ul class="prompt-rules">
            <li><strong>銀行推定</strong> — ロゴ形状・配色・フォント・列ヘッダー固有表現から推定。根拠をbank_name_evidenceに記載</li>
            <li><strong>手書き判定</strong> — NONE/NON_MEANINGFUL/MEANINGFUL。角印・受領印は手書きに含めない</li>
            <li><strong>複数証票</strong> — has_multiple_vouchers=trueならOCRフィールド全てnull、仕訳空配列</li>
          </ul>
        </div>
      </details>

      <!-- 会計コンテキスト -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-building-columns"></i> 会計コンテキスト（Request Prompt）
          <span class="prompt-badge prompt-badge-test">顧問先固有</span>
        </summary>
        <div class="prompt-block-content">
          <h4>事業者設定</h4>
          <table class="prompt-table">
            <thead><tr><th>項目</th><th>値</th></tr></thead>
            <tbody>
              <tr><td>事業者種別</td><td>個人事業主</td></tr>
              <tr><td>会計ソフト</td><td>MF</td></tr>
              <tr><td>経理方式</td><td>税込経理</td></tr>
              <tr><td>計上基準</td><td>期中現金</td></tr>
              <tr><td>課税方式</td><td>原則課税（課税事業者）</td></tr>
              <tr><td>仕入税額控除</td><td>個別対応方式</td></tr>
              <tr><td>インボイス登録</td><td>あり（適格請求書発行事業者）</td></tr>
              <tr><td>経過措置</td><td>適用（免税事業者からの仕入80%控除）</td></tr>
              <tr><td>標準決済手段</td><td>現金（不明時のデフォルト貸方科目）</td></tr>
              <tr><td>源泉徴収義務</td><td>なし（社員0名）</td></tr>
              <tr><td>不動産所得</td><td>あり（住宅貸付→非課税売上）</td></tr>
              <tr><td>部門管理</td><td>あり</td></tr>
            </tbody>
          </table>

          <h4>勘定科目リスト（30科目）</h4>
          <table class="prompt-table">
            <thead><tr><th>enum</th><th>日本語名</th><th>カテゴリ</th></tr></thead>
            <tbody>
              <tr><td><code>TRAVEL</code></td><td>旅費交通費</td><td>経費</td></tr>
              <tr><td><code>SUPPLIES</code></td><td>消耗品費</td><td>経費</td></tr>
              <tr><td><code>COMMUNICATION</code></td><td>通信費</td><td>経費</td></tr>
              <tr><td><code>MEETING</code></td><td>会議費</td><td>経費</td></tr>
              <tr><td><code>ENTERTAINMENT</code></td><td>接待交際費</td><td>経費</td></tr>
              <tr><td><code>ADVERTISING</code></td><td>広告宣伝費</td><td>経費</td></tr>
              <tr><td><code>FEES</code></td><td>支払手数料</td><td>経費</td></tr>
              <tr><td><code>RENT</code></td><td>地代家賃</td><td>経費</td></tr>
              <tr><td><code>UTILITIES</code></td><td>水道光熱費</td><td>経費</td></tr>
              <tr><td><code>INSURANCE</code></td><td>保険料</td><td>経費</td></tr>
              <tr><td><code>REPAIRS</code></td><td>修繕費</td><td>経費</td></tr>
              <tr><td><code>MISCELLANEOUS</code></td><td>雑費</td><td>経費</td></tr>
              <tr><td><code>WELFARE</code></td><td>福利厚生費</td><td>経費</td></tr>
              <tr><td><code>OUTSOURCING</code></td><td>外注費</td><td>経費</td></tr>
              <tr><td><code>PACKING_SHIPPING</code></td><td>荷造運賃</td><td>経費</td></tr>
              <tr><td><code>TAXES_DUES</code></td><td>租税公課</td><td>経費</td></tr>
              <tr><td><code>DEPRECIATION</code></td><td>減価償却費</td><td>経費</td></tr>
              <tr><td><code>SALES</code></td><td>売上高</td><td>売上</td></tr>
              <tr><td><code>RENTAL_INCOME</code></td><td>不動産収入</td><td>売上</td></tr>
              <tr><td><code>INTEREST_INCOME</code></td><td>受取利息</td><td>売上</td></tr>
              <tr><td><code>CASH</code></td><td>現金</td><td>資産</td></tr>
              <tr><td><code>BANK_DEPOSIT</code></td><td>普通預金</td><td>資産</td></tr>
              <tr><td><code>ACCOUNTS_RECEIVABLE</code></td><td>売掛金</td><td>資産</td></tr>
              <tr><td><code>ACCOUNTS_PAYABLE</code></td><td>買掛金</td><td>負債</td></tr>
              <tr><td><code>ACCRUED_EXPENSES</code></td><td>未払金</td><td>負債</td></tr>
              <tr><td><code>TAX_RECEIVED</code></td><td>仮受消費税</td><td>税金</td></tr>
              <tr><td><code>TAX_PAID</code></td><td>仮払消費税</td><td>税金</td></tr>
              <tr><td><code>OWNER_DRAWING</code></td><td>事業主貸</td><td>個人事業主</td></tr>
              <tr><td><code>OWNER_INVESTMENT</code></td><td>事業主借</td><td>個人事業主</td></tr>
              <tr><td><code>MEDICAL_EXPENSE</code></td><td>医療費</td><td>参照用</td></tr>
            </tbody>
          </table>

          <h4>税区分リスト（8種）</h4>
          <table class="prompt-table">
            <thead><tr><th>税区分ID</th><th>日本語</th><th>判定基準</th></tr></thead>
            <tbody>
              <tr><td><code>TAXABLE_PURCHASE_10</code></td><td>課税仕入10%</td><td>一般経費（消耗品、通信、家賃等）</td></tr>
              <tr><td><code>TAXABLE_PURCHASE_8</code></td><td>課税仕入8%（軽減）</td><td>飲食料品、定期購読新聞</td></tr>
              <tr><td><code>NON_TAXABLE_PURCHASE</code></td><td>非課税仕入</td><td>保険料、利息、土地代、行政手数料</td></tr>
              <tr><td><code>OUT_OF_SCOPE_PURCHASE</code></td><td>対象外（仕入）</td><td>給与、税金、寄付金、慶弔</td></tr>
              <tr><td><code>TAXABLE_SALES_10</code></td><td>課税売上10%</td><td>一般売上</td></tr>
              <tr><td><code>TAXABLE_SALES_8</code></td><td>課税売上8%（軽減）</td><td>飲食料品売上</td></tr>
              <tr><td><code>NON_TAXABLE_SALES</code></td><td>非課税売上</td><td>有価証券譲渡、住宅貸付</td></tr>
              <tr><td><code>OUT_OF_SCOPE_SALES</code></td><td>対象外売上</td><td>配当金、損害賠償</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <!-- 仕訳ルール -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-scale-balanced"></i> 仕訳ルール
        </summary>
        <div class="prompt-block-content">
          <ul class="prompt-rules">
            <li><strong>宛名チェック</strong>: 宛名が事業者名と異なる場合 → is_not_applicable=true、仕訳空配列</li>
            <li><strong>医療費</strong>: 原則OWNER_DRAWING（事業外支出）。MEDICAL_EXPENSEは使用しない</li>
            <li><strong>飲食費</strong>: 1万円以下→MEETING / 1万円超→ENTERTAINMENT</li>
            <li><strong>税理士報酬</strong>: 源泉徴収不要（源泉義務なし）。全額をFEES</li>
            <li><strong>個人の私的支出</strong> → OWNER_DRAWING</li>
            <li><strong>事業外からの入金</strong> → OWNER_INVESTMENT</li>
            <li><strong>住宅貸付の家賃収入</strong> → RENTAL_INCOME（税区分: NON_TAXABLE_SALES）</li>
            <li><strong>福利厚生費(WELFARE)</strong>: 社員0名のため使用不可。MISCELLANEOUSを使用</li>
            <li>⚠️ 住宅貸付（非課税売上）があるため課税売上割合が95%を下回る可能性あり</li>
          </ul>

          <h4>仕訳構造</h4>
          <ul class="prompt-rules">
            <li><code>journal_entry_suggestions</code> は配列。借方(debit) + 貸方(credit)に分離</li>
            <li>通常の単純仕訳: debit 1件 + credit 1件 = 合計2件</li>
            <li>複合仕訳（is_composite_transaction=true）: 3件以上</li>
            <li>借方合計と貸方合計は必ず一致</li>
            <li>各エントリに必ず<code>tax_category</code>（税区分）を指定</li>
            <li><code>sub_account</code>（補助科目）は判定できる場合のみ（銀行名、カード名等）</li>
          </ul>
        </div>
      </details>

      <!-- 実行手順 -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-list-check"></i> 実行手順（13ステップ）
        </summary>
        <div class="prompt-block-content">
          <ol class="prompt-rules">
            <li><strong>証票分類</strong>: 7タイプから1つ選択。信頼度0.0〜1.0</li>
            <li><strong>OCR抽出</strong>: 日付・金額・発行者。読めない場合unreadable=true</li>
            <li><strong>支店名</strong>: 「〇〇店」「〇〇支店」をissuer_branchに</li>
            <li><strong>支払方法</strong>: 現金/クレジット/振込/電子マネー/QR決済</li>
            <li><strong>クレカ払い</strong>: is_credit_card_paymentで判定</li>
            <li><strong>適格請求書</strong>: T番号検索（ハイフン除去）</li>
            <li><strong>税率抽出</strong>: 8%/10%内訳をtax_entriesに</li>
            <li><strong>銀行推定</strong>: 通帳ならロゴ・フォーマットから推定</li>
            <li><strong>仕訳生成</strong>: 借方・貸方を配列で。各エントリにtax_category必須</li>
            <li><strong>明細展開</strong>: 通帳/カード→line_items、レシート→receipt_items</li>
            <li><strong>手書き判定</strong>: NONE/NON_MEANINGFUL/MEANINGFUL</li>
            <li><strong>複数証票</strong>: 2枚以上→has_multiple_vouchers=true、OCR全null</li>
            <li><strong>除外判定</strong>: is_not_applicable=trueでもOCR結果は全て出力。仕訳のみ空配列</li>
          </ol>
        </div>
      </details>

      <div class="prompt-placeholder">
        <i class="fa-solid fa-code-branch"></i>
        <p>T-03（仕訳AI）フェーズで上記テスト版を基にExtract API専用プロンプトを構築</p>
        <p class="prompt-placeholder-sub">previewExtractの証票種別 + 顧問先マスタの勘定科目体系を動的に注入する設計</p>
      </div>
    </section>

    <!-- データフロー: previewExtract → 仕訳 -->
    <section class="prompt-section">
      <div class="prompt-section-header prompt-section-flow">
        <i class="fa-solid fa-diagram-project"></i>
        <div>
          <h3>previewExtract → 仕訳変換フロー</h3>
          <span class="prompt-badge prompt-badge-active">稼働中</span>
        </div>
      </div>

      <div class="prompt-meta">
        <div class="prompt-meta-item"><span class="prompt-meta-label">処理</span> previewExtract API出力 → lineItemToJournalMock() → JournalPhase5Mock[]</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">実行タイミング</span> 資料選別画面で「確定送信」時（AIは不使用。純粋なデータ変換）</div>
        <div class="prompt-meta-item"><span class="prompt-meta-label">ソース</span> <code>lineItemToJournalMock.ts</code></div>
      </div>

      <!-- フィールドマッピング -->
      <details class="prompt-block" open>
        <summary class="prompt-block-title">
          <i class="fa-solid fa-arrows-left-right"></i> フィールドマッピング（previewExtract → 仕訳）
        </summary>
        <div class="prompt-block-content">
          <h4>previewExtract出力 → JournalPhase5Mock</h4>
          <table class="prompt-table">
            <thead>
              <tr><th>previewExtract出力</th><th>→</th><th>JournalPhase5Mock</th><th>変換方法</th></tr>
            </thead>
            <tbody>
              <tr><td><code>source_type</code></td><td>→</td><td><code>source_type</code></td><td>そのまま転写</td></tr>
              <tr><td><code>direction</code></td><td>→</td><td><code>direction</code></td><td>そのまま転写</td></tr>
              <tr><td><code>source_type × direction</code></td><td>→</td><td><code>voucher_type</code></td><td>resolveVoucherType()で変換</td></tr>
              <tr><td><code>issuer_name</code></td><td>→</td><td><code>vendor_name</code></td><td>LineItem.vendor_name経由</td></tr>
              <tr><td><code>line_items[].date</code></td><td>→</td><td><code>voucher_date</code></td><td>そのまま転写</td></tr>
              <tr><td><code>line_items[].description</code></td><td>→</td><td><code>description</code></td><td>そのまま転写</td></tr>
              <tr><td><code>line_items[].amount</code></td><td>→</td><td><code>debit/credit_entries[].amount</code></td><td>借方・貸方に同額設定</td></tr>
              <tr><td><code>line_items[].direction</code></td><td>→</td><td><code>debit/credit配置</code></td><td>expense: 借方=主科目 / income: 逆</td></tr>
            </tbody>
          </table>

          <h4>相手勘定の自動決定（COUNTERPART_ACCOUNT_MAP）</h4>
          <table class="prompt-table">
            <thead>
              <tr><th>source_type</th><th>direction</th><th>相手勘定</th></tr>
            </thead>
            <tbody>
              <tr><td><code>bank_statement</code></td><td>expense / income</td><td>普通預金（ORDINARY_DEPOSIT）</td></tr>
              <tr><td><code>credit_card</code></td><td>expense / income</td><td>未払金（ACCRUED_EXPENSES）</td></tr>
              <tr><td><code>receipt</code></td><td>expense</td><td>現金（CASH）※クレカ払い時は未払金</td></tr>
              <tr><td><code>invoice_received</code></td><td>expense</td><td>買掛金（ACCOUNTS_PAYABLE）</td></tr>
              <tr><td><code>tax_payment</code></td><td>expense</td><td>普通預金（ORDINARY_DEPOSIT）</td></tr>
              <tr><td><code>journal_voucher</code></td><td>—</td><td>null（人間判断必要）</td></tr>
            </tbody>
          </table>

          <h4>科目未確定時の処理</h4>
          <ul class="prompt-rules">
            <li><strong>科目確定済み</strong>: debit=確定科目, credit=相手勘定（逆もあり）</li>
            <li><strong>科目未確定（insufficient）</strong>: debit/credit にプレースホルダーエントリ（account=null, 金額はLineItem.amountを転写）。labels に <code>ACCOUNT_UNKNOWN</code> を付与</li>
            <li><strong>学習ルールヒット</strong>: テンプレート仕訳をそのまま使用（acctResult.debitEntries/creditEntries）</li>
          </ul>
        </div>
      </details>

      <!-- パイプラインフロー図 -->
      <details class="prompt-block">
        <summary class="prompt-block-title">
          <i class="fa-solid fa-sitemap"></i> パイプラインフロー全体図
        </summary>
        <div class="prompt-block-content">
          <div class="prompt-flow-diagram">
            <div class="flow-step flow-upload">
              <div class="flow-step-icon"><i class="fa-solid fa-upload"></i></div>
              <div class="flow-step-body">
                <strong>① アップロード</strong>
                <span>画像/PDF → SHA-256ハッシュ計算 → DocEntry作成</span>
                <span class="flow-trigger">🔥 発火: ユーザーがゲスト画面で画像を投入 or Drive連携でファイルを検出</span>
                <span class="flow-route">独自: POST /api/pipeline/preview-extract（即時） / Drive: POST /api/drive/migrate（バッチ）</span>
              </div>
            </div>
            <div class="flow-arrow"><i class="fa-solid fa-arrow-down"></i></div>
            <div class="flow-step flow-previewExtract">
              <div class="flow-step-icon"><i class="fa-solid fa-brain"></i></div>
              <div class="flow-step-body">
                <strong>② previewExtract API（Vertex AI Gemini）</strong>
                <span>source_type判定（12種）+ direction判定（4種）+ line_items抽出</span>
                <span class="flow-trigger">🔥 発火: 独自=アップロード完了直後に自動 / Drive=migrationWorkerが5秒間隔でポーリング</span>
              </div>
            </div>
            <div class="flow-arrow"><i class="fa-solid fa-arrow-down"></i></div>
            <div class="flow-step flow-postprocess">
              <div class="flow-step-icon"><i class="fa-solid fa-gears"></i></div>
              <div class="flow-step-body">
                <strong>③ 後処理（サーバー内部・自動）</strong>
                <span>postprocessPreviewExtract → validatePreviewExtractResult → determineAccount（辞書接続）</span>
                <span class="flow-trigger">🔥 発火: ②のVertex AI応答受信直後に同期実行（previewExtract関数内部）</span>
              </div>
            </div>
            <div class="flow-arrow"><i class="fa-solid fa-arrow-down"></i></div>
            <div class="flow-step flow-docstore">
              <div class="flow-step-icon"><i class="fa-solid fa-database"></i></div>
              <div class="flow-step-body">
                <strong>④ doc-store保存</strong>
                <span>DocEntry.aiLineItems に格納 → documents.json</span>
                <span class="flow-trigger">🔥 発火: ③完了直後に自動。previewExtractのHTTPレスポンスとして返却</span>
              </div>
            </div>
            <div class="flow-arrow"><i class="fa-solid fa-arrow-down"></i> <span class="flow-arrow-label">ユーザー操作待ち</span></div>
            <div class="flow-step flow-select">
              <div class="flow-step-icon"><i class="fa-solid fa-check-double"></i></div>
              <div class="flow-step-body">
                <strong>⑤ 資料選別確定（AIは不使用）</strong>
                <span>sendToProcess() → lineItemToJournalMock()で仕訳形式に変換</span>
                <span class="flow-trigger">🔥 発火: ユーザーが選別画面で「確定送信」ボタンを押下</span>
                <span class="flow-route">⚠️ この時点でAIは動かない。④で保存済みのaiLineItemsをデータ変換するのみ</span>
              </div>
            </div>
            <div class="flow-arrow"><i class="fa-solid fa-arrow-down"></i></div>
            <div class="flow-step flow-journal">
              <div class="flow-step-icon"><i class="fa-solid fa-book"></i></div>
              <div class="flow-step-body">
                <strong>⑥ 仕訳保存</strong>
                <span>JournalPhase5Mock[] → PUT /api/journals/:clientId → journals-{clientId}.json</span>
                <span class="flow-trigger">🔥 発火: ⑤の変換完了直後に自動。useJournals.pushで注入→watchで自動保存</span>
              </div>
            </div>
          </div>
        </div>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
import { SOURCE_TYPE_KEYWORDS, BOUNDARY_GUIDES } from './typeDefinitionsData_prompts'

const keywords = SOURCE_TYPE_KEYWORDS
const boundaries = BOUNDARY_GUIDES
</script>

<style scoped>
.prompt-root { font-family: 'Noto Sans JP', 'Inter', sans-serif; }

.prompt-title {
  font-size: 18px; font-weight: 800; color: #1e293b;
  display: flex; align-items: center; gap: 8px; margin: 0 0 4px;
}
.prompt-desc { font-size: 12px; color: #64748b; margin: 0 0 20px; }

/* セクション */
.prompt-section { margin-bottom: 28px; }
.prompt-section-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 10px; margin-bottom: 12px;
}
.prompt-section-header h3 { margin: 0; font-size: 15px; font-weight: 700; }
.prompt-section-header i { font-size: 20px; }
.prompt-section-previewExtract { background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); color: #1e40af; }
.prompt-section-extract { background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); color: #92400e; }

/* バッジ */
.prompt-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px; margin-left: 8px;
}
.prompt-badge-active { background: #dcfce7; color: #166534; }
.prompt-badge-model { background: #e0e7ff; color: #3730a3; }
.prompt-badge-future { background: #fef3c7; color: #92400e; }
.prompt-badge-test { background: #ede9fe; color: #5b21b6; }
.prompt-badge-count { font-size: 10px; color: #64748b; margin-left: 8px; }

/* メタ情報 */
.prompt-meta { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 12px; padding: 0 4px; }
.prompt-meta-item { font-size: 11px; color: #475569; }
.prompt-meta-label { font-weight: 700; color: #334155; margin-right: 4px; }

/* 折りたたみブロック */
.prompt-block {
  background: white; border: 1px solid #e2e8f0; border-radius: 8px;
  margin-bottom: 8px; overflow: hidden;
}
.prompt-block-title {
  padding: 10px 14px; font-size: 12px; font-weight: 700; color: #334155;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  background: #f8fafc;
}
.prompt-block-title:hover { background: #f1f5f9; }
.prompt-block-content { padding: 12px 16px; }
.prompt-block-content h4 { font-size: 12px; font-weight: 700; color: #1e293b; margin: 12px 0 6px; }
.prompt-block-content h4:first-child { margin-top: 0; }

/* コードブロック */
.prompt-code {
  background: #1e293b; color: #e2e8f0; padding: 12px 16px;
  border-radius: 6px; font-size: 11px; line-height: 1.6;
  white-space: pre-wrap; word-break: break-all;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* テーブル */
.prompt-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.prompt-table th {
  background: #f1f5f9; padding: 6px 8px; text-align: left;
  font-weight: 700; color: #334155; border: 1px solid #e2e8f0;
  white-space: nowrap;
}
.prompt-table td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
.prompt-table code { font-size: 10px; padding: 1px 4px; border-radius: 3px; background: #f0f9ff; color: #0369a1; }

/* キーワードタグ */
.prompt-kw-cell { }
.prompt-kw-tag {
  display: inline-block; background: #eff6ff; color: #1d4ed8;
  font-size: 10px; padding: 1px 6px; border-radius: 4px; margin: 1px 2px;
}
.prompt-kw-more { font-size: 10px; color: #94a3b8; margin-left: 4px; }

/* 除外セル */
.prompt-ex-cell { max-width: 260px; }
.prompt-ex-item { font-size: 10px; color: #dc2626; margin-bottom: 2px; }
.prompt-note-cell { font-size: 10px; color: #64748b; max-width: 200px; }
.prompt-na { color: #cbd5e1; }

/* 正誤 */
.prompt-wrong { background: #fef2f2 !important; color: #dc2626 !important; text-decoration: line-through; }
.prompt-correct { background: #f0fdf4 !important; color: #16a34a !important; }

/* ルール一覧 */
.prompt-rules { padding-left: 20px; margin: 8px 0; }
.prompt-rules li { font-size: 11px; color: #334155; margin-bottom: 4px; line-height: 1.5; }
.prompt-rules code { font-size: 10px; background: #f0f9ff; color: #0369a1; padding: 1px 4px; border-radius: 3px; }

/* 将来プレースホルダ */
.prompt-placeholder {
  text-align: center; padding: 40px 20px;
  background: #fffbeb; border: 2px dashed #fbbf24; border-radius: 10px;
  color: #92400e;
}
.prompt-placeholder i { font-size: 32px; margin-bottom: 12px; }
.prompt-placeholder p { margin: 4px 0; font-weight: 600; }
.prompt-placeholder-sub { font-size: 11px; color: #a16207; font-weight: 400; }

/* データフローセクション */
.prompt-section-flow { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #16a34a; }
.prompt-section-flow i { color: #16a34a; }

/* フロー図 */
.prompt-flow-diagram { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 16px 0; }
.flow-step {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 16px; width: 500px; max-width: 100%;
  transition: box-shadow 0.2s;
}
.flow-step:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.flow-step-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.flow-step-body { display: flex; flex-direction: column; gap: 2px; }
.flow-step-body strong { font-size: 12px; color: #1e293b; }
.flow-step-body span { font-size: 10px; color: #64748b; }
.flow-arrow { color: #94a3b8; font-size: 14px; padding: 4px 0; }

.flow-upload .flow-step-icon { background: #eff6ff; color: #2563eb; }
.flow-previewExtract .flow-step-icon { background: #fef3c7; color: #d97706; }
.flow-postprocess .flow-step-icon { background: #f0fdf4; color: #16a34a; }
.flow-docstore .flow-step-icon { background: #ede9fe; color: #7c3aed; }
.flow-select .flow-step-icon { background: #fce7f3; color: #db2777; }
.flow-select { border-color: #f9a8d4; background: #fdf2f8; }
.flow-journal .flow-step-icon { background: #dbeafe; color: #1d4ed8; }

/* 発火条件 */
.flow-trigger { font-size: 10px; color: #dc2626; font-weight: 600; margin-top: 2px; }
.flow-route { font-size: 10px; color: #7c3aed; font-style: italic; }
.flow-arrow-label { font-size: 10px; color: #f59e0b; font-weight: 600; margin-left: 6px; }
</style>
