# Screen B Specification Checklist (Phase A'' Trace)

Target Image: `GOLDEN_MASTER (Fixed Ver.)`
Objective: Deconstruct the visual implementation into explicit numerical values defined by the USER.
AI Role: Reflect these values strictly into the code without interpretation.

## 1. Global Layout (Grid & Dimensions)
| Component | Current Implementation (Tailwind) | Target Value (Please Specify if different) |
|-----------|-----------------------------------|--------------------------------------------|
| **Left Column (Client Info)** | `w-56` (14rem / 224px) | |
| **Action Column (Right)** | `w-40` (10rem / 160px) | |
| **Middle Steps Area** | `flex-1` (Fluid) / `min-w-[700px]` | |
| **Header Row Height** | Content driven (`p-2`, `pt-3`, `pb-3`) | |
| **Body Row Height** | `h-24` (6rem / 96px) | |

## 2. Typography & Fonts
| Element | Current Font Size | Current Weight | Target Spec |
|---------|-------------------|----------------|-------------|
| **Client Name** | `text-sm` (14px) | `font-bold` | |
| **Client Code** | `text-[10px]` | `font-bold` | |
| **Step Label (Small)** | `text-[9px]` | Regular | |
| **Step Status (Large)** | (Icon size) | - | |
| **Card Badge Text** | `text-[9px]` | `font-bold` | |

## 3. Spacing & Padding
| Context | Current Setting | Target Spec |
|---------|-----------------|-------------|
| **Header Cell Padding** | `p-2` (8px) | |
| **Body Cell Padding** | `px-1.5 py-2` (6px / 8px) | |
| **Client Info Left Pad** | `pl-4` (16px) | |
| **Filter Bar Height** | `p-3` (12px padding) | |

## 4. Visual Styles (Colors & Borders)
| Element | Current Style | Target Spec |
|---------|---------------|-------------|
| **Header Border Bottom** | `border-b` (1px) | |
| **Step 3 Header BG** | `bg-indigo-50` | |
| **Step 4 Header BG** | `bg-pink-50` | |
| **Row Divider** | `border-b border-gray-100` | |
| **Dropdown Menu** | (Closed in Fixed Ver.) | (Confirm Closed) |

## 5. Specific Micro-Adjustments
*Please list any specific pixel shifts required.*
- Example: "Shift the 'Next Action' button 2px to the left"
- 
- 
- 

---
**AI Instruction:**
Wait for the USER to provide values for any of the above fields. Do NOT guess or interpolate.
