import { Hono } from 'hono'

const app = new Hono()

const route = app
  // GET /:id (Mock Data)
  .get('/:id', (c) => {
    const id = c.req.param('id')
    return c.json({
      id,
      clientCode: '1001',
      date: '2026-01-10',
      summary: 'Legacy Save Test',
      status: 'approved',
      lines: [],
      amount: 1000
    })
  })

  // PUT /:id (Legacy Save Endpoint)
  .put('/:id', async (c) => {
    const id = c.req.param('id')
    // Serviceを呼ばずに「成功」を返す (Legacy側の保存は一旦スキップ)
    console.log('[Legacy API] Received Save Request (Mocked):', id)
    return c.json({ success: true, id, message: 'Legacy Save Mocked' })
  })

export default route
