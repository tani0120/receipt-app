import { Hono } from 'hono'
import { apiError } from '../helpers/apiError'
import { 移行待ち } from '../helpers/apiMessages'

const app = new Hono()

/**
 * [レガシー] jobRepository は Firebase/Firestore 依存のため削除済み。
 * Supabase移行後に再実装する。
 * 現在は全エンドポイントでスタブレスポンスを返す。
 */

const route = app
    // GET / - 全ジョブ一覧
    .get('/', async (c) => {
        console.warn('[jobs] jobRepository削除済み。スタブレスポンスを返します')
        return c.json([])
    })
    // GET /:id - ジョブ取得
    .get('/:id', async (c) => {
        const id = c.req.param('id')
        console.warn(`[jobs] jobRepository削除済み。ID=${id} のスタブレスポンスを返します`)
        return apiError(c, 501, 移行待ち)
    })
    // PATCH /:id - ジョブ更新
    .patch('/:id', async (c) => {
        const id = c.req.param('id')
        console.warn(`[jobs] jobRepository削除済み。ID=${id} の更新はスキップされます`)
        return apiError(c, 501, 移行待ち)
    })

export default route
