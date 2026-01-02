# Screen D: AI Rules Management (Frozen)

This directory contains the **Ironclad Freeze Artifacts** for Screen D.
This UI unit has passed **Phase A (Visual Truth)** and is protected from destructive changes.

## Artifacts
- **`golden_ui_list.png`**: Client Selection View.
- **`golden_ui_detail.png`**: Rule Management View.
- **`golden_ui_modal.png`**: Rule Edit Modal.
- **`types.ts`**: The strict data interface (`LearningRuleUi`).
- **`mock_data.json`**: The canonical test data.
- **`ui-freeze-checklist.yaml`**: Verification checklist.
- **`ui-freeze-appendix-b-signed.md`**: Formal sign-off document.

## Usage
When implementing backend integration (Phase C), you MUST ensure the API response maps exactly to `types.ts`.
Do NOT modify the UI components (`aaa_ScreenD_AIRules.vue`, `aaa_RuleCard.vue`, `aaa_RuleDetailModal.vue`) unless specifically authorized via a "Refactoring Plan".
