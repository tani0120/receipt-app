
/**
 * [IRONCLAD CONTRACT] Screen G: Data Conversion UI Type
 *
 * この型は UI コンポーネントが描画に必要な全ての情報を
 * 「完全な状態」で保持することを保証する。
 *
 * - Optional禁止 (undefinedチェック撲滅)
 * - 状態は Union Type で表現
 * - 表示用テキストは全て完了状態で渡す
 */

export type ConversionLogId = string & { readonly brand: unique symbol };

export type ConversionLogUi = {
    readonly id: ConversionLogId;

    // 表示用データ (必ず値が入る)
    readonly timestamp: string;
    readonly clientName: string;
    readonly sourceSoftwareLabel: string; // "弥生会計" etc
    readonly targetSoftwareLabel: string; // "freee" etc
    readonly fileName: string;
    readonly fileSize: string; // "1.5 MB" などのフォーマット済み文字列

    // ステータス / アクション制御
    readonly downloadUrl: string;
    readonly isDownloaded: boolean;
    readonly isDownloadable: boolean; // ロジックで判定済みのフラグ
    readonly rowStyle: string; // "bg-white" or "bg-gray-50" etc
};

export type DataConversionUi = {
    readonly logs: ConversionLogUi[];
    readonly pendingCount: number;
    readonly canConvert: boolean;
    readonly loadingStatus: string;
    readonly isProcessing: boolean;
};
