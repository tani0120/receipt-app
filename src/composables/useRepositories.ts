/**
 * useRepositories — Repository群を提供するcomposable
 *
 * Vue Composition API内で repos.xxx.method() を呼ぶための薄いラッパー。
 * 内部で createRepositories() を1回だけ呼び、シングルトンとしてキャッシュする。
 *
 * 使い方:
 *   const { repos } = useRepositories()
 *   const data = await repos.listView.getViews('client')
 *
 * 準拠: DL-030, P3
 */

import { createRepositories } from '@/repositories'
import type { Repositories } from '@/repositories/types'

/** シングルトンキャッシュ（複数コンポーネントで同一インスタンスを共有） */
let _repos: Repositories | null = null

export function useRepositories(): { repos: Repositories } {
  if (!_repos) {
    _repos = createRepositories()
  }
  return { repos: _repos }
}
