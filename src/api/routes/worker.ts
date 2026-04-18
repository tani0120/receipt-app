import { Hono, type Context } from 'hono'

// 2026-04-18: WorkerService は Firebase Firestore に依存していたため削除。
// Supabase移行後に再実装予定。現在はスタブレスポンスを返す。

const app = new Hono()

// ------------------------------------------------------------------
// Middleware: OIDC Token Verification (Simplified for Prototype)
// ------------------------------------------------------------------
const oidcAuth = async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Unauthorized: Missing or invalid Bearer token' }, 401)
    }
    await next()
    return
}

app.use('*', oidcAuth)

// ------------------------------------------------------------------
// Routes: Cloud Scheduler Triggers（スタブ — Supabase移行待ち）
// ------------------------------------------------------------------

app.post('/draft-generation', async (c) => {
    console.warn('[Worker] draft-generation: Firebase削除済み。スタブレスポンスを返します')
    return c.json({ success: true, processed: 0, message: 'WorkerService removed (Firebase migration)' })
})

app.post('/batch-check', async (c) => {
    console.warn('[Worker] batch-check: Firebase削除済み。スタブレスポンスを返します')
    return c.json({ success: true, processed: 0, message: 'WorkerService removed (Firebase migration)' })
})

app.post('/learning', async (c) => {
    return c.json({ success: true, message: 'Learning worker not implemented' })
})

export default app
