# Screen B (Journal Status) Strict Specification

## 1. Overview
A dashboard for managing the journal entry progress of all clients.
Features a 7-step progress grid, action-based filtering, and modals for error resolution and file operations.

## 2. Layout Structure

### 2.1 Filter Bar (Top)
- **Background**: `bg-slate-50`
- **Left**: Icon `fa-calculator` (blue-400) + Text "全クライアントの仕訳進捗を管理できます" (text-xs, gray-500)
- **Right**:
    - **Action Filter**: Select box
        - Options: "すべてのアクション", "エラー確認", "1次仕訳", "差戻対応", "最終承認", "CSV出力", "仕訳対象外", "完了"
        - Style: `text-xs border border-gray-300 rounded px-2 py-1 bg-white font-bold text-slate-600`
    - **Search**: Input "ID / 会社名で検索"
        - Icon: `fa-search` (absolute left)
        - Style: `pl-7 pr-2 py-1 text-xs border border-gray-300 rounded w-48`

### 2.2 Table Header (Sticky)
- **Height**: Auto
- **Background**: `bg-white`
- **Columns**:
    1. **Client Info** (`w-56`, `bg-slate-50`): "顧問先情報"
    2. **Step Grid** (Flex-1, Grid cols-7):
        - Step 1: "資料受領" (`bg-blue-50/30`)
        - Step 2: "AI解析" (`bg-blue-50/30`)
        - Step 3: "1次仕訳" (`bg-indigo-50`, border-b-4 indigo)
        - Step 4: "最終承認" (`bg-pink-50`, border-b-4 pink)
        - Step 5: "差戻対応" (`bg-orange-50`, border-b-4 orange)
        - Step 6: "CSV出力" (`bg-green-50`, border-b-4 green)
        - Step 7: "原本整理" (`bg-gray-50`)
    3. **Action** (`w-40`, `bg-slate-100`): "次のアクション"

### 2.3 Client Row (Repeater)
- **Height**: `h-24`
- **Hover Effect**: Defined by `getRowBaseClass` (e.g., `hover:bg-indigo-50` for Work)

#### Column 1: Client Info (`w-56`)
- **Row 1**: Company Name (Bold, truncate) + "🆕 新着" badge (if `isNew`)
- **Row 2**:
    - Code (`text-[10px] font-mono`, bold)
    - Software (Gray badge `bg-gray-100`, border)
    - Fiscal Month (`text-[10px]`, bold, right-aligned "X月決算")

#### Column 2: Step Grid (Grid cols-7)
- **Step 1 (Receipt)**: Icon (Check green / Exclamation red / Dash gray)
- **Step 2 (AI Analysis)**:
    - Done: Check green
    - Error: `fa-ban` red + Error Msg (text-[9px])
    - Processing: `fa-spinner` blue
- **Step 3 (Journal Entry)**:
    - Pending: Card (`bg-indigo-50` border indigo) -> "残り X件" (Indigo-400 bg), "未着手" text
    - Done: Check green
- **Step 4 (Approval)**:
    - Pending: Card (`bg-pink-50`) -> "残り X件", "未承認"
    - Done: Check green
- **Step 5 (Remand)**:
    - Pending: Card (`bg-orange-50`) -> "残り X件", "差戻対応"
    - Done: Check green
- **Step 6 (Export)**:
    - Done: "出力済" (Icon csv green)
    - Ready: Button "未出力" (`bg-green-50` border green)
- **Step 7 (Archive)**:
    - Done: Check green
    - Ready: Button "残(X)" (`bg-blue-50` border blue)

#### Column 3: Action Button (`w-40`)
- **Dynamic Button** based on `nextAction.type`:
    - **Work**: Indigo ("1次仕訳")
    - **Approve**: Pink ("最終承認")
    - **Remand**: Orange ("差戻対応")
    - **Export**: Emerald ("CSV出力")
    - **Rescue**: Red ("エラー確認")
    - **Archive**: Gray ("仕訳対象外")
    - **Done**: Gray (Disabled)

## 3. Modals

### 3.1 Error Rescue Modal
- **Trigger**: "Rescue" action
- **Header**: Red (`bg-red-600`), "エラー詳細 (Error Rescue)"
- **Content**:
    - Icon: `fa-bug` in red circle
    - Message: "AI解析エラーが発生しました"
    - Log View: Black bg, green text (mocked stack trace)
- **Footer**:
    - "仕訳対象外に移動" (Gray button)
    - "1次仕訳処理に移動" (Blue button)

### 3.2 Drive Open Modal
- **Trigger**: Export/Archive buttons
- **Content**:
    - Icon + Title ("Drive Opened")
    - Path display (`bg-gray-50` monospace)
    - "OK" button

## 4. Logic & Data
- **Data Source**: Mock data array in `ScreenB_TestPage_Strict.vue` (to be created)
- **State**:
    - `filters`: { masterSearch, actionStatus }
    - `modal`: { show, type, data... }
- **Navigation**:
    - Work/Approve/Remand -> `/journal-entry/:id`
