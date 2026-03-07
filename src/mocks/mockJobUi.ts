import type { JobUi } from '@/types/ui.type';

// GOLDEN_MASTER (Fixed Ver.) Data Replication
// Target: public/golden_master.png
// All items seem to be "株式会社エーアイシステム" with similar statuses.


// In the Golden Master image:
// Row 1: 株式会社エーアイシステム, 3月決算, freee, Step1(Green), Step2(Green), Step3(Blue Pending), Step4(Pink Pending), Step5(Green Check)
// Button: 1次仕訳 (Blue)

export const mockJobUiList: Partial<JobUi>[] = [
    {
        id: '1001',
        clientCode: '1001',
        clientName: '株式会社エーアイシステム',
        fiscalMonthLabel: '3月決算',
        softwareLabel: 'freee',
        priority: 'normal', // No red badge
        steps: {
            document: { state: 'done', label: '資料受領', count: 0 },
            aiAnalysis: { state: 'done', label: 'AI解析', count: 0 },
            journalEntry: { state: 'pending', label: '未着手', count: 1 }, // Blue
            approval: { state: 'pending', label: '未承認', count: 0 },    // Pink
            remand: { state: 'done', label: '差戻対応', count: 0 },       // Green Check
            export: { state: 'pending', label: '-', count: 0 }, // Empty
            archive: { state: 'pending', label: '-', count: 0 }, // Empty
        },
        rowStyle: 'bg-white', // Simple white background
        primaryAction: {
            type: 'work',
            label: '1次仕訳',
            isEnabled: true
        },
        nextAction: {
            type: 'none',
            label: '',
            isEnabled: false
        }
    },
    // Repeats 4 times in the image
    {
        id: '1001_2',
        clientCode: '1001',
        clientName: '株式会社エーアイシステム',
        fiscalMonthLabel: '3月決算',
        softwareLabel: 'freee',
        priority: 'normal',
        steps: {
            document: { state: 'done', label: '資料受領', count: 0 },
            aiAnalysis: { state: 'done', label: 'AI解析', count: 0 },
            journalEntry: { state: 'pending', label: '未着手', count: 1 },
            approval: { state: 'pending', label: '未承認', count: 0 },
            remand: { state: 'done', label: '差戻対応', count: 0 },
            export: { state: 'pending', label: '-', count: 0 },
            archive: { state: 'pending', label: '-', count: 0 },
        },
        rowStyle: 'bg-white',
        primaryAction: { type: 'work', label: '1次仕訳', isEnabled: true },
        nextAction: { type: 'none', label: '', isEnabled: false }
    },
    {
        id: '1001_3',
        clientCode: '1001',
        clientName: '株式会社エーアイシステム',
        fiscalMonthLabel: '3月決算',
        softwareLabel: 'freee',
        priority: 'normal',
        steps: {
            document: { state: 'done', label: '資料受領', count: 0 },
            aiAnalysis: { state: 'done', label: 'AI解析', count: 0 },
            journalEntry: { state: 'pending', label: '未着手', count: 1 },
            approval: { state: 'pending', label: '未承認', count: 0 },
            remand: { state: 'done', label: '差戻対応', count: 0 },
            export: { state: 'pending', label: '-', count: 0 },
            archive: { state: 'pending', label: '-', count: 0 },
        },
        rowStyle: 'bg-white',
        primaryAction: { type: 'work', label: '1次仕訳', isEnabled: true },
        nextAction: { type: 'none', label: '', isEnabled: false }
    },
    {
        id: '1001_4',
        clientCode: '1001',
        clientName: '株式会社エーアイシステム',
        fiscalMonthLabel: '3月決算',
        softwareLabel: 'freee',
        priority: 'normal',
        steps: {
            document: { state: 'done', label: '資料受領', count: 0 },
            aiAnalysis: { state: 'done', label: 'AI解析', count: 0 },
            journalEntry: { state: 'pending', label: '未着手', count: 1 },
            approval: { state: 'pending', label: '未承認', count: 0 },
            remand: { state: 'done', label: '差戻対応', count: 0 },
            export: { state: 'pending', label: '-', count: 0 },
            archive: { state: 'pending', label: '-', count: 0 },
        },
        rowStyle: 'bg-white',
        primaryAction: { type: 'work', label: '1次仕訳', isEnabled: true },
        nextAction: { type: 'none', label: '', isEnabled: false }
    },
    // Last one: 合同会社ベータ企画
    {
        id: '1002',
        clientCode: '1002',
        clientName: '合同会社ベータ企画',
        fiscalMonthLabel: '3月決算',
        softwareLabel: 'freee',
        priority: 'normal',
        steps: {
            document: { state: 'done', label: '資料受領', count: 0 },
            aiAnalysis: { state: 'done', label: 'AI解析', count: 0 },
            journalEntry: { state: 'pending', label: '未着手', count: 1 },
            approval: { state: 'pending', label: '未承認', count: 0 },
            remand: { state: 'done', label: '差戻対応', count: 0 },
            export: { state: 'pending', label: '-', count: 0 },
            archive: { state: 'pending', label: '-', count: 0 },
        },
        rowStyle: 'bg-white',
        primaryAction: { type: 'work', label: '1次仕訳', isEnabled: true },
        nextAction: { type: 'none', label: '', isEnabled: false }
    }
];
