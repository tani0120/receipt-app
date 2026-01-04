
import { hc } from 'hono/client'
import type { AppType } from './api/index'

// Create a type-safe client
// If using absolute URL (e.g. separate backend), specify it.
// For Vite integration (same origin), '/' works.
export const client = hc<AppType>('/')

// Helper to use in Vue
// const res = await client.api.hello.$get()
// const data = await res.json()
