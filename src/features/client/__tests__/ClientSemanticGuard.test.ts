import { describe, it, expect } from "vitest";
import { ClientSemanticGuard, BusinessRuleError } from "../ClientSemanticGuard";
import type { Client } from "../types";

describe("L2: Semantic Guard - 契約日検証", () => {
    const createClient = (contractDate: Date): Client => ({
        id: "00000000-0000-0000-0000-000000000001",
        status: "Submitted",
        name: "株式会社テスト",
        contractDate,
        担当者Id: "00000000-0000-0000-0000-000000000002",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    it("過去日付の契約日は成功", () => {
        const client = createClient(new Date("2025-01-01"));
        expect(() => ClientSemanticGuard.validate(client)).not.toThrow();
    });

    it("未来日付の契約日はエラー", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const client = createClient(futureDate);

        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            BusinessRuleError
        );
        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            "契約日が未来日付です"
        );
    });
});

describe("L2: Semantic Guard - active/status検証", () => {
    it("active=true, status=Approved は成功", () => {
        const client: Client = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Approved",
            name: "株式会社テスト",
            contractDate: new Date("2025-01-01"),
            担当者Id: "00000000-0000-0000-0000-000000000002",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ClientSemanticGuard.validate(client)).not.toThrow();
    });

    it("active=false, status=Approved はエラー", () => {
        const client: Client = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Approved",
            name: "株式会社テスト",
            contractDate: new Date("2025-01-01"),
            担当者Id: "00000000-0000-0000-0000-000000000002",
            active: false, // 無効
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            BusinessRuleError
        );
        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            "無効な顧問先は承認できません"
        );
    });
});

describe("L2: Semantic Guard - 名前検証", () => {
    it("名前が空でない場合は成功", () => {
        const client: Client = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            name: "株式会社テスト",
            contractDate: new Date("2025-01-01"),
            担当者Id: "00000000-0000-0000-0000-000000000002",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ClientSemanticGuard.validate(client)).not.toThrow();
    });

    it("名前が空白のみの場合はエラー", () => {
        const client: Client = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            name: "   ", // 空白のみ
            contractDate: new Date("2025-01-01"),
            担当者Id: "00000000-0000-0000-0000-000000000002",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            BusinessRuleError
        );
        expect(() => ClientSemanticGuard.validate(client)).toThrow(
            "顧問先名が空です"
        );
    });
});

describe("L2: Semantic Guard - Evidence ID生成", () => {
    it("BusinessRuleErrorにEvidenceIDが含まれる", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const client: Client = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            name: "株式会社テスト",
            contractDate: futureDate, // 未来日付
            担当者Id: "00000000-0000-0000-0000-000000000002",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            ClientSemanticGuard.validate(client);
        } catch (error) {
            if (error instanceof BusinessRuleError) {
                expect(error.evidenceId).toMatch(/^EVT-\d+-[a-z0-9]+$/);
            }
        }
    });
});
