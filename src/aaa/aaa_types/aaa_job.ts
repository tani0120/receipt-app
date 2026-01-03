import type { Job as FirestoreJob } from './aaa_firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * 業務フローに基づく厳密なステータス定義
 */
export type JobStatus =
  | 'pending'            // 初期状態: 1次仕訳待ち
  | 'primary_completed'  // 1次仕訳完了: 最終承認待ち (画面上は ☑ + [最終確認])
  | 'final_pending'      // (Optional) 最終確認中
  | 'remanded'           // 差戻し中: [差戻し] ボタン表示
  | 'completed';         // 完了: 全て完了

/**
 * Job Interface
 * Firestoreの型をベースにしつつ、ステータス型を厳密化
 */
export interface Job extends Omit<FirestoreJob, 'status'> {
  status: JobStatus;

  // ステータスごとのメタデータ (Optional)
  primaryCompletedAt?: Timestamp;
  finalCompletedAt?: Timestamp;
  remandReason?: string;

  // UI Display Helper
  clientName?: string;
}

/**
 * アクションタイプ定義
 * Service層での状態遷移に使用
 */
export type JobActionType =
  | 'COMPLETE_PRIMARY'   // 1次仕訳完了
  | 'APPROVE_FINAL'      // 最終承認
  | 'REMAND'             // 差戻し発生 (Reserved word avoidance if needed, using 'REMAND')
  | 'RESOLVE_REMAND';    // 差戻し対応完了
