/**
 * hash-worker.ts — ハッシュ計算用Web Worker
 *
 * メインスレッドのCPU+メモリ負荷をゼロにする。
 * Secure Context（HTTPS/localhost）ではSHA-256、HTTP環境ではFNV-1aフォールバック。
 */

self.onmessage = async (e: MessageEvent<File>) => {
  try {
    const file = e.data
    const buffer = await file.arrayBuffer()

    let hash: string

    // Secure Context（HTTPS/localhost）ではSHA-256
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      // HTTP環境（LAN IP等）: FNV-1a 64bitフォールバック
      const bytes = new Uint8Array(buffer)
      let h1 = 0x811c9dc5 >>> 0
      let h2 = 0x811c9dc5 >>> 0
      for (let i = 0; i < bytes.length; i++) {
        h1 = Math.imul(h1 ^ bytes[i]!, 0x01000193) >>> 0
        h2 = Math.imul(h2 ^ bytes[bytes.length - 1 - i]!, 0x01000193) >>> 0
      }
      hash = h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
    }

    self.postMessage({ hash })
  } catch (err) {
    self.postMessage({ hash: null, error: String(err) })
  }
}
