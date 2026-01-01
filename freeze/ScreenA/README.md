
# Screen A Freeze Specification (v2)

## Basic Information
- **Screen**: Screen A (Client List)
- **Phase**: Freeze
- **Freeze Version**: v2
- **Captured At**: 2026-01-01 12:00
- **Commit**: (HEAD)

## Evidence
- **Phase A**: [golden_ui.png](screenshots/golden_ui.png) (Zero Diff Verified)
- **Phase B**: [refactor_after.png](screenshots/refactor_after.png) (Skipped - Identity Verified)
- **Phase C**:
  - [stress_worst.png](screenshots/stress_worst.png) (Lv4 Ironclad Safe)
  - [stress_longtext.png](screenshots/stress_longtext.png) (Layout Safe)

## Technical Proofs
- [Appendix B (Signed)](../../ui-freeze-appendix-b.md)
- [Compliance Checklist](../../ui-freeze-checklist.yaml)
- [Mapper Test Log](technical-proofs/mapper_test.log)
- [Build Kill Log](technical-proofs/build_fail.log)

## Freeze Logic
- **UI Contract**: `src/aaa/aaa_types/aaa_ui.type.ts`
- **Defense Layer**: `src/aaa/aaa_composables/aaa_ClientMapper.ts` (Harden Lv4)

## Status
**FROZEN**.
Any modification requires re-certification from Phase A.
