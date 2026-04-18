import { Hono } from 'hono'

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
        return c.json({ error: 'jobRepository は Supabase移行待ちです' }, 501)
    })
    // PATCH /:id - ジョブ更新
    .patch('/:id', async (c) => {
        const id = c.req.param('id')
        console.warn(`[jobs] jobRepository削除済み。ID=${id} の更新はスキップされます`)
        return c.json({ error: 'jobRepository は Supabase移行待ちです' }, 501)
    })

export default route
