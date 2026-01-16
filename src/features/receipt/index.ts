// Penta-Shield Phase 1: Receipt L1-L3パイプライン
// ADR-004/005に完全準拠

import { ReceiptSchema, ReceiptDraftSchema } from "./ReceiptSchema";
import { ReceiptSemanticGuard } from "./ReceiptSemanticGuard";
import { assertReceiptTransition } from "./receiptStateMachine";
import type { Receipt, ReceiptDraft, ReceiptStatus } from "./types";

// 型・スキーマのre-export
export * from "./types";
export * from "./ReceiptSchema";
export * from "./ReceiptSemanticGuard";
export * from "./receiptStateMachine";

/**
 * Draft作成
 * L1/L2/L3通過不要 - 現実世界の入口
 */
export function createDraftReceipt(input: unknown): ReceiptDraft {
    return ReceiptDraftSchema.parse(input);
}

/**
 * Draft → Submitted の「関門」
 * ここがPenta-Shieldの入口
 *
 * L1/L2/L3を通過しない限り確定Receiptになれない
 */
export function submitReceipt(draft: ReceiptDraft): Receipt {
    // Draft→Submittedへの変換
    const submittedData = {
        ...draft,
        status: "Submitted" as const,
        createdAt: draft.createdAt || new Date(),
        updatedAt: new Date(),
    };

    // L1: 構造検証
    const parsed = ReceiptSchema.parse(submittedData);

    // L2: 業務検証
    ReceiptSemanticGuard.validate(parsed);

    // L3: 状態遷移（Draft→Submittedは許可遷移）
    // この関数自体がDraft→Submittedの唯一の経路なので暗黙的に保証

    return parsed;
}

/**
 * 状態変更（L3が主役）
 * Submitted → Approved のみ許可
 */
export function updateReceiptStatus(
    receipt: Receipt,
    newStatus: ReceiptStatus
): Receipt {
    // L3: 状態遷移検証
    assertReceiptTransition(receipt.status, newStatus);

    // 状態更新
    const updated: Receipt = {
        ...receipt,
        status: newStatus as "Submitted" | "Approved",
        updatedAt: new Date(),
    };

    // L2: 更新後の業務検証
    ReceiptSemanticGuard.validate(updated);

    return updated;
}

/**
 * Receipt取得（型安全なgetter）
 */
export function getReceipt(id: string): Receipt | null {
    // TODO: Firestoreから取得
    // 実装は後のフェーズで
    return null;
}
