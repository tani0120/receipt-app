/**
 * モック用: clientId → 社名マッピング
 * Supabase移行時はこのファイルをAPI呼び出しに置き換える
 */
export const clientNames: Record<string, string> = {
  'LDI-00008': '株式会社LDIデジタル',
}

/** clientIdから社名を取得（未登録はclientIdをそのまま返す） */
export const getClientName = (clientId: string): string =>
  clientNames[clientId] || clientId
