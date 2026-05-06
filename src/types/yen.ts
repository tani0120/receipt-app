// 金額型（円）
// Phase B以降でBranded Typeへの移行を検討
export type Yen = number

// ヘルパー関数
export function toYen(n: number): Yen {
    return n as Yen
}

export function fromYen(y: Yen): number {
    return y
}
