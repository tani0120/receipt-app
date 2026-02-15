/**
 * Receipt モック型定義
 *
 * 目的: 領収書画像表示のモック検証用
 * 将来: Supabase Storage連携時にimage_url生成ロジックを追加
 */

export interface ReceiptMock {
    id: string;                    // 領収書ID
    client_id: string;             // 顧問先ID
    image_url: string;             // 画像URL（モック用: 相対パスまたは絶対パス）
    uploaded_at: string;           // アップロード日時（ISO 8601）
    file_name: string;             // ファイル名
}
