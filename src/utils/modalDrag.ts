// NOTE:
// modalDrag は現在 useDraggable 専用の前処理だが、
// モーダル分離フェーズでは責務変更を避けるため util 化。
// 利用箇所が useDraggable のみであることが将来も維持されるなら
// useDraggable への統合を検討する。

/** モーダル全体ドラッグ用フィルタ（フォーム要素・リサイズ領域はドラッグ除外） */
export function modalDrag(startFn: (e: MouseEvent) => void, e: MouseEvent): void {
  const t = e.target as HTMLElement;
  if (t.closest("input, select, button, textarea, a, [contenteditable], .fill-handle")) return;
  // 右下角のリサイズ領域（20px）をドラッグから除外
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
  startFn(e);
}
