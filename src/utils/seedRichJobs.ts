// src/utils/seedRichJobs.ts
import { FirestoreRepository } from '@/services/firestoreRepository';

export const seedRichJobs = async (clientCode: string = 'AMT') => {
  console.log(`Seeding rich jobs for ${clientCode}...`);
  const now = new Date();

  const mockJobs: Omit<Job, "id" | "createdAt" | "updatedAt">[] = [
    // Job 1: 未着手 (Amazon消耗品)
    {
      clientCode,
      status: 'pending',
      transactionDate: now,
      driveFileId: 'mock-file-1',
      confidenceScore: 0.95,
      lines: [
        {
          lineNo: 1,
          description: 'Amazon.co.jp', // 摘要
          subAccount: 'Amazon',        // 仕入先
          accountItem: '消耗品費',      // 借方
          taxType: '課対仕入10%',
          drAccount: '消耗品費',
          crAccount: '未払金',
          drAmount: 1100,
          crAmount: 1100,
          amount: 1100 // Legacy support if needed, but strict JournalLine uses drAmount/crAmount
        }
      ],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.95, reasoning: 'Amazonの領収書パターンと一致' }),
      isDuplicate: false
    },
    // Job 2: 履歴あり (タクシー)
    {
      clientCode,
      status: 'pending',
      transactionDate: new Date(now.getTime() - 86400000 * 2), // 2日前
      driveFileId: 'mock-file-2',
      confidenceScore: 0.88,
      lines: [
        {
          lineNo: 1,
          description: 'MKタクシー 移動費',
          subAccount: 'MKタクシー',
          accountItem: '旅費交通費',
          taxType: '課対仕入10%',
          drAccount: '旅費交通費',
          crAccount: '現金',
          drAmount: 4500,
          crAmount: 4500,
          amount: 4500
        }
      ],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.88, reasoning: 'MKタクシーの履歴あり' }),
      isDuplicate: false
    },
    // Job 3: 重複疑い
    {
      clientCode,
      status: 'pending',
      transactionDate: new Date(now.getTime() - 86400000 * 5),
      driveFileId: 'mock-file-3',
      confidenceScore: 0.92,
      lines: [
        {
          lineNo: 1,
          description: 'スターバックス コーヒー',
          subAccount: 'Starbucks',
          accountItem: '会議費',
          taxType: '課対仕入10%',
          drAccount: '会議費',
          crAccount: '現金',
          drAmount: 1500,
          crAmount: 1500,
          amount: 1500
        }
      ],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.92, reasoning: '金額と日付が近接' }),
      isDuplicate: true // 重複フラグ
    },
    // Job 4: 差戻し中
    {
      clientCode,
      status: 'remanded', // 差戻しステータス
      transactionDate: new Date(now.getTime() - 86400000 * 10),
      driveFileId: 'mock-file-4',
      confidenceScore: 0.50,
      lines: [{
        lineNo: 1,
        description: '用途不明の出金',
        drAccount: '仮払金',
        crAccount: '普通預金',
        drAmount: 50000,
        crAmount: 50000,
        amount: 50000
      }],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.50, reasoning: '詳細不明' }),
      remandReason: '領収書が添付されていません。確認をお願いします。'
    },
    // Job 5: 完了済み
    {
      clientCode,
      status: 'approved', // 完了ステータス
      transactionDate: new Date(now.getTime() - 86400000 * 20),
      driveFileId: 'mock-file-5',
      confidenceScore: 0.99,
      lines: [{
        lineNo: 1,
        description: 'サーバー費用',
        drAccount: '通信費',
        crAccount: '普通預金',
        drAmount: 21450,
        crAmount: 21450,
        amount: 21450
      }],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.99, reasoning: '定期契約' }),
    },
    // Job 6: 自動検知銀行 (マスタ未登録)
    {
      clientCode,
      status: 'review',
      transactionDate: now,
      driveFileId: 'mock-file-6',
      confidenceScore: 0.88,
      detectedBank: 'Mitsubishi_UFJ',
      lines: [
        {
          lineNo: 1,
          description: '振込手数料',
          drAccount: '支払手数料',
          crAccount: '自動検知_Mitsubishi_UFJ_1234567', // Auto-generated
          drAmount: 330,
          crAmount: 330,
          amount: 330,
          isAutoMaster: true // New flag
        }
      ],
      aiAnalysisRaw: JSON.stringify({ confidence: 0.88, reasoning: '残高連続性により三菱UFJと判定' })
    }
  ];

  for (const job of mockJobs) {
    await FirestoreRepository.addJob(job);
  }

  // Ensure Client has expectedMaterials for Screen C verification
  await FirestoreRepository.updateClient(clientCode, {
    expectedMaterials: ['領収書', '通帳コピー', '請求書', '給与台帳(未受領)']
  });

  alert('リッチなテストデータを5件投入し、クライアントの回収予定資料設定を更新しました！');
};
