/**
 * aiPatternMatcher.ts — パターンマッチ（高速パス。AIなし）
 *
 * レイヤー: aiCommandRoutes → ★service★
 * 責務: ユーザーの自然言語テキストからコマンドをキーワードマッチで判定
 *
 * 再編（2026-05-25）:
 *   旧30コマンド→7コマンド統合。COMMAND_OPTIONSも7コマンド分に簡素化。
 *   mf_sync_all（MF全データ同期）は常に3期分・全データ一括取込に統合。
 *
 * コマンド定義はcommandCatalog.tsの唯一の真実を参照。
 * コマンド追加時はcommandCatalog.tsだけ修正すればここにも反映される。
 *
 * 準拠:
 *   - 35_parts_catalog.md: ルーティング（パターンマッチ高速パス）
 *   - 36_infra_ui.md §2-12: AI提案フロー
 */

import { COMMAND_CATALOG } from "./commandCatalog";
import { getById as getClientById } from "./clientsApi";
import type { AiSuggestion } from "./aiSuggestService";
import { commitMfImport, discardMfImport } from "./mfJournalImporter";

/** パターンマッチ結果 */
export interface PatternMatchResult {
  type: "text" | "table" | "suggestions";
  content: string;
  suggestions?: AiSuggestion[];
}

/**
 * コマンド別のサブ選択肢定義（7コマンド）
 * サブ選択肢が不要なコマンドは省略（直接実行 or 層3 FCに委譲）
 */
const COMMAND_OPTIONS: Record<string, { content: string; suggestions: AiSuggestion[] }> = {
  // ===== P1: MF全データ同期 — サブ選択肢なし（常に全データ・3期分） =====
  mf_sync_all: {
    content: "MF全データ同期を実行します（事業者情報・科目・税区分・仕訳を3期分一括取込）",
    suggestions: [
      {
        command: "__exec__:mf_sync_all:全データ:three",
        label: "▶ MF全データ同期を実行",
        description: "事業者情報・科目・税区分・仕訳を3期分一括取込",
      },
    ],
  },

  // ===== P2: 仕訳取得・確認 =====
  journal_view: {
    content: "仕訳取得・確認 — 対象を選んでください",
    suggestions: [
      {
        command: "__exec__:journal_view:今月の仕訳:current",
        label: "今月の仕訳",
        description: "当月の仕訳一覧を取得",
      },
      {
        command: "__exec__:journal_view:先月の仕訳:prev",
        label: "先月の仕訳",
        description: "前月の仕訳一覧を取得",
      },
      {
        command: "__exec__:journal_view:今期の仕訳:term",
        label: "今期の仕訳",
        description: "当期の全仕訳を取得",
      },
    ],
  },

  // ===== P3: 仕訳投入 =====
  journal_write: {
    content: "仕訳投入 — 入力方法を選んでください",
    suggestions: [
      {
        command: "__exec__:journal_write:銀行明細から仕訳:bank",
        label: "銀行明細から仕訳",
        description: "銀行口座の入出金明細を取り込み",
      },
      {
        command: "__exec__:journal_write:領収書から仕訳:receipt",
        label: "領収書から仕訳",
        description: "PDF・画像ファイルから自動読み取り",
      },
      {
        command: "__exec__:journal_write:確認済みを投入:post",
        label: "確認済みを全件投入",
        description: "承認済みの仕訳をまとめてMFに投入",
      },
    ],
  },

  // ===== P4: 仕訳取消 =====
  journal_cancel: {
    content: "仕訳取消 — 操作を選んでください",
    suggestions: [
      {
        command: "__exec__:journal_cancel:直近の投入を取消:latest",
        label: "直近の投入を取消",
        description: "最後に投入した仕訳を取り消す",
      },
      {
        command: "__exec__:journal_cancel:仕訳IDを指定:byid",
        label: "仕訳IDを指定して取消",
        description: "特定の仕訳IDを指定して修正・削除",
      },
    ],
  },

  // ===== P5: マスタ参照 =====
  master_ref: {
    content: "マスタ参照 — 参照したいデータを選んでください",
    suggestions: [
      {
        command: "__exec__:master_ref:取引先一覧:partners",
        label: "取引先一覧",
        description: "売上先・仕入先・外注先をまとめて表示",
      },
      {
        command: "__exec__:master_ref:定期取引検出:recurring",
        label: "定期取引検出",
        description: "毎月発生する定期取引を自動検出",
      },
      {
        command: "__exec__:master_ref:仕訳ルール:rules",
        label: "仕訳ルールの言語化",
        description: "過去仕訳のパターンをテキストで説明",
      },
    ],
  },

  // ===== P6: 消込 =====
  matching: {
    content: "消込 — 種別を選んでください",
    suggestions: [
      {
        command: "__exec__:matching:売掛消込:ar",
        label: "売掛消込リスト",
        description: "売掛金と入金を突合して消込候補を表示",
      },
      {
        command: "__exec__:matching:買掛消込:ap",
        label: "買掛消込リスト",
        description: "買掛金と出金を突合して消込候補を表示",
      },
    ],
  },

  // P7: 財務分析 — サブ選択肢なし（層3 FCに委譲）
};

/**
 * パターンマッチ（高速パス）
 * commandCatalog.tsのkeywordsを使って完全一致→部分一致
 * サブ選択肢ラベルもマッチ対象
 */
export async function matchPattern(
  text: string,
  clientId: string,
): Promise<PatternMatchResult | null> {
  const normalized = text.trim();

  // 内部コマンドプレフィックスのマッチ（__exec__, __commit__）
  const internalMatch = await matchInternalCommand(normalized, clientId);
  if (internalMatch) return internalMatch;

  const withKeywords = COMMAND_CATALOG.filter((c) => c.keywords && c.keywords.length > 0);

  // 完全一致
  for (const cmd of withKeywords) {
    if (cmd.keywords!.includes(normalized) || cmd.name === normalized) {
      return buildResult(cmd.id, cmd.name, clientId);
    }
  }

  // 部分一致
  for (const cmd of withKeywords) {
    if (cmd.keywords!.some((kw) => normalized.includes(kw))) {
      return buildResult(cmd.id, cmd.name, clientId);
    }
  }

  return null;
}

/**
 * 内部コマンドのマッチ（__exec__, __commit__）
 * サブ選択肢ラベルのマッチ → 期間選択 or 実行
 */
async function matchInternalCommand(text: string, clientId: string): Promise<PatternMatchResult | null> {
  /** 顧問先ラベル */
  let clientLabel = '';
  if (clientId === 'all') {
    clientLabel = '📊 全社一括';
  } else if (clientId && clientId !== 'default') {
    const client = getClientById(clientId);
    clientLabel = client?.companyName ?? clientId;
  }
  const targetLine = clientLabel ? `**対象:** ${clientLabel}\n\n` : '';

  // __commit__ プレフィックス → 人間承認後の保存
  if (text.startsWith('__commit__:')) {
    const parts = text.split(':');
    const action = parts[1] ?? ''; // 'approve' or 'discard'
    const batchId = parts[2] ?? '';

    if (action === 'approve') {
      const result = await commitMfImport(batchId);
      if (!result) {
        return {
          type: 'text',
          content: `${targetLine}\u274c バッチID「${batchId}」が見つかりません。\n期限切れ（10分）の可能性があります。再度取込を実行してください。`,
        };
      }
      return {
        type: 'text',
        content: `${targetLine}\u2705 **承認完了** — ${result.added}件を過去仕訳CSVに保存しました。\n（重複${result.skipped}件スキップ）`,
      };
    }

    if (action === 'discard') {
      discardMfImport(batchId);
      return {
        type: 'text',
        content: `${targetLine}\uD83D\uDDD1\uFE0F **破棄しました** — 取込データを破棄しました。`,
      };
    }
  }

  // __exec__ プレフィックス → 実行フェーズ
  if (text.startsWith('__exec__:')) {
    const parts = text.split(':');
    const cmdId = parts[1] ?? '';
    const subLabel = parts[2] ?? '';
    // parts[3]はパラメータキー（将来の拡張用に予約）

    if (cmdId === 'mf_sync_all') {
      return await executeMfSyncAll(clientId, targetLine);
    }

    // 暫定: 他コマンドはモック
    const cmd = COMMAND_CATALOG.find(c => c.id === cmdId);
    const cmdName = cmd?.name ?? cmdId;
    return {
      type: 'text',
      content: `${targetLine}⏳ **${cmdName}** → **${subLabel}** を実行しています...\n\n（DB基盤完成後に実データ処理に差し替えます）`,
    };
  }

  // サブ選択肢ラベルのマッチ
  for (const [cmdId, options] of Object.entries(COMMAND_OPTIONS)) {
    const matched = options.suggestions.find(s => s.label === text);
    if (!matched) continue;

    // __exec__プレフィックス付きのcommandならそのまま実行フェーズへ
    if (matched.command.startsWith('__exec__:')) {
      return matchInternalCommand(matched.command, clientId);
    }

    const cmd = COMMAND_CATALOG.find(c => c.id === cmdId);
    const cmdName = cmd?.name ?? cmdId;
    return {
      type: 'text',
      content: `${targetLine}⏳ **${cmdName}** → **${text}** を実行しています...\n\n（DB基盤完成後に実データ処理に差し替えます）`,
    };
  }

  return null;
}

/**
 * MF全データ同期の実行 — /api/mf/sync-all エンドポイントに委譲
 *
 * ロジック本体はmfRoutes.tsの POST /sync-all に移動済み。
 * ここではエンドポイントを内部呼び出しし、結果をチャット用に整形する。
 */
async function executeMfSyncAll(
  clientId: string,
  targetLine: string,
): Promise<PatternMatchResult> {
  try {
    const res = await fetch('http://localhost:8080/api/mf/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    const data = await res.json() as {
      success: boolean
      error?: string
      hasWarnings?: boolean
      batchIds?: string[]
      results?: string[]
    }

    if (!data.success) {
      return {
        type: 'text',
        content: `${targetLine}❌ ${data.error ?? 'MF全データ同期に失敗しました'}`,
      }
    }

    const resultText = data.results?.join('\n') ?? ''

    // 警告があれば承認ボタン
    if (data.hasWarnings && data.batchIds?.length) {
      const approveCommands: AiSuggestion[] = []
      for (const bid of data.batchIds) {
        approveCommands.push({
          command: `__commit__:approve:${bid}`,
          label: '✅ 承認して取込',
          description: '警告を確認しました。過去仕訳CSVに保存します',
        })
      }
      approveCommands.push({
        command: `__commit__:discard:${data.batchIds[0]}`,
        label: '🗑️ 破棄',
        description: '取込を中止し、データを破棄します',
      })

      return {
        type: 'suggestions',
        content: `${targetLine}⚠️ **MF全データ同期 — 承認が必要です**（3期分）\n\n${resultText}\n\n↑ の内容を確認し、承認または破棄を選んでください。`,
        suggestions: approveCommands,
      }
    }

    return {
      type: 'text',
      content: `${targetLine}🎉 **MF全データ同期完了**（3期分）\n\n${resultText}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[aiPatternMatcher] MF全データ同期失敗: ${message}`)
    return {
      type: 'text',
      content: `${targetLine}❌ **MF全データ同期に失敗しました**\n\n${message}`,
    }
  }
}

/** コマンド別に結果を組み立て（クライアント名を先頭に表示） */
function buildResult(cmdId: string, cmdName: string, clientId: string): PatternMatchResult {
  /** 顧問先ラベル解決（全社一括 / 個別会社名 / 未選択） */
  let clientLabel: string;
  if (clientId === "all") {
    clientLabel = "📊 全社一括";
  } else if (clientId === "default" || !clientId) {
    clientLabel = "⚠️ 未選択（ヘッダーで顧問先を選択または入力してください）";
  } else {
    const client = getClientById(clientId);
    clientLabel = client?.companyName ?? clientId;
  }

  const options = COMMAND_OPTIONS[cmdId];
  if (options) {
    return {
      type: "suggestions",
      content: `**対象:** ${clientLabel}\n\n${options.content}`,
      suggestions: options.suggestions,
    };
  }

  // サブ選択肢なし（財務分析等は層3 FCに委譲）
  return {
    type: "text",
    content: `**対象:** ${clientLabel}\n\n[モック] 「${cmdName}」を実行しました。\n\nDB基盤完成後に実データに差し替えます。`,
  };
}
