
# UI Freeze Policy (Constitution)

## 0. 本文書の位置づけ（最重要）
本書は UI 開発における Freeze（凍結）状態を定義する契約文書である。
本書に違反した UI は、いかなる理由があっても Freeze 完了とは認められない。

- **本書に明記されていない行為は 原則禁止**
- **「実害がない」「結果的に問題が出なかった」は 一切考慮しない**
- **証跡が存在しない場合、作業は未実施とみなす**
- **事後対応・事後撮影・事後説明は すべて無効**

## 1. 最終到達状態（Freeze 定義）
Freeze とは、以下すべてが **不可逆的に確定した状態** を指す。
- UI構造、表示仕様、データ契約（Contract）、防御方針 が確定している。
- 視覚証跡、README が保存されている。

## 2. フェーズ構成（厳守）
1. **Phase A：Visual Truth（見た目確定）**
2. **Phase B：Non-Destructive Refactor（構造整理）**
3. **Phase C：Ironclad Contract（契約確定）**
4. **Freeze（状態）**

## 3. Phase 越境禁止ルール（絶対）
- Phase A 中に Phase B / C の作業を行うことは禁止（即時失格）。
- Phase B 中に見た目を変えることは禁止。
- Phase C 中に UI / レイアウトへ手を触れることは禁止。

## 4. Phase A：Visual Truth（見た目確定）
正解画像と 1px も違わない UI を確定させる。
- **許可**: 直書き、コピペ、ハードコード、ダミー値。
- **禁止**: コンポーネント分割、共通化、条件分岐、再利用設計。
- **完了条件**: Overlay Diff 0px ＋ 証跡。

## 5. Phase B：Non-Destructive Refactor（構造整理）
- **目的**: 見た目を 1px も変えずに構造のみ整理。
- **着手条件**: Phase A 完了証跡があること。
- **完了条件**: Before / After Overlay 0px ＋ 証跡。

## 6. Phase C：Ironclad Contract（契約確定）
- **目的**: どんなデータが来ても UI を白くしない。
- **禁止**: UI 側への fallback 追加、Mapper 型拡張、optional 追加。
- **完了条件**: Mapper が例外を投げない、UI が白くならない、Contract が堅牢、レイアウト崩壊なし、コンソールエラー 0。

## 7. Freeze（凍結）
全フェーズ完了し、証跡・README が揃った状態。
- **解除条件**: 正解画像の変更、仕様変更、新 Version 合意のみ。
