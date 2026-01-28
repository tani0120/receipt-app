import { describe, it, expect } from "vitest";
import {
    ClientSchema,
} from "../ClientSchema";
import { ZodError } from "zod";

// L1: Zod Guard - Client構造検証

describe("L1: Zod Guard - ClientSchema（確定Clientのみ）", () => {
    const validClient = {
        id: "00000000-0000-0000-0000-000000000001",
        status: "Submitted",
        name: "株式会社テスト",
        contractDate: new Date("2025-01-01"),
        担当者Id: "00000000-0000-0000-0000-000000000002",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it("有効なClientを受け入れる", () => {
        expect(() => ClientSchema.parse(validClient)).not.toThrow();
    });

    it("name が空文字でエラー", () => {
        const invalid = {
            ...validClient,
            name: "",
        };

        expect(() => ClientSchema.parse(invalid)).toThrow(ZodError);
    });

    it("担当者Id がUUIDでない場合エラー", () => {
        const invalid = {
            ...validClient,
            担当者Id: "invalid-uuid",
        };

        expect(() => ClientSchema.parse(invalid)).toThrow(ZodError);
    });

    it("status が Draft でエラー（L1はDraftを扱わない）", () => {
        const invalid = {
            ...validClient,
            status: "Draft",
        };

        expect(() => ClientSchema.parse(invalid)).toThrow(ZodError);
    });

    it("必須フィールド欠落でエラー", () => {
        const invalid = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            // name, contractDate 等欠落
        };

        expect(() => ClientSchema.parse(invalid)).toThrow(ZodError);
    });

    it("active がboolean以外でエラー", () => {
        const invalid = {
            ...validClient,
            active: "true", // 文字列
        };

        expect(() => ClientSchema.parse(invalid)).toThrow(ZodError);
    });
});
