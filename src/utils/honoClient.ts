/**
 * honoClient.ts — Hono RPCクライアント（型安全HTTPクライアント）
 *
 * AppTypeからルートの入力型・出力型を自動推論する。
 * HTTP Repositoryの内部で使用し、手書きの型同期を排除する。
 *
 * 使用例:
 *   const res = await honoClient.api.mf['import-master-accounts'].$post({
 *     json: { clientId: 'xxx' }
 *   })
 *   // clientIdを省略するとコンパイルエラーになる
 */

import { hc } from 'hono/client'
import type { AppType } from '../api/routeTree'

// Vite開発時はプロキシ経由なのでベースURLは'/'
export const honoClient = hc<AppType>('/')
