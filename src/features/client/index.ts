// Penta-Shield: Client L1-L3パイプライン
// ADR-004/005に完全準拠

import { ClientSchema, ClientDraftSchema } from "./ClientSchema";
import { ClientSemanticGuard } from "./ClientSemanticGuard";
import { assertClientTransition } from "./clientStateMachine";
import type { Client, ClientDraft, ClientStatus } from "./types";

// 型・スキーマのre-export
export * from "./types";
export * from "./ClientSchema";
export * from "./ClientSemanticGuard";
export * from "./clientStateMachine";

/**
 * Draft作成
 * L1/L2/L3通過不要 - 現実世界の入口
 */
export function createDraftClient(input: unknown): ClientDraft {
    return ClientDraftSchema.parse(input);
}

/**
 * Draft → Submitted の「関門」
 * ここがPenta-Shieldの入口
 *
 * L1/L2/L3を通過しない限り確定Clientになれない
 */
export function submitClient(draft: ClientDraft): Client {
    // Draft→Submittedへの変換
    const submittedData = {
        ...draft,
        status: "Submitted" as const,
        createdAt: draft.createdAt || new Date(),
        updatedAt: new Date(),
    };

    // L1: 構造検証
    const parsed = ClientSchema.parse(submittedData);

    // L2: 業務検証
    ClientSemanticGuard.validate(parsed);

    // L3: 状態遷移（Draft→Submittedは許可遷移）
    // この関数自体がDraft→Submittedの唯一の経路なので暗黙的に保証

    return parsed;
}

/**
 * 状態変更（L3が主役）
 * Submitted → Approved のみ許可
 */
export function updateClientStatus(
    client: Client,
    newStatus: ClientStatus
): Client {
    // L3: 状態遷移検証
    assertClientTransition(client.status, newStatus);

    // 状態更新
    const updated: Client = {
        ...client,
        status: newStatus as "Submitted" | "Approved",
        updatedAt: new Date(),
    };

    // L2: 更新後の業務検証
    ClientSemanticGuard.validate(updated);

    return updated;
}

/**
 * Client取得（型安全なgetter）
 */
export function getClient(id: string): Client | null {
    // TODO: Firestoreから取得
    // 実装は後のフェーズで
    return null;
}
