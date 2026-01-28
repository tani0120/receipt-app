import type { Receipt, ReceiptLine } from "./types";

// L2: Semantic Guard（業務意味防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// 業務ルールエラー
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public readonly evidenceId: string = generateEvidenceId()
  ) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

// Evidence ID生成（簡易実装）
function generateEvidenceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `EVT-${timestamp}-${random}`;
}

// Semantic Guard本体
export class ReceiptSemanticGuard {
  /**
   * L2: 業務ルール検証
   * Zodとは完全分離 - 意味的な整合性のみを扱う
   */
  static validate(receipt: Receipt): void {
    // 貸借一致検証
    if (!this.isBalanced(receipt.lines)) {
      throw new BusinessRuleError("貸借合計が一致しません");
    }

    // OCR信頼度検証
    if (receipt.confidence < 0.8) {
      throw new BusinessRuleError(
        `OCR信頼度が不足しています（${receipt.confidence.toFixed(2)} < 0.8）`
      );
    }

    // 金額の論理チェック
    // total は明細行の絶対値の合計（借方1000 + 貸方1000 = 2000）
    const calculatedTotal = this.calculateTotal(receipt.lines);
    if (Math.abs(calculatedTotal - receipt.total) > 0.01) {
      throw new BusinessRuleError(
        `合計金額が不正です（計算値: ${calculatedTotal}, 実際値: ${receipt.total}）`
      );
    }
  }

  /**
   * 貸借一致チェック
   * 借方合計 = 貸方合計
   */
  private static isBalanced(lines: ReceiptLine[]): boolean {
    const debitTotal = lines
      .filter((l) => l.debitCredit === "debit")
      .reduce((sum, l) => sum + l.amount, 0);

    const creditTotal = lines
      .filter((l) => l.debitCredit === "credit")
      .reduce((sum, l) => sum + l.amount, 0);

    return Math.abs(debitTotal - creditTotal) < 0.01; // 浮動小数点誤差を考慮
  }

  /**
   * 合計金額計算
   * 借方・貸方関係なく、すべての明細の絶対値を合計
   */
  private static calculateTotal(lines: ReceiptLine[]): number {
    // 貸借両方の合計（絶対値）
    return lines.reduce((sum, l) => sum + Math.abs(l.amount), 0);
  }
}
