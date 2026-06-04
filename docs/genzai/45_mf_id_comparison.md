# MF ID 全件比較（MCP実機取得 — 2回検証）

## 検証方法

MF MCPサーバー（`mfc_ca_getTaxes`, `mfc_ca_getAccounts`）から、2つの異なる事業者のデータを**2回ずつ**リアルタイム取得し、以下を検証した：

1. **同一事業者の安定性**: 同じ事業者に対して2回取得したときに同じIDが返るか
2. **事業者間の一致性**: 同名の税区分・勘定科目が異なる事業者で同じIDを持つか

検証スクリプト: `scripts/compare-mf-ids.ts`（`dotenv/config`で.env.localを読み込み、MCPクライアント経由で直接取得）

## 結論

> [!CAUTION]
> **税区分・勘定科目ともに、MF IDは事業者（テナント）ごとに異なる。事業者間のID照合は不可能。名前照合のみ。**

| 項目 | 同一事業者安定性（1回目=2回目） | 事業者間一致 | ID照合可否 |
|---|---|---|---|
| **税区分** | TSK: 151/151 ✅, TST: 151/151 ✅ | **0/151** ❌ | **名前照合のみ** |
| **勘定科目** | TSK: 108/164 ✅, TST: 133/164 ✅ | **0/164** ❌ | **名前照合のみ** |

- 同一事業者に対して2回取得すると**同じIDが返る**（事業者内では不変）
- 事業者間では**全件不一致**（0件一致）— 「課税売上 10%」「現金」等の最も基本的な項目でさえIDが異なる
- 勘定科目の安定性が108/164, 133/164なのは、片方にしか存在しない科目（個人専用/法人専用）があるため

> [!WARNING]
> **前回セッションの「税区分IDは全社共通」という結論は完全な誤りだった。**
> 原因: JSONファイル5社の比較で全社一致と判定したが、実際には同一MFアカウントからインポートしたデータが5ファイルに保存されていただけだった。

### 設計への影響

- **A2（全社マスタインポートの名前照合→mfId照合への移行）は税区分・勘定科目ともに不可能**
- 全社マスタにmfIdを保持する意味は**一切ない**（事業者固有IDのため） → 削除済み（コミット654fe11）
- ~~個別顧問先データにmfIdを保持する意味は**あり**~~ → **削除済み（コミット8ae4531）**。仕訳送信時はmfMappingServiceがMCPからリアルタイムに取得し名前照合で解決するため、保存は不要。読み取り箇所がゼロだった
- **照合は全て名前ベースで統一** → 実装完了。MCP実機テストで税区分151/151件、勘定科目名前照合も動作確認済み

---

## 対象事業者

> 1回目: 2026-06-01 23:23 取得
> 2回目: 2026-06-01 23:25 取得（再検証）
> 両方ともMCP実機（`mfc_ca_getTaxes`, `mfc_ca_getAccounts`）から直接取得。

| コード | clientId | 会社名 | 種別 |
|---|---|---|---|
| **TSK** | `c_wTdnMKDO` | あああ（谷風行寛） | 個人 |
| **TST** | `c_rODnkCDN` | 株式会社すぐする | 法人 |


---

## 1. 税区分（mfc_ca_getTaxes）

- TSK 1回目: 151件, 2回目: 151件
- TST 1回目: 151件, 2回目: 151件

| # | 税区分名 | TSK 1回目 | TSK 2回目 | TSK安定 | TST 1回目 | TST 2回目 | TST安定 | TSK=TST |
|---|---|---|---|---|---|---|---|---|
| 1 | 不明 | `NDmgf+1zDq/wlK…` | `NDmgf+1zDq/wlK…` | ✅ | `G1ThCLEFBob5WM…` | `G1ThCLEFBob5WM…` | ✅ | ❌ |
| 2 | 共通特定課税仕入 10% | `EJ5QIzzIgcvoU4…` | `EJ5QIzzIgcvoU4…` | ✅ | `2kFycniYOHemM3…` | `2kFycniYOHemM3…` | ✅ | ❌ |
| 3 | 共通特定課税仕入 8% | `uSzdCwWCE5HvxC…` | `uSzdCwWCE5HvxC…` | ✅ | `Dg0BBorkBiJkBE…` | `Dg0BBorkBiJkBE…` | ✅ | ❌ |
| 4 | 共通特定課税仕入-返還等 10% | `7Hbq6oLsuPcdcL…` | `7Hbq6oLsuPcdcL…` | ✅ | `wh33MBrqzzW9m0…` | `wh33MBrqzzW9m0…` | ✅ | ❌ |
| 5 | 共通特定課税仕入-返還等 8% | `PZ24mA6L0YM/el…` | `PZ24mA6L0YM/el…` | ✅ | `Z+OfmBYiSCkpv2…` | `Z+OfmBYiSCkpv2…` | ✅ | ❌ |
| 6 | 共通課税仕入 (軽)8% | `hXOiav+T04AP9X…` | `hXOiav+T04AP9X…` | ✅ | `fODYYhaHsHCZKo…` | `fODYYhaHsHCZKo…` | ✅ | ❌ |
| 7 | 共通課税仕入 10% | `R61jw88x/BuRdk…` | `R61jw88x/BuRdk…` | ✅ | `dCMYCnQFsS2qfc…` | `dCMYCnQFsS2qfc…` | ✅ | ❌ |
| 8 | 共通課税仕入 5% | `6PFv5S4V3+4loY…` | `6PFv5S4V3+4loY…` | ✅ | `Yx8wsIXLuxOz6i…` | `Yx8wsIXLuxOz6i…` | ✅ | ❌ |
| 9 | 共通課税仕入 8% | `UAyR9eXFQecY5+…` | `UAyR9eXFQecY5+…` | ✅ | `5pen1tybh7vnJn…` | `5pen1tybh7vnJn…` | ✅ | ❌ |
| 10 | 共通課税仕入-返還等 (軽)8% | `amaP08nBIGExgD…` | `amaP08nBIGExgD…` | ✅ | `euowbSj/+h6Gj/…` | `euowbSj/+h6Gj/…` | ✅ | ❌ |
| 11 | 共通課税仕入-返還等 10% | `h6P6i1+Ui+c8d4…` | `h6P6i1+Ui+c8d4…` | ✅ | `MC3t3TsGmarXYY…` | `MC3t3TsGmarXYY…` | ✅ | ❌ |
| 12 | 共通課税仕入-返還等 5% | `wKvY1O77YiEuNx…` | `wKvY1O77YiEuNx…` | ✅ | `DkHYSZtaxm4T4c…` | `DkHYSZtaxm4T4c…` | ✅ | ❌ |
| 13 | 共通課税仕入-返還等 8% | `SRvxHIJ8cKXuRO…` | `SRvxHIJ8cKXuRO…` | ✅ | `mwgH98Imxx4dww…` | `mwgH98Imxx4dww…` | ✅ | ❌ |
| 14 | 共通輸入仕入-地方消費税額 (軽)1.76% | `V2XI0zIXaeAHZ1…` | `V2XI0zIXaeAHZ1…` | ✅ | `2/ZwGVjiPiyc50…` | `2/ZwGVjiPiyc50…` | ✅ | ❌ |
| 15 | 共通輸入仕入-地方消費税額 1% | `RhYO1ijAdo9NQs…` | `RhYO1ijAdo9NQs…` | ✅ | `XUzso79BSWuPKP…` | `XUzso79BSWuPKP…` | ✅ | ❌ |
| 16 | 共通輸入仕入-地方消費税額 1.7% | `C6yuEpvGTIswyY…` | `C6yuEpvGTIswyY…` | ✅ | `KqgcP+WHTur620…` | `KqgcP+WHTur620…` | ✅ | ❌ |
| 17 | 共通輸入仕入-地方消費税額 2.2% | `DzyVGXIbzsgELE…` | `DzyVGXIbzsgELE…` | ✅ | `Wl/v5P5fBXSeaK…` | `Wl/v5P5fBXSeaK…` | ✅ | ❌ |
| 18 | 共通輸入仕入-本体 (軽)8% | `0sNy172jzz6Z9Y…` | `0sNy172jzz6Z9Y…` | ✅ | `OgukBnkBIhoh8P…` | `OgukBnkBIhoh8P…` | ✅ | ❌ |
| 19 | 共通輸入仕入-本体 10% | `Elqkk4hgVAH++P…` | `Elqkk4hgVAH++P…` | ✅ | `hRgPdh8enH69oZ…` | `hRgPdh8enH69oZ…` | ✅ | ❌ |
| 20 | 共通輸入仕入-本体 5% | `6W0VLHuVsWulLo…` | `6W0VLHuVsWulLo…` | ✅ | `trcoO6Us7u8CD4…` | `trcoO6Us7u8CD4…` | ✅ | ❌ |
| 21 | 共通輸入仕入-本体 8% | `15VM0fdZuJdNub…` | `15VM0fdZuJdNub…` | ✅ | `8mljBcSLFzY8iC…` | `8mljBcSLFzY8iC…` | ✅ | ❌ |
| 22 | 共通輸入仕入-消費税額 (軽)6.24% | `ODyXX04kGviH3w…` | `ODyXX04kGviH3w…` | ✅ | `gu/OzxGW/3Ba/i…` | `gu/OzxGW/3Ba/i…` | ✅ | ❌ |
| 23 | 共通輸入仕入-消費税額 4% | `iT1JCppyFbA5Cj…` | `iT1JCppyFbA5Cj…` | ✅ | `HQiNKnNiNNtE9P…` | `HQiNKnNiNNtE9P…` | ✅ | ❌ |
| 24 | 共通輸入仕入-消費税額 6.3% | `TyR6LvLmQBugYd…` | `TyR6LvLmQBugYd…` | ✅ | `EOP3YgDVJepyOQ…` | `EOP3YgDVJepyOQ…` | ✅ | ❌ |
| 25 | 共通輸入仕入-消費税額 7.8% | `dgfwHC4pg1ZMPM…` | `dgfwHC4pg1ZMPM…` | ✅ | `EJq8RQKSBruyxu…` | `EJq8RQKSBruyxu…` | ✅ | ❌ |
| 26 | 対象外 | `uk0H3oqRin4kem…` | `uk0H3oqRin4kem…` | ✅ | `TUeGpzTseynIBs…` | `TUeGpzTseynIBs…` | ✅ | ❌ |
| 27 | 対象外仕入 | `BROC1QmbtglUxV…` | `BROC1QmbtglUxV…` | ✅ | `WnmUx1BTH89p2p…` | `WnmUx1BTH89p2p…` | ✅ | ❌ |
| 28 | 対象外売上 | `BlxMXi6pxiBxMJ…` | `BlxMXi6pxiBxMJ…` | ✅ | `eXnpPFEssNUoO3…` | `eXnpPFEssNUoO3…` | ✅ | ❌ |
| 29 | 特定課税仕入 10% | `GHWxnu+h6nRruT…` | `GHWxnu+h6nRruT…` | ✅ | `swjivD0n5kKeBM…` | `swjivD0n5kKeBM…` | ✅ | ❌ |
| 30 | 特定課税仕入 8% | `PG6KuLfNoYuNh9…` | `PG6KuLfNoYuNh9…` | ✅ | `/hFtZGkiEsAnyz…` | `/hFtZGkiEsAnyz…` | ✅ | ❌ |
| 31 | 特定課税仕入-返還等 10% | `hnWxAoKvcqAv7F…` | `hnWxAoKvcqAv7F…` | ✅ | `T74oygzqdbtyeB…` | `T74oygzqdbtyeB…` | ✅ | ❌ |
| 32 | 特定課税仕入-返還等 8% | `F8QanxgHfnYgMG…` | `F8QanxgHfnYgMG…` | ✅ | `3YL+UzmSXCMTha…` | `3YL+UzmSXCMTha…` | ✅ | ❌ |
| 33 | 課税仕入 (軽)8% | `k50XJj+SVyy63t…` | `k50XJj+SVyy63t…` | ✅ | `DDtRN9vo8v5O1h…` | `DDtRN9vo8v5O1h…` | ✅ | ❌ |
| 34 | 課税仕入 10% | `4L25mHcviZUIjy…` | `4L25mHcviZUIjy…` | ✅ | `4jF5JKG4PxxsMw…` | `4jF5JKG4PxxsMw…` | ✅ | ❌ |
| 35 | 課税仕入 5% | `3oozS20o9hdGES…` | `3oozS20o9hdGES…` | ✅ | `nTx5oKC/e6tNMH…` | `nTx5oKC/e6tNMH…` | ✅ | ❌ |
| 36 | 課税仕入 8% | `zch/69gbXkgti+…` | `zch/69gbXkgti+…` | ✅ | `pu0fZyazTj3m5G…` | `pu0fZyazTj3m5G…` | ✅ | ❌ |
| 37 | 課税仕入-返還等 (軽)8% | `eSf5GOERqrHwF9…` | `eSf5GOERqrHwF9…` | ✅ | `DmV9o+DCr1NauL…` | `DmV9o+DCr1NauL…` | ✅ | ❌ |
| 38 | 課税仕入-返還等 10% | `vdXMByJWdXymQ0…` | `vdXMByJWdXymQ0…` | ✅ | `yZo1Mt0BceZHRc…` | `yZo1Mt0BceZHRc…` | ✅ | ❌ |
| 39 | 課税仕入-返還等 5% | `MNUw9CbJy11JFH…` | `MNUw9CbJy11JFH…` | ✅ | `tCGFgkJjNFO2HW…` | `tCGFgkJjNFO2HW…` | ✅ | ❌ |
| 40 | 課税仕入-返還等 8% | `F0B6U+cUJudLwM…` | `F0B6U+cUJudLwM…` | ✅ | `DgP/zwu6xmrYbd…` | `DgP/zwu6xmrYbd…` | ✅ | ❌ |
| 41 | 課税売上 (軽)8% | `WC8Qq4Kpr6Zq5d…` | `WC8Qq4Kpr6Zq5d…` | ✅ | `5nXYAZMdVQWWe2…` | `5nXYAZMdVQWWe2…` | ✅ | ❌ |
| 42 | 課税売上 (軽)8% 一種 | `45vDWP9bnSOchC…` | `45vDWP9bnSOchC…` | ✅ | `saK/ATGkp3qwur…` | `saK/ATGkp3qwur…` | ✅ | ❌ |
| 43 | 課税売上 (軽)8% 三種 | `rQDVV+2NKOmY5b…` | `rQDVV+2NKOmY5b…` | ✅ | `PsNcJdXpYudUu9…` | `PsNcJdXpYudUu9…` | ✅ | ❌ |
| 44 | 課税売上 (軽)8% 二種 | `QdHpz+ahtJ/Rgb…` | `QdHpz+ahtJ/Rgb…` | ✅ | `m1ShWY8+J9nChW…` | `m1ShWY8+J9nChW…` | ✅ | ❌ |
| 45 | 課税売上 (軽)8% 五種 | `hvX/UcCK8wg0Vg…` | `hvX/UcCK8wg0Vg…` | ✅ | `idUsTmp5TjzwiI…` | `idUsTmp5TjzwiI…` | ✅ | ❌ |
| 46 | 課税売上 (軽)8% 六種 | `NR7NuBLZkY8MkW…` | `NR7NuBLZkY8MkW…` | ✅ | `Ld3QSaZ357n7nZ…` | `Ld3QSaZ357n7nZ…` | ✅ | ❌ |
| 47 | 課税売上 (軽)8% 四種 | `+ZRqwqBctE5dnh…` | `+ZRqwqBctE5dnh…` | ✅ | `iq0jGm/HySx6DY…` | `iq0jGm/HySx6DY…` | ✅ | ❌ |
| 48 | 課税売上 10% | `JADP5Ohw2u502m…` | `JADP5Ohw2u502m…` | ✅ | `aXV9OyVlGZMxRz…` | `aXV9OyVlGZMxRz…` | ✅ | ❌ |
| 49 | 課税売上 10% 一種 | `3lN0Ex+2L5iscf…` | `3lN0Ex+2L5iscf…` | ✅ | `0pO3I6Fb3Z+9uM…` | `0pO3I6Fb3Z+9uM…` | ✅ | ❌ |
| 50 | 課税売上 10% 三種 | `Jqpclz/Cg0HDVX…` | `Jqpclz/Cg0HDVX…` | ✅ | `QHlPh5PTVK+VCL…` | `QHlPh5PTVK+VCL…` | ✅ | ❌ |
| 51 | 課税売上 10% 二種 | `31gv+tcUT62VyX…` | `31gv+tcUT62VyX…` | ✅ | `mlGVs5ZZFQNNBq…` | `mlGVs5ZZFQNNBq…` | ✅ | ❌ |
| 52 | 課税売上 10% 五種 | `2NFW1XwF1mgTyo…` | `2NFW1XwF1mgTyo…` | ✅ | `YZ2nFhET/PH6Xi…` | `YZ2nFhET/PH6Xi…` | ✅ | ❌ |
| 53 | 課税売上 10% 六種 | `YsETvYN421FsFg…` | `YsETvYN421FsFg…` | ✅ | `jn9dBzXcQrjcnI…` | `jn9dBzXcQrjcnI…` | ✅ | ❌ |
| 54 | 課税売上 10% 四種 | `B/desyukutw5JF…` | `B/desyukutw5JF…` | ✅ | `mMR7ZqPrym5JAl…` | `mMR7ZqPrym5JAl…` | ✅ | ❌ |
| 55 | 課税売上 5% | `pJJWx3uKmefsUi…` | `pJJWx3uKmefsUi…` | ✅ | `YxRiXbOkW00+YF…` | `YxRiXbOkW00+YF…` | ✅ | ❌ |
| 56 | 課税売上 5% 一種 | `pR8HISyiKykjjY…` | `pR8HISyiKykjjY…` | ✅ | `cfoKeXTvwFB4Z7…` | `cfoKeXTvwFB4Z7…` | ✅ | ❌ |
| 57 | 課税売上 5% 三種 | `WLMA638lHgq8K7…` | `WLMA638lHgq8K7…` | ✅ | `mkuQd1YgqZCZsQ…` | `mkuQd1YgqZCZsQ…` | ✅ | ❌ |
| 58 | 課税売上 5% 二種 | `M9txcdEu0leA+j…` | `M9txcdEu0leA+j…` | ✅ | `oeehqoRm/LbGth…` | `oeehqoRm/LbGth…` | ✅ | ❌ |
| 59 | 課税売上 5% 五種 | `frTwHI/hnntNoe…` | `frTwHI/hnntNoe…` | ✅ | `hR+pAqrPYuZqY2…` | `hR+pAqrPYuZqY2…` | ✅ | ❌ |
| 60 | 課税売上 5% 六種 | `1lriURnbp/El+M…` | `1lriURnbp/El+M…` | ✅ | `EzAcxBSL6zPMlg…` | `EzAcxBSL6zPMlg…` | ✅ | ❌ |
| 61 | 課税売上 5% 四種 | `dPUVfl+QE2pQeh…` | `dPUVfl+QE2pQeh…` | ✅ | `MrtaHQmOGtSUkh…` | `MrtaHQmOGtSUkh…` | ✅ | ❌ |
| 62 | 課税売上 8% | `Sr3NRqJkeRDGTt…` | `Sr3NRqJkeRDGTt…` | ✅ | `XYk8kLEM4G6pXP…` | `XYk8kLEM4G6pXP…` | ✅ | ❌ |
| 63 | 課税売上 8% 一種 | `/CQpI3zbC0brO8…` | `/CQpI3zbC0brO8…` | ✅ | `/zLOt6UjAlhxyR…` | `/zLOt6UjAlhxyR…` | ✅ | ❌ |
| 64 | 課税売上 8% 三種 | `tZ9RGhytGtBE+g…` | `tZ9RGhytGtBE+g…` | ✅ | `B48dWZaL1WNSkN…` | `B48dWZaL1WNSkN…` | ✅ | ❌ |
| 65 | 課税売上 8% 二種 | `vWgeWo3nZYa+/f…` | `vWgeWo3nZYa+/f…` | ✅ | `8D5P/oothyQ8Uv…` | `8D5P/oothyQ8Uv…` | ✅ | ❌ |
| 66 | 課税売上 8% 五種 | `0Lm481eaxMgn20…` | `0Lm481eaxMgn20…` | ✅ | `iwf6shI9FFsGaH…` | `iwf6shI9FFsGaH…` | ✅ | ❌ |
| 67 | 課税売上 8% 六種 | `F51dN8GxskSpQw…` | `F51dN8GxskSpQw…` | ✅ | `13IDBYhkRVdiGI…` | `13IDBYhkRVdiGI…` | ✅ | ❌ |
| 68 | 課税売上 8% 四種 | `I73o5HJSPCzIeH…` | `I73o5HJSPCzIeH…` | ✅ | `zBT7hfU0kZmE4q…` | `zBT7hfU0kZmE4q…` | ✅ | ❌ |
| 69 | 課税売上-貸倒 (軽)8% | `DG2Fn5YOHdvljg…` | `DG2Fn5YOHdvljg…` | ✅ | `/ZXhWeT5x2nJBl…` | `/ZXhWeT5x2nJBl…` | ✅ | ❌ |
| 70 | 課税売上-貸倒 10% | `fjYj/Tpy1NxNaD…` | `fjYj/Tpy1NxNaD…` | ✅ | `3WkA3hzgtQx9sm…` | `3WkA3hzgtQx9sm…` | ✅ | ❌ |
| 71 | 課税売上-貸倒 5% | `YHh1b1Fl0cXfIO…` | `YHh1b1Fl0cXfIO…` | ✅ | `VTddOHHnuG1gUd…` | `VTddOHHnuG1gUd…` | ✅ | ❌ |
| 72 | 課税売上-貸倒 8% | `yDaB5YUpbXi1b3…` | `yDaB5YUpbXi1b3…` | ✅ | `s+FSAqTVyLxRU5…` | `s+FSAqTVyLxRU5…` | ✅ | ❌ |
| 73 | 課税売上-貸倒回収 (軽)8% | `Xbj1efcfzSOgBv…` | `Xbj1efcfzSOgBv…` | ✅ | `v8aRls3Ws2wyOr…` | `v8aRls3Ws2wyOr…` | ✅ | ❌ |
| 74 | 課税売上-貸倒回収 10% | `cu0S33DO2NFciq…` | `cu0S33DO2NFciq…` | ✅ | `K/f4h7oTxWNUIj…` | `K/f4h7oTxWNUIj…` | ✅ | ❌ |
| 75 | 課税売上-貸倒回収 5% | `4H992dMWThgGi8…` | `4H992dMWThgGi8…` | ✅ | `ppojcri89K8O55…` | `ppojcri89K8O55…` | ✅ | ❌ |
| 76 | 課税売上-貸倒回収 8% | `0I2QT7l0v5rSXJ…` | `0I2QT7l0v5rSXJ…` | ✅ | `zIYIeHYOD1bMCI…` | `zIYIeHYOD1bMCI…` | ✅ | ❌ |
| 77 | 課税売上-返還等 (軽)8% | `ZpEJoNaimTqpUW…` | `ZpEJoNaimTqpUW…` | ✅ | `dEazPX71IMlFM6…` | `dEazPX71IMlFM6…` | ✅ | ❌ |
| 78 | 課税売上-返還等 (軽)8% 一種 | `DWpmt3k66ogOsO…` | `DWpmt3k66ogOsO…` | ✅ | `l+iq4CEDoNd88r…` | `l+iq4CEDoNd88r…` | ✅ | ❌ |
| 79 | 課税売上-返還等 (軽)8% 三種 | `FUIkv9Zc5bBJdP…` | `FUIkv9Zc5bBJdP…` | ✅ | `cVe0RhtMQ4iJ4l…` | `cVe0RhtMQ4iJ4l…` | ✅ | ❌ |
| 80 | 課税売上-返還等 (軽)8% 二種 | `kakiLdtNfRZgad…` | `kakiLdtNfRZgad…` | ✅ | `7iDnB/QriKrtm5…` | `7iDnB/QriKrtm5…` | ✅ | ❌ |
| 81 | 課税売上-返還等 (軽)8% 五種 | `RLsH7mcbDPGh0P…` | `RLsH7mcbDPGh0P…` | ✅ | `QUS96yoX4O4oSf…` | `QUS96yoX4O4oSf…` | ✅ | ❌ |
| 82 | 課税売上-返還等 (軽)8% 六種 | `m4p1/WLgysyguQ…` | `m4p1/WLgysyguQ…` | ✅ | `VUI9948/OXjUo+…` | `VUI9948/OXjUo+…` | ✅ | ❌ |
| 83 | 課税売上-返還等 (軽)8% 四種 | `7sU+LSf8HMZUhm…` | `7sU+LSf8HMZUhm…` | ✅ | `bQecEqUIx29sWr…` | `bQecEqUIx29sWr…` | ✅ | ❌ |
| 84 | 課税売上-返還等 10% | `V5KL8SAI5QpnHj…` | `V5KL8SAI5QpnHj…` | ✅ | `2S9tcHwLpHiuaK…` | `2S9tcHwLpHiuaK…` | ✅ | ❌ |
| 85 | 課税売上-返還等 10% 一種 | `dUhK5CUO/0BFit…` | `dUhK5CUO/0BFit…` | ✅ | `Kn5XI3iwiWKdyF…` | `Kn5XI3iwiWKdyF…` | ✅ | ❌ |
| 86 | 課税売上-返還等 10% 三種 | `Q5LYFpUMhoW6yY…` | `Q5LYFpUMhoW6yY…` | ✅ | `SBGpZxAP4BtoDs…` | `SBGpZxAP4BtoDs…` | ✅ | ❌ |
| 87 | 課税売上-返還等 10% 二種 | `Lr888ZI/wOEADU…` | `Lr888ZI/wOEADU…` | ✅ | `trriZtq3AOr7iM…` | `trriZtq3AOr7iM…` | ✅ | ❌ |
| 88 | 課税売上-返還等 10% 五種 | `6VjuQBTBOQM43k…` | `6VjuQBTBOQM43k…` | ✅ | `mA3M1HtNyjeux4…` | `mA3M1HtNyjeux4…` | ✅ | ❌ |
| 89 | 課税売上-返還等 10% 六種 | `1BF0/UKnnbGlhH…` | `1BF0/UKnnbGlhH…` | ✅ | `bmNqOf/wbgZk6S…` | `bmNqOf/wbgZk6S…` | ✅ | ❌ |
| 90 | 課税売上-返還等 10% 四種 | `dmLG9bSOe5PxEN…` | `dmLG9bSOe5PxEN…` | ✅ | `LlAmUJQM2GOQif…` | `LlAmUJQM2GOQif…` | ✅ | ❌ |
| 91 | 課税売上-返還等 5% | `P6E5C0kpXk0oIe…` | `P6E5C0kpXk0oIe…` | ✅ | `eYvTIfFJmiY5D0…` | `eYvTIfFJmiY5D0…` | ✅ | ❌ |
| 92 | 課税売上-返還等 5% 一種 | `ra4/0FPO+YOsEP…` | `ra4/0FPO+YOsEP…` | ✅ | `UfI9kRL0Ymswms…` | `UfI9kRL0Ymswms…` | ✅ | ❌ |
| 93 | 課税売上-返還等 5% 三種 | `fGFDvPF9AFo0xI…` | `fGFDvPF9AFo0xI…` | ✅ | `6iebJ40Fxl2CHI…` | `6iebJ40Fxl2CHI…` | ✅ | ❌ |
| 94 | 課税売上-返還等 5% 二種 | `eVscHLcbhB7hj8…` | `eVscHLcbhB7hj8…` | ✅ | `fTgcKE0a8HTbla…` | `fTgcKE0a8HTbla…` | ✅ | ❌ |
| 95 | 課税売上-返還等 5% 五種 | `ow+1ByHEPOOM/D…` | `ow+1ByHEPOOM/D…` | ✅ | `xPJESss7MvQXmJ…` | `xPJESss7MvQXmJ…` | ✅ | ❌ |
| 96 | 課税売上-返還等 5% 六種 | `CZ+g5Fw+SGoO7R…` | `CZ+g5Fw+SGoO7R…` | ✅ | `bqzMhT/eO2MJpy…` | `bqzMhT/eO2MJpy…` | ✅ | ❌ |
| 97 | 課税売上-返還等 5% 四種 | `xABMlKSLpyOgbC…` | `xABMlKSLpyOgbC…` | ✅ | `JeOXE80zLjqk1L…` | `JeOXE80zLjqk1L…` | ✅ | ❌ |
| 98 | 課税売上-返還等 8% | `GIjx8kEhXSSVtw…` | `GIjx8kEhXSSVtw…` | ✅ | `znUbuQT0fO5Vpi…` | `znUbuQT0fO5Vpi…` | ✅ | ❌ |
| 99 | 課税売上-返還等 8% 一種 | `pdFIb5Jy0G9Yhi…` | `pdFIb5Jy0G9Yhi…` | ✅ | `7ndB/rAZaELV0g…` | `7ndB/rAZaELV0g…` | ✅ | ❌ |
| 100 | 課税売上-返還等 8% 三種 | `ZkNOa0uzAl58sc…` | `ZkNOa0uzAl58sc…` | ✅ | `wUWFeYjqg7izC7…` | `wUWFeYjqg7izC7…` | ✅ | ❌ |
| 101 | 課税売上-返還等 8% 二種 | `Rqk+WUTuOyvfaU…` | `Rqk+WUTuOyvfaU…` | ✅ | `O2ijM34LX700fv…` | `O2ijM34LX700fv…` | ✅ | ❌ |
| 102 | 課税売上-返還等 8% 五種 | `8UyhZXge7kNTrI…` | `8UyhZXge7kNTrI…` | ✅ | `ClhNNdQ6w0MELw…` | `ClhNNdQ6w0MELw…` | ✅ | ❌ |
| 103 | 課税売上-返還等 8% 六種 | `00pe/Y92pKNKbl…` | `00pe/Y92pKNKbl…` | ✅ | `kgOfTgcMvavLyx…` | `kgOfTgcMvavLyx…` | ✅ | ❌ |
| 104 | 課税売上-返還等 8% 四種 | `vUpWea9gfBgr66…` | `vUpWea9gfBgr66…` | ✅ | `AiFWtHSIXTKyDX…` | `AiFWtHSIXTKyDX…` | ✅ | ❌ |
| 105 | 輸入仕入-地方消費税額 (軽)1.76% | `gFixS0nNTp08oK…` | `gFixS0nNTp08oK…` | ✅ | `qkV/gAoU0RhFOF…` | `qkV/gAoU0RhFOF…` | ✅ | ❌ |
| 106 | 輸入仕入-地方消費税額 1% | `x39V4n4nRrxDhS…` | `x39V4n4nRrxDhS…` | ✅ | `MtKxUoZagAm7jh…` | `MtKxUoZagAm7jh…` | ✅ | ❌ |
| 107 | 輸入仕入-地方消費税額 1.7% | `zfNwug7yQp62iz…` | `zfNwug7yQp62iz…` | ✅ | `rO268axovtfrYH…` | `rO268axovtfrYH…` | ✅ | ❌ |
| 108 | 輸入仕入-地方消費税額 2.2% | `Qgis5V+dgZTLoP…` | `Qgis5V+dgZTLoP…` | ✅ | `SRCfJ7dFPvcBYN…` | `SRCfJ7dFPvcBYN…` | ✅ | ❌ |
| 109 | 輸入仕入-本体 (軽)8% | `dTZpq7OBZihgt2…` | `dTZpq7OBZihgt2…` | ✅ | `DQWIIQDRH2AXMs…` | `DQWIIQDRH2AXMs…` | ✅ | ❌ |
| 110 | 輸入仕入-本体 10% | `1SOZsAojflN+3B…` | `1SOZsAojflN+3B…` | ✅ | `AgUb+D9z6eoTkd…` | `AgUb+D9z6eoTkd…` | ✅ | ❌ |
| 111 | 輸入仕入-本体 5% | `8EDTr652Z6em/A…` | `8EDTr652Z6em/A…` | ✅ | `vspVx6N3hWBo2d…` | `vspVx6N3hWBo2d…` | ✅ | ❌ |
| 112 | 輸入仕入-本体 8% | `nrtQO8t7O/sEk+…` | `nrtQO8t7O/sEk+…` | ✅ | `4EaSi/80BVJNrg…` | `4EaSi/80BVJNrg…` | ✅ | ❌ |
| 113 | 輸入仕入-消費税額 (軽)6.24% | `YuHXaGc8Bm89Lg…` | `YuHXaGc8Bm89Lg…` | ✅ | `KbNCiSOBkaMvt5…` | `KbNCiSOBkaMvt5…` | ✅ | ❌ |
| 114 | 輸入仕入-消費税額 4% | `cW3VZEo1MRNPBm…` | `cW3VZEo1MRNPBm…` | ✅ | `HCCr++OXdqdB42…` | `HCCr++OXdqdB42…` | ✅ | ❌ |
| 115 | 輸入仕入-消費税額 6.3% | `hZaVj2TYk/vTBW…` | `hZaVj2TYk/vTBW…` | ✅ | `aCqY0hTV2G1an6…` | `aCqY0hTV2G1an6…` | ✅ | ❌ |
| 116 | 輸入仕入-消費税額 7.8% | `yZuLUmYofD60zY…` | `yZuLUmYofD60zY…` | ✅ | `Vta+LOMHZbyIWz…` | `Vta+LOMHZbyIWz…` | ✅ | ❌ |
| 117 | 輸出売上 0% | `+9AO0FQgx1pDff…` | `+9AO0FQgx1pDff…` | ✅ | `tDDnfrlf3/hBx8…` | `tDDnfrlf3/hBx8…` | ✅ | ❌ |
| 118 | 輸出売上-貸倒 0% | `pbdihph4FOoVrt…` | `pbdihph4FOoVrt…` | ✅ | `GV7G1ZA+GKIsVq…` | `GV7G1ZA+GKIsVq…` | ✅ | ❌ |
| 119 | 輸出売上-返還等 0% | `fpsOBm9bFrxsvX…` | `fpsOBm9bFrxsvX…` | ✅ | `P+ZEyw5ZcWglBF…` | `P+ZEyw5ZcWglBF…` | ✅ | ❌ |
| 120 | 非課税仕入 | `WnMKDkjoiyejE1…` | `WnMKDkjoiyejE1…` | ✅ | `6KITIF3Pwee/JB…` | `6KITIF3Pwee/JB…` | ✅ | ❌ |
| 121 | 非課税売上 | `jq2EPFY/C61PkJ…` | `jq2EPFY/C61PkJ…` | ✅ | `TptCx9FhXKCzwe…` | `TptCx9FhXKCzwe…` | ✅ | ❌ |
| 122 | 非課税売上-有価証券譲渡 | `8gxPGTARnbBr2A…` | `8gxPGTARnbBr2A…` | ✅ | `gFgEB53q0iT6oc…` | `gFgEB53q0iT6oc…` | ✅ | ❌ |
| 123 | 非課税売上-貸倒 | `0/90SQi3vdxc73…` | `0/90SQi3vdxc73…` | ✅ | `hgjnsdrnEDHb7s…` | `hgjnsdrnEDHb7s…` | ✅ | ❌ |
| 124 | 非課税売上-返還等 | `WufDp0cw35hw3k…` | `WufDp0cw35hw3k…` | ✅ | `6CD8y6CaPb6VVi…` | `6CD8y6CaPb6VVi…` | ✅ | ❌ |
| 125 | 非課税対応仕入 (軽)8% | `RrWTy7rD33CfLs…` | `RrWTy7rD33CfLs…` | ✅ | `VMzhRUkqKQuCtW…` | `VMzhRUkqKQuCtW…` | ✅ | ❌ |
| 126 | 非課税対応仕入 10% | `oA9O2U5XbNlxVN…` | `oA9O2U5XbNlxVN…` | ✅ | `Rcrvc3JdyaZ4mg…` | `Rcrvc3JdyaZ4mg…` | ✅ | ❌ |
| 127 | 非課税対応仕入 5% | `ecZ54ittSOxnLN…` | `ecZ54ittSOxnLN…` | ✅ | `sCWIksk6f+6hnm…` | `sCWIksk6f+6hnm…` | ✅ | ❌ |
| 128 | 非課税対応仕入 8% | `WBAdW2tX1lcLRt…` | `WBAdW2tX1lcLRt…` | ✅ | `xAvXP7OLdqElGO…` | `xAvXP7OLdqElGO…` | ✅ | ❌ |
| 129 | 非課税対応仕入-返還等 (軽)8% | `zne4/J9u79HdwD…` | `zne4/J9u79HdwD…` | ✅ | `L2+ELS3NibdSMV…` | `L2+ELS3NibdSMV…` | ✅ | ❌ |
| 130 | 非課税対応仕入-返還等 10% | `UUp+mB85g8XCY+…` | `UUp+mB85g8XCY+…` | ✅ | `tdvhFjWNE1Gujl…` | `tdvhFjWNE1Gujl…` | ✅ | ❌ |
| 131 | 非課税対応仕入-返還等 5% | `axFBhJVYjnJEv1…` | `axFBhJVYjnJEv1…` | ✅ | `zfIgREGKzojjA2…` | `zfIgREGKzojjA2…` | ✅ | ❌ |
| 132 | 非課税対応仕入-返還等 8% | `SvX+Z8YAe2FUP/…` | `SvX+Z8YAe2FUP/…` | ✅ | `XULGDNg79Q2RcZ…` | `XULGDNg79Q2RcZ…` | ✅ | ❌ |
| 133 | 非課税対応特定課税仕入 10% | `82U9Hr1G8QRI+S…` | `82U9Hr1G8QRI+S…` | ✅ | `Gm2fr8zrXB+A+V…` | `Gm2fr8zrXB+A+V…` | ✅ | ❌ |
| 134 | 非課税対応特定課税仕入 8% | `3hsC1VmR3wEEvd…` | `3hsC1VmR3wEEvd…` | ✅ | `FaiyOzXn0vt9y0…` | `FaiyOzXn0vt9y0…` | ✅ | ❌ |
| 135 | 非課税対応特定課税仕入-返還等 10% | `E6UMRmMODlKIUG…` | `E6UMRmMODlKIUG…` | ✅ | `4+pGSNMTxZZkJS…` | `4+pGSNMTxZZkJS…` | ✅ | ❌ |
| 136 | 非課税対応特定課税仕入-返還等 8% | `qUnhgTxewvBCke…` | `qUnhgTxewvBCke…` | ✅ | `aDVsl+E7Sj5jEI…` | `aDVsl+E7Sj5jEI…` | ✅ | ❌ |
| 137 | 非課税対応輸入-地方消費税額 (軽)1.76% | `DvGdEBFzEy3EPA…` | `DvGdEBFzEy3EPA…` | ✅ | `0UF8GBW3MNK187…` | `0UF8GBW3MNK187…` | ✅ | ❌ |
| 138 | 非課税対応輸入-地方消費税額 1% | `iwm/c2cbApI5eO…` | `iwm/c2cbApI5eO…` | ✅ | `Iym3Dth4Y7i70W…` | `Iym3Dth4Y7i70W…` | ✅ | ❌ |
| 139 | 非課税対応輸入-地方消費税額 1.7% | `UCuxFCassyB82j…` | `UCuxFCassyB82j…` | ✅ | `vQzu/akX9u8uHG…` | `vQzu/akX9u8uHG…` | ✅ | ❌ |
| 140 | 非課税対応輸入-地方消費税額 2.2% | `fWBXzm4QRA8keb…` | `fWBXzm4QRA8keb…` | ✅ | `ejQQDX2b5xlOHt…` | `ejQQDX2b5xlOHt…` | ✅ | ❌ |
| 141 | 非課税対応輸入-本体 (軽)8% | `6GixQOPWwE1oqx…` | `6GixQOPWwE1oqx…` | ✅ | `zJWTAbO2SjIOb1…` | `zJWTAbO2SjIOb1…` | ✅ | ❌ |
| 142 | 非課税対応輸入-本体 10% | `u3rD2jRWCJnW7A…` | `u3rD2jRWCJnW7A…` | ✅ | `JQm5zpmMGsusbi…` | `JQm5zpmMGsusbi…` | ✅ | ❌ |
| 143 | 非課税対応輸入-本体 5% | `/iHOTz+WOUYyKd…` | `/iHOTz+WOUYyKd…` | ✅ | `bCevOQ7xty0XSg…` | `bCevOQ7xty0XSg…` | ✅ | ❌ |
| 144 | 非課税対応輸入-本体 8% | `Vs3Cv38zFjc7X/…` | `Vs3Cv38zFjc7X/…` | ✅ | `SIIn6VY6uzo0yl…` | `SIIn6VY6uzo0yl…` | ✅ | ❌ |
| 145 | 非課税対応輸入-消費税額 (軽)6.24% | `PAbMAguzRapxlT…` | `PAbMAguzRapxlT…` | ✅ | `NTAjDC0shEPbGp…` | `NTAjDC0shEPbGp…` | ✅ | ❌ |
| 146 | 非課税対応輸入-消費税額 4% | `t4S6xN5czBdZeq…` | `t4S6xN5czBdZeq…` | ✅ | `/Qxx0PvCQAgJWF…` | `/Qxx0PvCQAgJWF…` | ✅ | ❌ |
| 147 | 非課税対応輸入-消費税額 6.3% | `4uWkMlWNMNHri7…` | `4uWkMlWNMNHri7…` | ✅ | `y0kqCrA7uexTLb…` | `y0kqCrA7uexTLb…` | ✅ | ❌ |
| 148 | 非課税対応輸入-消費税額 7.8% | `kysRCRsXDmqRPQ…` | `kysRCRsXDmqRPQ…` | ✅ | `tOxNjJa3ZVeUuB…` | `tOxNjJa3ZVeUuB…` | ✅ | ❌ |
| 149 | 非課税資産輸出 | `l5M/8K/5Ru3/tA…` | `l5M/8K/5Ru3/tA…` | ✅ | `mBeIoEvkuAZQnM…` | `mBeIoEvkuAZQnM…` | ✅ | ❌ |
| 150 | 非課税資産輸出-貸倒 | `k+Y0O7MGzBMHcq…` | `k+Y0O7MGzBMHcq…` | ✅ | `/ciaQR/UwwGdq0…` | `/ciaQR/UwwGdq0…` | ✅ | ❌ |
| 151 | 非課税資産輸出-返還等 | `M8Yg42jxPA8xUN…` | `M8Yg42jxPA8xUN…` | ✅ | `SVQJhN0CQ1Q/lw…` | `SVQJhN0CQ1Q/lw…` | ✅ | ❌ |

**税区分集計:**
- TSK 1回目=2回目（安定）: 151/151件
- TST 1回目=2回目（安定）: 151/151件
- TSK=TST（事業者間一致）: 0/151件

---

## 2. 勘定科目（mfc_ca_getAccounts）

| # | 勘定科目名 | TSK 1回目 | TSK 2回目 | TSK安定 | TST 1回目 | TST 2回目 | TST安定 | TSK=TST |
|---|---|---|---|---|---|---|---|---|
| 1 | その他の経費(不動産) | `YkyPWLmjOuTxYL…` | `YkyPWLmjOuTxYL…` | ✅ | `—` | `—` | ✅ | — |
| 2 | その他の預金 | `uDi9RpSFwRjvln…` | `uDi9RpSFwRjvln…` | ✅ | `lFrtgLMQTVQjxO…` | `lFrtgLMQTVQjxO…` | ✅ | ❌ |
| 3 | その他有価証券評価差額金 | `—` | `—` | ✅ | `jeMtlk93a7XhIK…` | `jeMtlk93a7XhIK…` | ✅ | — |
| 4 | その他資本剰余金 | `—` | `—` | ✅ | `tBYuWzzSBrMQh0…` | `tBYuWzzSBrMQh0…` | ✅ | — |
| 5 | ソフトウェア | `—` | `—` | ✅ | `jSpBgzcAisUpvm…` | `jSpBgzcAisUpvm…` | ✅ | — |
| 6 | リース料 | `D1Nk7oRAegMfu/…` | `D1Nk7oRAegMfu/…` | ✅ | `UX3St53Ks7H1/g…` | `UX3St53Ks7H1/g…` | ✅ | ❌ |
| 7 | 一括償却資産 | `bzHl9dm1zWJJLU…` | `bzHl9dm1zWJJLU…` | ✅ | `2FUGD4a9H0bccE…` | `2FUGD4a9H0bccE…` | ✅ | ❌ |
| 8 | 事業主借 | `it0cAlfIiMDn2g…` | `it0cAlfIiMDn2g…` | ✅ | `—` | `—` | ✅ | — |
| 9 | 事業主貸 | `Qv9thznSix2CF2…` | `Qv9thznSix2CF2…` | ✅ | `—` | `—` | ✅ | — |
| 10 | 仕入値引・返品 | `Wd4TFmoxIFbpm7…` | `Wd4TFmoxIFbpm7…` | ✅ | `FV8lmOeAlmp0ev…` | `FV8lmOeAlmp0ev…` | ✅ | ❌ |
| 11 | 仕入割引 | `—` | `—` | ✅ | `WobTEB7urFjB2z…` | `WobTEB7urFjB2z…` | ✅ | — |
| 12 | 仕入高 | `G6ZOPmnMktCQMt…` | `G6ZOPmnMktCQMt…` | ✅ | `RKvezo9WTQXlxg…` | `RKvezo9WTQXlxg…` | ✅ | ❌ |
| 13 | 仕掛品 | `vjnVKjxuXF6/YJ…` | `vjnVKjxuXF6/YJ…` | ✅ | `kJgHSLuUCizMZp…` | `kJgHSLuUCizMZp…` | ✅ | ❌ |
| 14 | 他勘定振替高 | `—` | `—` | ✅ | `K4J2C1v7EDOoh4…` | `K4J2C1v7EDOoh4…` | ✅ | — |
| 15 | 仮受消費税 | `ulQsBG8iD/d7JF…` | `ulQsBG8iD/d7JF…` | ✅ | `NMLbnYXjkcCkTa…` | `NMLbnYXjkcCkTa…` | ✅ | ❌ |
| 16 | 仮受金 | `817/a1ABYam9ky…` | `817/a1ABYam9ky…` | ✅ | `56/iU/7H9t6iuD…` | `56/iU/7H9t6iuD…` | ✅ | ❌ |
| 17 | 仮払消費税 | `wZxuckNaS38pyR…` | `wZxuckNaS38pyR…` | ✅ | `CR7w9xche2O5gE…` | `CR7w9xche2O5gE…` | ✅ | ❌ |
| 18 | 仮払金 | `Vq7UUT8EgSgciF…` | `Vq7UUT8EgSgciF…` | ✅ | `PbWis3bGvugCfb…` | `PbWis3bGvugCfb…` | ✅ | ❌ |
| 19 | 会議費 | `j4naAKVJPKDkVd…` | `j4naAKVJPKDkVd…` | ✅ | `m9qbvcoq8mgck5…` | `m9qbvcoq8mgck5…` | ✅ | ❌ |
| 20 | 保証金・敷金 | `8GkDohsUmcqNlg…` | `8GkDohsUmcqNlg…` | ✅ | `vsEAZWlcJ2h+Um…` | `vsEAZWlcJ2h+Um…` | ✅ | ❌ |
| 21 | 保険料 | `—` | `—` | ✅ | `NpY+g3gNQEQHag…` | `NpY+g3gNQEQHag…` | ✅ | — |
| 22 | 修繕費 | `4H7F1iNY9BcRaN…` | `4H7F1iNY9BcRaN…` | ✅ | `YF2mJCu3rPnhMW…` | `YF2mJCu3rPnhMW…` | ✅ | ❌ |
| 23 | 修繕費(不動産) | `/5Fna0Yb0Tb+Cv…` | `/5Fna0Yb0Tb+Cv…` | ✅ | `—` | `—` | ✅ | — |
| 24 | 借入金 | `MXPlIlebtTYfq7…` | `MXPlIlebtTYfq7…` | ✅ | `—` | `—` | ✅ | — |
| 25 | 借入金利子(不動産) | `eo0EJIsuF8q2Ch…` | `eo0EJIsuF8q2Ch…` | ✅ | `—` | `—` | ✅ | — |
| 26 | 借地権 | `FbpnqG+9IMrXaw…` | `FbpnqG+9IMrXaw…` | ✅ | `WPbTdvIwgvjbDD…` | `WPbTdvIwgvjbDD…` | ✅ | ❌ |
| 27 | 備品・消耗品費 | `—` | `—` | ✅ | `vM5pe+rXepD5Kl…` | `vM5pe+rXepD5Kl…` | ✅ | — |
| 28 | 元入金 | `EkMA/kpc6caxov…` | `EkMA/kpc6caxov…` | ✅ | `—` | `—` | ✅ | — |
| 29 | 公共施設負担金 | `j2Nxyt0HHrzV86…` | `j2Nxyt0HHrzV86…` | ✅ | `UmIQqEmdIYumND…` | `UmIQqEmdIYumND…` | ✅ | ❌ |
| 30 | 出資金 | `—` | `—` | ✅ | `aJpn/rrE3zd84Z…` | `aJpn/rrE3zd84Z…` | ✅ | — |
| 31 | 別途積立金 | `—` | `—` | ✅ | `QwFpPLqZMJZ9/O…` | `QwFpPLqZMJZ9/O…` | ✅ | — |
| 32 | 利子割引料 | `FOaesS/LeVbc4o…` | `FOaesS/LeVbc4o…` | ✅ | `—` | `—` | ✅ | — |
| 33 | 利益準備金 | `—` | `—` | ✅ | `W0Vss5YXMPIHN0…` | `W0Vss5YXMPIHN0…` | ✅ | — |
| 34 | 前受金 | `BPmnzEPBFVeYUN…` | `BPmnzEPBFVeYUN…` | ✅ | `fmerhms75+GveD…` | `fmerhms75+GveD…` | ✅ | ❌ |
| 35 | 前払金 | `7Ik6QEjJ6TJ51q…` | `7Ik6QEjJ6TJ51q…` | ✅ | `vyOm6CpZUT6M0b…` | `vyOm6CpZUT6M0b…` | ✅ | ❌ |
| 36 | 前期損益修正損 | `—` | `—` | ✅ | `ea9GBVaMeLC+QM…` | `ea9GBVaMeLC+QM…` | ✅ | — |
| 37 | 前期損益修正益 | `—` | `—` | ✅ | `5fTIXxJBMvoCzd…` | `5fTIXxJBMvoCzd…` | ✅ | — |
| 38 | 創立費 | `—` | `—` | ✅ | `MwLZFAZIsdiRWk…` | `MwLZFAZIsdiRWk…` | ✅ | — |
| 39 | 受取利息 | `—` | `—` | ✅ | `XB5u3HZsrQXMXX…` | `XB5u3HZsrQXMXX…` | ✅ | — |
| 40 | 受取手形 | `QWTFLPwXgSqzue…` | `QWTFLPwXgSqzue…` | ✅ | `tNdB4c7Bzty/m1…` | `tNdB4c7Bzty/m1…` | ✅ | ❌ |
| 41 | 受取配当金 | `—` | `—` | ✅ | `0Phk4LGrsXU13K…` | `0Phk4LGrsXU13K…` | ✅ | — |
| 42 | 名義書換料その他(不動産) | `6UGt99RJtHlh0W…` | `6UGt99RJtHlh0W…` | ✅ | `—` | `—` | ✅ | — |
| 43 | 商品 | `Kpt9DoDhmjG8vB…` | `Kpt9DoDhmjG8vB…` | ✅ | `qVKitt87uckreW…` | `qVKitt87uckreW…` | ✅ | ❌ |
| 44 | 商品券 | `i1PS6kh+So05FQ…` | `i1PS6kh+So05FQ…` | ✅ | `iqHq+t3JT/PLeX…` | `iqHq+t3JT/PLeX…` | ✅ | ❌ |
| 45 | 固定資産売却損 | `—` | `—` | ✅ | `er2Ehv4IZ9QDZY…` | `er2Ehv4IZ9QDZY…` | ✅ | — |
| 46 | 固定資産売却益 | `—` | `—` | ✅ | `HD7tRQI136ZVPD…` | `HD7tRQI136ZVPD…` | ✅ | — |
| 47 | 土地 | `r1AyRJJ59bcFah…` | `r1AyRJJ59bcFah…` | ✅ | `4nqqwloX5/f/gZ…` | `4nqqwloX5/f/gZ…` | ✅ | ❌ |
| 48 | 土地再評価差額金 | `—` | `—` | ✅ | `s9nkemTKZ/ShaY…` | `s9nkemTKZ/ShaY…` | ✅ | — |
| 49 | 地代家賃 | `8itPb4zkfRKBA+…` | `8itPb4zkfRKBA+…` | ✅ | `6yOmis0Wny9Yto…` | `6yOmis0Wny9Yto…` | ✅ | ❌ |
| 50 | 地代家賃(不動産) | `gWGR89pBEQvu5+…` | `gWGR89pBEQvu5+…` | ✅ | `—` | `—` | ✅ | — |
| 51 | 売上値引・返品 | `j6z65FtmUAUs8y…` | `j6z65FtmUAUs8y…` | ✅ | `vSrT7jNXMbT5xP…` | `vSrT7jNXMbT5xP…` | ✅ | ❌ |
| 52 | 売上割引 | `—` | `—` | ✅ | `xb1t5RBTnzQ6xG…` | `xb1t5RBTnzQ6xG…` | ✅ | — |
| 53 | 売上高 | `ynFKKJuqbaJ2Zc…` | `ynFKKJuqbaJ2Zc…` | ✅ | `9s4iJBlxQDSsRP…` | `9s4iJBlxQDSsRP…` | ✅ | ❌ |
| 54 | 売掛金 | `r6p3Pr20qmLxqT…` | `r6p3Pr20qmLxqT…` | ✅ | `EqbxzDapWwga+Y…` | `EqbxzDapWwga+Y…` | ✅ | ❌ |
| 55 | 外注工賃 | `/bo1oPWN9uBOhJ…` | `/bo1oPWN9uBOhJ…` | ✅ | `—` | `—` | ✅ | — |
| 56 | 外注管理費(不動産) | `LhMwPZABr5j+Lp…` | `LhMwPZABr5j+Lp…` | ✅ | `—` | `—` | ✅ | — |
| 57 | 定期預金 | `ay5klw8sfjdRU/…` | `ay5klw8sfjdRU/…` | ✅ | `RDTNW9WNw4sKEm…` | `RDTNW9WNw4sKEm…` | ✅ | ❌ |
| 58 | 家事消費等 | `jPibV2REqnyje3…` | `jPibV2REqnyje3…` | ✅ | `—` | `—` | ✅ | — |
| 59 | 寄付金 | `—` | `—` | ✅ | `mMUzzNOO+fkXS/…` | `mMUzzNOO+fkXS/…` | ✅ | — |
| 60 | 専従者給与 | `q/lHoqyFokk235…` | `q/lHoqyFokk235…` | ✅ | `—` | `—` | ✅ | — |
| 61 | 専従者給与(不動産) | `a9ujcy4SgRYU6I…` | `a9ujcy4SgRYU6I…` | ✅ | `—` | `—` | ✅ | — |
| 62 | 工具器具備品 | `NDdfvwDyfJuXsZ…` | `NDdfvwDyfJuXsZ…` | ✅ | `eeVUM4+OUok2iV…` | `eeVUM4+OUok2iV…` | ✅ | ❌ |
| 63 | 差入保証金 | `qiKNejX63DO2WC…` | `qiKNejX63DO2WC…` | ✅ | `O0o5TxlxVTNfcv…` | `O0o5TxlxVTNfcv…` | ✅ | ❌ |
| 64 | 広告宣伝費 | `5RTWVwzwjUSzzJ…` | `5RTWVwzwjUSzzJ…` | ✅ | `BUQCH0XQUXUwmE…` | `BUQCH0XQUXUwmE…` | ✅ | ❌ |
| 65 | 建物 | `jRsGqYS/xo+IP4…` | `jRsGqYS/xo+IP4…` | ✅ | `UxUN56QwF28E4b…` | `UxUN56QwF28E4b…` | ✅ | ❌ |
| 66 | 当座預金 | `M71UKfugevtELg…` | `M71UKfugevtELg…` | ✅ | `vGdJr0PEojDc2c…` | `vGdJr0PEojDc2c…` | ✅ | ❌ |
| 67 | 役員報酬 | `—` | `—` | ✅ | `P+GCgbncF3b1ih…` | `P+GCgbncF3b1ih…` | ✅ | — |
| 68 | 投資有価証券 | `—` | `—` | ✅ | `iCOV/7T02M6a/9…` | `iCOV/7T02M6a/9…` | ✅ | — |
| 69 | 投資有価証券売却損 | `—` | `—` | ✅ | `RH8R9GPnrHtyLy…` | `RH8R9GPnrHtyLy…` | ✅ | — |
| 70 | 投資有価証券売却益 | `—` | `—` | ✅ | `5YEfxz4tqKhzH+…` | `5YEfxz4tqKhzH+…` | ✅ | — |
| 71 | 接待交際費 | `6VgFFtysu6VEwj…` | `6VgFFtysu6VEwj…` | ✅ | `gvp/ed2SjTZPtd…` | `gvp/ed2SjTZPtd…` | ✅ | ❌ |
| 72 | 損害保険料 | `g5qOawpCj+7SGp…` | `g5qOawpCj+7SGp…` | ✅ | `—` | `—` | ✅ | — |
| 73 | 損害保険料(不動産) | `5Qs/5piL9Vppj0…` | `5Qs/5piL9Vppj0…` | ✅ | `—` | `—` | ✅ | — |
| 74 | 支払利息 | `—` | `—` | ✅ | `UC2KUr1FxLimLe…` | `UC2KUr1FxLimLe…` | ✅ | — |
| 75 | 支払報酬 | `—` | `—` | ✅ | `Twsz4vQHnm3RkX…` | `Twsz4vQHnm3RkX…` | ✅ | — |
| 76 | 支払手形 | `B63zFsqYDfQkW6…` | `B63zFsqYDfQkW6…` | ✅ | `/y/s00LpXEUTmc…` | `/y/s00LpXEUTmc…` | ✅ | ❌ |
| 77 | 支払手数料 | `vDJfzZM9JIXt0P…` | `vDJfzZM9JIXt0P…` | ✅ | `igzi7ONBYoz4cI…` | `igzi7ONBYoz4cI…` | ✅ | ❌ |
| 78 | 敷金 | `6mxdNVnnZg19La…` | `6mxdNVnnZg19La…` | ✅ | `tboQvgYSouaBH6…` | `tboQvgYSouaBH6…` | ✅ | ❌ |
| 79 | 新株予約権 | `—` | `—` | ✅ | `ZoCj2ZsURVl9dt…` | `ZoCj2ZsURVl9dt…` | ✅ | — |
| 80 | 新株式申込証拠金 | `—` | `—` | ✅ | `ZgDVuv/n1oYMRY…` | `ZgDVuv/n1oYMRY…` | ✅ | — |
| 81 | 新聞図書費 | `2QWJzeRaXyWeQ/…` | `2QWJzeRaXyWeQ/…` | ✅ | `xK1S7ITa7RIPHN…` | `xK1S7ITa7RIPHN…` | ✅ | ❌ |
| 82 | 新聞図書費(不動産) | `4MbnlgKVyz1kwM…` | `4MbnlgKVyz1kwM…` | ✅ | `—` | `—` | ✅ | — |
| 83 | 旅費交通費 | `i5scAa45KzfUoT…` | `i5scAa45KzfUoT…` | ✅ | `PGapbiStol5s1z…` | `PGapbiStol5s1z…` | ✅ | ❌ |
| 84 | 旅費交通費(不動産) | `nRyau08b1krljb…` | `nRyau08b1krljb…` | ✅ | `—` | `—` | ✅ | — |
| 85 | 普通預金 | `ourOMLt6KwKtHu…` | `ourOMLt6KwKtHu…` | ✅ | `n6RJe3o4pBenP9…` | `n6RJe3o4pBenP9…` | ✅ | ❌ |
| 86 | 有価証券 | `AHbJVWY72haOs3…` | `AHbJVWY72haOs3…` | ✅ | `f6J3wc2bZ2lVgf…` | `f6J3wc2bZ2lVgf…` | ✅ | ❌ |
| 87 | 有価証券売却損 | `—` | `—` | ✅ | `62MwcHDmni6GpE…` | `62MwcHDmni6GpE…` | ✅ | — |
| 88 | 有価証券売却益 | `—` | `—` | ✅ | `ouslP3Y/ok+l92…` | `ouslP3Y/ok+l92…` | ✅ | — |
| 89 | 期末商品棚卸高 | `Y0Gikeo7WwuE1J…` | `Y0Gikeo7WwuE1J…` | ✅ | `7DTv3eXViRFuCc…` | `7DTv3eXViRFuCc…` | ✅ | ❌ |
| 90 | 期首商品棚卸高 | `iEVVvN9J/K/D8D…` | `iEVVvN9J/K/D8D…` | ✅ | `Xb/7nrG1qZF0AH…` | `Xb/7nrG1qZF0AH…` | ✅ | ❌ |
| 91 | 未収入金 | `—` | `—` | ✅ | `9gcTMwlfDdJFI1…` | `9gcTMwlfDdJFI1…` | ✅ | — |
| 92 | 未収賃貸料 | `SdInJC1fYIZuS2…` | `SdInJC1fYIZuS2…` | ✅ | `TixSqn7jb+RtLp…` | `TixSqn7jb+RtLp…` | ✅ | ❌ |
| 93 | 未収金 | `UWcsU2zOrJJgQN…` | `UWcsU2zOrJJgQN…` | ✅ | `—` | `—` | ✅ | — |
| 94 | 未払法人税等 | `—` | `—` | ✅ | `vWT3JirN2KOEC6…` | `vWT3JirN2KOEC6…` | ✅ | — |
| 95 | 未払消費税 | `pr5Ci3Fo38aqNP…` | `pr5Ci3Fo38aqNP…` | ✅ | `73tMsgA3/nkEH3…` | `73tMsgA3/nkEH3…` | ✅ | ❌ |
| 96 | 未払費用 | `—` | `—` | ✅ | `5ZXbfD+92EWniW…` | `5ZXbfD+92EWniW…` | ✅ | — |
| 97 | 未払金 | `qKTHD0HjLFr794…` | `qKTHD0HjLFr794…` | ✅ | `BAqe37QohiGZoY…` | `BAqe37QohiGZoY…` | ✅ | ❌ |
| 98 | 未確定勘定 | `DgSOJdGRgnCFBe…` | `DgSOJdGRgnCFBe…` | ✅ | `FrfjUq9zdcSxcl…` | `FrfjUq9zdcSxcl…` | ✅ | ❌ |
| 99 | 材料 | `X00p8T2oO0AeTT…` | `X00p8T2oO0AeTT…` | ✅ | `JiQrSwlSM0rzEy…` | `JiQrSwlSM0rzEy…` | ✅ | ❌ |
| 100 | 業務委託料 | `—` | `—` | ✅ | `1zb/uVP3iEy32B…` | `1zb/uVP3iEy32B…` | ✅ | — |
| 101 | 構築物 | `iMt7Y1dLYMOIFu…` | `iMt7Y1dLYMOIFu…` | ✅ | `ATmwuURk9B7y1D…` | `ATmwuURk9B7y1D…` | ✅ | ❌ |
| 102 | 機械装置 | `vpBU3bUYfArEuP…` | `vpBU3bUYfArEuP…` | ✅ | `cvfsGucoYb4r2L…` | `cvfsGucoYb4r2L…` | ✅ | ❌ |
| 103 | 水道光熱費 | `3da0j9yt+DlF/Z…` | `3da0j9yt+DlF/Z…` | ✅ | `pnhBY3WffXP1wt…` | `pnhBY3WffXP1wt…` | ✅ | ❌ |
| 104 | 法人税等 | `—` | `—` | ✅ | `pQ5SaeIaiF41bv…` | `pQ5SaeIaiF41bv…` | ✅ | — |
| 105 | 法人税等調整額 | `—` | `—` | ✅ | `KGbvrhWjMGxvkP…` | `KGbvrhWjMGxvkP…` | ✅ | — |
| 106 | 法定福利費 | `eJAhQlpWdUvVvQ…` | `eJAhQlpWdUvVvQ…` | ✅ | `Q9MaJ7qnTmUoTa…` | `Q9MaJ7qnTmUoTa…` | ✅ | ❌ |
| 107 | 消耗品費 | `RzBJyPxdC9852K…` | `RzBJyPxdC9852K…` | ✅ | `—` | `—` | ✅ | — |
| 108 | 減価償却累計額 | `5VevIInRXqWMMg…` | `5VevIInRXqWMMg…` | ✅ | `yGkdJdIxp3/vY2…` | `yGkdJdIxp3/vY2…` | ✅ | ❌ |
| 109 | 減価償却費 | `15cUWwUjcUGCvl…` | `15cUWwUjcUGCvl…` | ✅ | `4oDEebc+BmFK2O…` | `4oDEebc+BmFK2O…` | ✅ | ❌ |
| 110 | 減価償却費(不動産) | `XFyWigwetjgDVN…` | `XFyWigwetjgDVN…` | ✅ | `—` | `—` | ✅ | — |
| 111 | 現金 | `cqFKUwCs6dvrA8…` | `cqFKUwCs6dvrA8…` | ✅ | `kITjdy4vJnovQ1…` | `kITjdy4vJnovQ1…` | ✅ | ❌ |
| 112 | 短期借入金 | `—` | `—` | ✅ | `B/kI+I/O4ISQ0b…` | `B/kI+I/O4ISQ0b…` | ✅ | — |
| 113 | 短期貸付金 | `—` | `—` | ✅ | `jpR/jl0y4Y+ieS…` | `jpR/jl0y4Y+ieS…` | ✅ | — |
| 114 | 研修採用費 | `F7swJwDCtLDNoK…` | `F7swJwDCtLDNoK…` | ✅ | `IhptVvu+B+oDze…` | `IhptVvu+B+oDze…` | ✅ | ❌ |
| 115 | 礼金・権利金更新料(不動産) | `JGc/3cecWUggGQ…` | `JGc/3cecWUggGQ…` | ✅ | `—` | `—` | ✅ | — |
| 116 | 福利厚生費 | `YEORHEYUd61Clb…` | `YEORHEYUd61Clb…` | ✅ | `x7dAxd8IfR/Uui…` | `x7dAxd8IfR/Uui…` | ✅ | ❌ |
| 117 | 租税公課 | `O0Q0fpmerdcods…` | `O0Q0fpmerdcods…` | ✅ | `EupQ0xnEcZm2l/…` | `EupQ0xnEcZm2l/…` | ✅ | ❌ |
| 118 | 租税公課(不動産) | `kkzWMMbzxLebPO…` | `kkzWMMbzxLebPO…` | ✅ | `—` | `—` | ✅ | — |
| 119 | 立替金 | `xgE6vKiAnbAEq7…` | `xgE6vKiAnbAEq7…` | ✅ | `lm2tCpfo7l2efL…` | `lm2tCpfo7l2efL…` | ✅ | ❌ |
| 120 | 給料賃金 | `35nk35ihTJLWL0…` | `35nk35ihTJLWL0…` | ✅ | `8nCO1W8w47LgEy…` | `8nCO1W8w47LgEy…` | ✅ | ❌ |
| 121 | 給料賃金(不動産) | `5+l/0PA/6mvHtp…` | `5+l/0PA/6mvHtp…` | ✅ | `—` | `—` | ✅ | — |
| 122 | 繰延税金負債(固) | `—` | `—` | ✅ | `hMDj8e8TndQc9M…` | `hMDj8e8TndQc9M…` | ✅ | — |
| 123 | 繰延税金負債(流) | `—` | `—` | ✅ | `aJPgf9JT9qxIk9…` | `aJPgf9JT9qxIk9…` | ✅ | — |
| 124 | 繰延税金資産(固) | `—` | `—` | ✅ | `gIsk73v+hFL0wO…` | `gIsk73v+hFL0wO…` | ✅ | — |
| 125 | 繰延税金資産(流) | `—` | `—` | ✅ | `cm5syCM574YWGn…` | `cm5syCM574YWGn…` | ✅ | — |
| 126 | 繰延資産償却 | `xSC3PdJYxZkhX4…` | `xSC3PdJYxZkhX4…` | ✅ | `apw96CU7uhZs+p…` | `apw96CU7uhZs+p…` | ✅ | ❌ |
| 127 | 繰越利益剰余金 | `—` | `—` | ✅ | `TwkcmGGT1E9VVQ…` | `TwkcmGGT1E9VVQ…` | ✅ | — |
| 128 | 自己株式 | `—` | `—` | ✅ | `d+PCeOOs3j9mQ/…` | `d+PCeOOs3j9mQ/…` | ✅ | — |
| 129 | 自己株式申込証拠金 | `—` | `—` | ✅ | `utf41ZNyqyhKDD…` | `utf41ZNyqyhKDD…` | ✅ | — |
| 130 | 船舶 | `nn9vfFubbULBlM…` | `nn9vfFubbULBlM…` | ✅ | `Ofr4EpudYuJ89O…` | `Ofr4EpudYuJ89O…` | ✅ | ❌ |
| 131 | 荷造運賃 | `BHwZkfAYlFbr6H…` | `BHwZkfAYlFbr6H…` | ✅ | `1cOl5BsVxpKG3p…` | `1cOl5BsVxpKG3p…` | ✅ | ❌ |
| 132 | 製品 | `D3ZkuQUdNfZre7…` | `D3ZkuQUdNfZre7…` | ✅ | `q7+RSsWKPrsgyN…` | `q7+RSsWKPrsgyN…` | ✅ | ❌ |
| 133 | 貯蔵品 | `av44u3kpUVQ1L3…` | `av44u3kpUVQ1L3…` | ✅ | `p3X4yFNbLs5Vnh…` | `p3X4yFNbLs5Vnh…` | ✅ | ❌ |
| 134 | 買掛金 | `Jqk7ZeSnGz05F2…` | `Jqk7ZeSnGz05F2…` | ✅ | `0qGNetp3z4P2g/…` | `0qGNetp3z4P2g/…` | ✅ | ❌ |
| 135 | 貸付金 | `zObel3eikmjjWD…` | `zObel3eikmjjWD…` | ✅ | `—` | `—` | ✅ | — |
| 136 | 貸倒引当金 | `znRiojC8+Bel+b…` | `znRiojC8+Bel+b…` | ✅ | `rFs6C/OXmD3RkM…` | `rFs6C/OXmD3RkM…` | ✅ | ❌ |
| 137 | 貸倒引当金戻入 | `odjGNB/zjJgE/J…` | `odjGNB/zjJgE/J…` | ✅ | `—` | `—` | ✅ | — |
| 138 | 貸倒引当金戻入額 | `—` | `—` | ✅ | `IXzc0IsfPwi+0B…` | `IXzc0IsfPwi+0B…` | ✅ | — |
| 139 | 貸倒引当金繰入 | `EHCdZZQAIvBh+w…` | `EHCdZZQAIvBh+w…` | ✅ | `—` | `—` | ✅ | — |
| 140 | 貸倒引当金繰入額 | `—` | `—` | ✅ | `osSkdvubJddEwb…` | `osSkdvubJddEwb…` | ✅ | — |
| 141 | 貸倒損失 | `—` | `—` | ✅ | `Xd8MuxoHJ2H2U1…` | `Xd8MuxoHJ2H2U1…` | ✅ | — |
| 142 | 貸倒金(損失) | `ZRbphXBPwUXESQ…` | `ZRbphXBPwUXESQ…` | ✅ | `—` | `—` | ✅ | — |
| 143 | 賃貸料(不動産) | `kcgv5C+Pmb4EOi…` | `kcgv5C+Pmb4EOi…` | ✅ | `—` | `—` | ✅ | — |
| 144 | 資本準備金 | `—` | `—` | ✅ | `Ui3mw2prtblW4e…` | `Ui3mw2prtblW4e…` | ✅ | — |
| 145 | 資本金 | `—` | `—` | ✅ | `NHt3ML+5slP35U…` | `NHt3ML+5slP35U…` | ✅ | — |
| 146 | 資産譲渡損 | `r3ndi4kZa28dsu…` | `r3ndi4kZa28dsu…` | ✅ | `—` | `—` | ✅ | — |
| 147 | 賞与 | `—` | `—` | ✅ | `zAhaTm9P2Y//JO…` | `zAhaTm9P2Y//JO…` | ✅ | — |
| 148 | 車両費 | `bwDPD3WUrpwmum…` | `bwDPD3WUrpwmum…` | ✅ | `vS2y/BLvmyVOzG…` | `vS2y/BLvmyVOzG…` | ✅ | ❌ |
| 149 | 車両運搬具 | `XVZq/OOSNI20oT…` | `XVZq/OOSNI20oT…` | ✅ | `QGV973h+vKq5MZ…` | `QGV973h+vKq5MZ…` | ✅ | ❌ |
| 150 | 退職給与 | `MKo+SJWYrvoZjW…` | `MKo+SJWYrvoZjW…` | ✅ | `d+pOVykZQC1Tfj…` | `d+pOVykZQC1Tfj…` | ✅ | ❌ |
| 151 | 通信費 | `YPheBswUz0KycE…` | `YPheBswUz0KycE…` | ✅ | `WYN2PJ+krs80v7…` | `WYN2PJ+krs80v7…` | ✅ | ❌ |
| 152 | 長期借入金 | `hKMM/xyrC00uR5…` | `hKMM/xyrC00uR5…` | ✅ | `Ev3MpwkZYgYaGu…` | `Ev3MpwkZYgYaGu…` | ✅ | ❌ |
| 153 | 長期前払費用 | `—` | `—` | ✅ | `l/WsUUJ5RI7Nap…` | `l/WsUUJ5RI7Nap…` | ✅ | — |
| 154 | 長期貸付金 | `—` | `—` | ✅ | `WAl60Pv1sSxoOF…` | `WAl60Pv1sSxoOF…` | ✅ | — |
| 155 | 開業費 | `Y8pz99cx4g1ksm…` | `Y8pz99cx4g1ksm…` | ✅ | `RwYYq933/MwMkU…` | `RwYYq933/MwMkU…` | ✅ | ❌ |
| 156 | 附属設備 | `bayc0vFdNm39ja…` | `bayc0vFdNm39ja…` | ✅ | `pqdVUGTNzpBWNU…` | `pqdVUGTNzpBWNU…` | ✅ | ❌ |
| 157 | 雑収入 | `tuNgu9vgrqrUUC…` | `tuNgu9vgrqrUUC…` | ✅ | `qFW7Cuo6xvZXCI…` | `qFW7Cuo6xvZXCI…` | ✅ | ❌ |
| 158 | 雑損失 | `—` | `—` | ✅ | `uVBuqwh6VhXk+f…` | `uVBuqwh6VhXk+f…` | ✅ | — |
| 159 | 雑給 | `—` | `—` | ✅ | `p+115HPWqGRr5O…` | `p+115HPWqGRr5O…` | ✅ | — |
| 160 | 雑費 | `OVAaRJQjfykWzb…` | `OVAaRJQjfykWzb…` | ✅ | `fxbzM5GJBTg/uD…` | `fxbzM5GJBTg/uD…` | ✅ | ❌ |
| 161 | 電話加入権 | `amDq0TIIVlfbrJ…` | `amDq0TIIVlfbrJ…` | ✅ | `hp67VjcFwL6+VT…` | `hp67VjcFwL6+VT…` | ✅ | ❌ |
| 162 | 預り保証金 | `—` | `—` | ✅ | `og+DeEhNmA7GrA…` | `og+DeEhNmA7GrA…` | ✅ | — |
| 163 | 預り金 | `JJl/M2aNpPp8dj…` | `JJl/M2aNpPp8dj…` | ✅ | `4ekjmvZlpDdQnx…` | `4ekjmvZlpDdQnx…` | ✅ | ❌ |
| 164 | 預託金 | `Q3EMbo4bhyTFYR…` | `Q3EMbo4bhyTFYR…` | ✅ | `wXaATs7dPr7HZk…` | `wXaATs7dPr7HZk…` | ✅ | ❌ |

**勘定科目集計:**
- TSK 1回目=2回目（安定）: 108/164件
- TST 1回目=2回目（安定）: 133/164件
- TSK=TST（事業者間一致）: 0/164件

---

## 3. 結論

| 項目 | 同一事業者安定性 | 事業者間一致 | ID照合可否 |
|---|---|---|---|
| **税区分** | TSK: 151/151, TST: 151/151 | 0/151 | ❌ ID照合不可（名前照合のみ） |
| **勘定科目** | TSK: 108/164, TST: 133/164 | 0/164 | ❌ ID照合不可（名前照合のみ） |

---

## 4. 追加検証: MCP仕訳送信49パターンテスト

上記の「IDは事業者固有」という結論を受け、「事業者固有のIDなしで仕訳を送れるか？」を49パターンで実機検証した。

### 経緯

1. 本ドキュメントで「全事業者間でID不一致」が判明
2. 「ならば名前で送れるか？IDなしで送れるか？他社IDは使えるか？」という疑問が発生
3. 勘定科目（account_id）× 税区分（tax_id）の7パターン × 7パターン = 49通りを全件テスト

### 結果要約

| 項目 | 正規ID | 名前 | 省略 | 空文字 | null | デタラメ | 他社ID |
|---|---|---|---|---|---|---|---|
| **勘定科目** account_id | ✅ 唯一の方法 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **税区分** tax_id | ✅ | ❌ | ✅ MFが自動適用 | ✅ 省略と同じ | ❌ | ❌ | ❌ |

- 成功: 3パターン / 49パターン
- **勘定科目は正規IDが必須**（代替手段なし）
- **税区分は省略可能**（MFがデフォルト適用）だが、指定するなら正規IDのみ
- **他社IDはデタラメIDと同じ扱いで拒否** → 事業者間のID互換性はない

詳細: `docs/genzai/46_mf_journal_send_49patterns.md`

### 最終結論

> [!IMPORTANT]
> **MF IDは全て事業者（テナント）固有。税区分も勘定科目も例外なし。**
> - 事業者間の照合は**名前のみ**
> - MCP仕訳送信にはその事業者のMF IDが**必須**（勘定科目は絶対、税区分は任意）
> - ~~個別顧問先ごとにMF IDを保存する設計が**必須**~~ → **削除済み（2026-06-04）**。mfMappingServiceがMCPからリアルタイムに取得し名前照合で解決する。保存されたmfIdは読み取り箇所ゼロだった
> - 全社マスタにMF IDを保持する意味は**一切ない** → 削除済み（コミット654fe11）

---

## 5. 追加検証（2026-06-01 24:00）

### 検証3: 補助科目（sub_account_id）の事業者固有性

| 項目 | TSK | TST | 結果 |
|---|---|---|---|
| 補助科目件数 | 16件 | 9件 | — |
| 同名の補助科目 | 9件（社会保険料, 雇用保険等） | 9件 | **全件不一致（一致=0）** |

**結論: 補助科目IDも事業者固有。**

### 検証1: 勘定科目のデフォルト税区分

`getAccounts`レスポンスの各勘定科目に`tax_id`（デフォルト税区分ID）が含まれている。
仕訳送信時に`tax_id`を省略すると、この勘定科目のデフォルト税区分が自動適用される。

| 勘定科目 | デフォルト税区分 |
|---|---|
| 現金 | 対象外 |
| 売上高 | 課税売上 10% |

**全科目のデフォルト分布（TSK）:**

| デフォルト税区分 | 科目数 |
|---|---|
| 対象外 | 56件 |
| 課税仕入 10% | 37件 |
| 課税売上 10% | 6件 |
| 対象外仕入 | 4件 |
| 非課税仕入 | 2件 |
| その他 | 3件 |

### 検証4: 部門（department_id）の事業者固有性

TSK/TSTともに部門**0件**。テストデータなし。判定不能。

### 検証2: MFで科目名変更時にIDが変わるか

**未実施。** MF管理画面での操作が必要。