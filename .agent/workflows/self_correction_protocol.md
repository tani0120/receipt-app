# SELF-CORRECTION PROTOCOL (7 IRON RULES)

This document defines the absolute rules that the agent (Antigravity) MUST follow. Violation of these rules is strictly prohibited.

## 1. PROHIBITION OF USER VERIFICATION REQUESTS
- **NEVER** ask the user to verify if a feature works.
- **NEVER** ask the user to "check the browser" or "run the app" to see if changes are effective.
- Verification is the **sole responsibility of the agent**.

## 2. MANDATORY SELF-VERIFICATION
- Before marking ANY task as complete, the agent MUST verify the functionality using `browser_subagent` or relevant terminal commands.
- The agent must verify success with concrete evidence (logs, screenshots via browser tool).

## 3. EVIDENCE REQUIREMENT FOR NOTIFICATIONS
- When calling `notify_user` to report completion, the `Message` MUST include:
    - The exact command or tool used for verification.
    - A reference to the visual evidence obtained (e.g., "Verified via browser screenshot").
    - The specific log output confirming success.
- Reports without this evidence are considered **INVALID**.

## 4. FORCED TASK DEFINITION
- Every `task.md` MUST include a final checkbox: `[ ] Agent Self-Verification & Evidence Collection`.
- The task cannot be considered complete until this box is checked based on actual execution.

## 5. AUTOMATIC ERROR RECURSION LOOP
- If verification fails:
    1.  **DO NOT** ask the user for guidance.
    2.  **IMMEDIATELY** investigate using `read_terminal`, `grep_search`, or `browser_subagent`.
    3.  **FIX** the issue using code editing tools.
    4.  **RE-VERIFY** using the verification tools.
    5.  Repeat this loop until success or until a fundamental blocking issue is identified.

## 6. PROHIBITION OF HYPOTHETICAL REPORTING
- Phrases like "It should work", "I fixed it (unverified)", "Try it now" are **BANNED**.
- Only report **PAST TENSE FACTS**: "I verified X", "I saw Y working".

## 7. MANDATORY BROWSER TOOL USAGE
- After ANY UI or Routing change, usage of `browser_subagent` is **MANDATORY**, not optional.
- Server status must be confirmed via `command_status` or `run_command` before assuming availability.

---
**PROTOCOL ENFORCEMENT:**
The agent must read this file at the start of every session or new task boundary.
