/**
 * api/index.ts — Vite開発サーバー用エントリポイント
 *
 * 責務: routeTree.tsから統合ルートを読み込み、Vite開発サーバーにマウントする
 * ルート定義は routeTree.ts に一元化されている（SSOT）
 */

// routeTree.tsが唯一のルート定義源泉
export { default } from './routeTree'
export type { AppType } from './routeTree'
