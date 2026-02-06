# TX NRE 系統 — Bug 修復評估報告

**日期**: 2026-02-06
**評估人**: 外部工程師（非原始開發者）
**系統概述**: NRE (Non-Recurring Engineering) 成本管理系統
**技術架構**: Angular 16 + Django 5.2 + PostgreSQL

---

## 一、專案基本資訊

| 項目 | 說明 |
|------|------|
| 前端框架 | Angular 16 + Tailwind CSS + Angular Material |
| 後端框架 | Django 5.2 + Django REST Framework |
| 資料庫 | PostgreSQL |
| 部署方式 | Docker Compose (3 containers) |
| 程式碼規模 | ~350 個原始檔案，~25,000 行程式碼 |
| 核心檔案行數 | 前端主元件 1,319 行 + 模板 654 行；後端 API 599 行 |
| 原始開發費用 | ~80,000 TWD |
| 系統年齡 | ~4 年 |

---

## 二、問題摘要與根因分析

### 問題 1：新專案建立失敗（A31 失敗、A26 成功）

**嚴重度**: 🔴 高

**症狀**: 選擇 A31 按 Done 會失敗，專案無法開啟；選 A26 可正常建立。

**根因分析**:

| # | 問題位置 | 說明 |
|---|----------|------|
| 1-1 | 後端 `views.py:199-200` | `TestItem.objects.update_or_create()` 的 lookup key 只用 `function` + `item`，但 Model 的 `unique_together` 約束是 `(function, item, lab_location)` 三欄位。當 A31 的客戶設定中，同一 function+item 有多個 lab_location 時，觸發 `IntegrityError` |
| 1-2 | 後端 `views.py:277` | `records_data` 若因前面錯誤導致為 None，迭代時直接 crash (TypeError) |
| 1-3 | 後端 `views.py` 全域 | 缺乏 try-except 錯誤處理，constraint violation 直接返回 500 |

**A26 能成功的原因**: A26 的客戶設定中，每個 function+item 組合只有單一 lab_location，不會觸發 unique constraint 衝突。

**修復方向**:
- 將 `lab_location` 加入 `update_or_create` 的 lookup fields
- 加入 IntegrityError 錯誤處理
- 後端回傳有意義的錯誤訊息

**預估修復工時**: 2-3 小時

---

### 問題 2：User Input → Equipment 資料未帶入

**嚴重度**: 🔴 高

**症狀**: Equipment 頁籤顯示空白，無設備時數與 chamber 資料。

**根因分析**:

| # | 問題位置 | 說明 |
|---|----------|------|
| 2-1 | 前端 `nre-detail.component.ts:255-307` | `manageData()` 載入資料後**沒有呼叫 `calculate()`**，所有 Equipment 的計算欄位（equip_hrs、chambers、current_fee、sub_total）全部是 null |
| 2-2 | 前端 `nre-detail.component.ts:309-312` | `onSelectedTabChange()` 呼叫 `calculate()` 後**缺少 `markForCheck()`**，在 OnPush 變更偵測策略下，UI 不會更新 |
| 2-3 | 前端 `nre-detail.component.ts:601` | `selectChambers()` 沒有對 `chambers` 資料做 null check，若 chambers 尚未載入會 crash |
| 2-4 | 前端 `nre-detail.component.ts:124-142` | 非同步資料載入存在 race condition — `search()` 可能在 chambers 載入完成前就執行 |

**修復方向**:
- 在 `manageData()` 結尾加入 `this.calculate()` 呼叫
- 在 `onSelectedTabChange()` 的 `calculate()` 後加入 `this._changeDetectorRef.markForCheck()`
- `selectChambers()` 加入 null/undefined 防護
- 確保 chambers 資料載入完成後再觸發計算

**預估修復工時**: 2-3 小時

---

### 問題 3：User Input 無法儲存 / 下載失敗

**嚴重度**: 🔴 高

**症狀**:
- Save 按下去無反應或無法儲存
- Download 跳出錯誤訊息

**根因分析（儲存）**:

| # | 問題位置 | 說明 |
|---|----------|------|
| 3-1 | 前端 `nre-detail.component.ts:215-217` | `parseFloat(null)` 產生 `NaN`，`.toFixed(2)` 後送出無效的數值到後端，導致序列化失敗 |
| 3-2 | 前端 `nre-detail.component.ts:228-230` | PL Duration / Duty Rate 為 null 時，`null / 5 * null` = `NaN`，後端驗證失敗 |
| 3-3 | 前端 `nre-detail.component.ts:219-226` | `item.record` 或 `item.id` 若為 undefined，推入 records 時會 crash |
| 3-4 | 後端 `views.py:277` | `records_data` 為 None 時迭代 crash (TypeError) |

**根因分析（下載）**:

| # | 問題位置 | 說明 |
|---|----------|------|
| 3-5 | 前端 `nre-detail.component.ts:601` | `calculate()` 內 `selectChambers()` 存取 null chambers 導致 TypeError |
| 3-6 | 前端 `nre-detail.component.ts:764-768` | Excel 匯出時 duration/duty_rate 為 null，算出 NaN，Excel 顯示 `#VALUE!` |
| 3-7 | 前端 `nre-detail.component.ts:1158-1162` | `writeBuffer()` Promise 沒有 `.catch()` 處理，失敗時無錯誤回饋 |
| 3-8 | 前端 Excel 匯出邏輯 | `item.item_name`、`item.lab_location` 可能為 null/undefined，導致 Excel 欄位錯位 |

**修復方向**:
- 所有 `parseFloat()` 加入 null 防護 (`parseFloat(value) || 0`)
- PL 小時計算加入預設值
- records 建構時加入完整性驗證
- 後端 `records_data` 加入 None check
- Excel 匯出加入 `.catch()` 錯誤處理與 null 防護
- 所有數值欄位給予合理預設值

**預估修復工時**: 3-4 小時

---

## 三、工時與費用評估

### 工時明細

| 工作項目 | 預估工時 | 說明 |
|----------|----------|------|
| 環境建置與理解程式碼 | 4-6 hr | 非原始開發者需閱讀理解 Angular + Django 全端架構、商業邏輯、資料流。這是最耗時的部分 |
| 問題 1 修復 | 2-3 hr | 後端 `update_or_create` 修正 + 錯誤處理 |
| 問題 2 修復 | 2-3 hr | 前端計算流程修正 + 變更偵測修正 + race condition |
| 問題 3 修復 | 3-4 hr | 前後端 null 防護 + Excel 匯出修正（影響範圍最廣） |
| 測試與驗證 | 2-3 hr | 建立 Docker 環境、測試 A31/A26 建專案、測試各 tab 資料帶入、測試儲存/下載 |
| 溝通與文件 | 1-2 hr | 與客戶確認問題細節、交付說明 |
| **合計** | **14-21 hr** | |

### 費用分析

| 估價方式 | 金額 (TWD) | 說明 |
|----------|------------|------|
| 以時薪 800 計算（中階） | 11,200 ~ 16,800 | 台灣接案工程師中位數時薪 |
| 以時薪 1,000 計算（中高階） | 14,000 ~ 21,000 | 熟悉 Angular + Django 全端工程師 |
| 以時薪 1,200 計算（資深） | 16,800 ~ 25,200 | 資深全端 + 快速定位問題能力 |

### 收費合理性評估

**客戶預算 NT$15,000 的合理性分析**:

| 角度 | 評估 |
|------|------|
| 對工程師而言 | ✅ 合理偏低。以實際工時 14-21 小時計算，換算時薪約 714-1,071 TWD。考慮到需要從零理解一個四年歷史的全端系統，這個價格對工程師來說偏向底線 |
| 對客戶而言 | ✅ 合理。三個 bug 修復佔原始開發費用 80,000 的 18.75%，且都屬於既有功能的修正而非新功能開發，比例適當 |
| 市場行情 | ✅ 落在合理區間。台灣接案市場上，類似規模的 bug fix（全端、需理解既有架構），報價落在 10,000-25,000 TWD 之間 |

### 結論

> **NT$15,000 是一個雙方都能接受的合理價格**，但偏向工程師讓利的一端。
>
> - 如果工程師對 Angular + Django 很熟，能快速上手，15,000 是合理的
> - 如果需要較多時間理解專案，建議報 18,000-20,000 比較安全
> - 低於 12,000 對工程師不划算（時薪低於 600）
> - 高於 25,000 對客戶不划算（超過原始開發費用 30%）

---

## 四、風險提醒

| 風險 | 說明 |
|------|------|
| 隱藏 bug | 四年前的系統可能有其他未被發現的問題，修復過程中可能連帶發現 |
| 環境問題 | Docker 配置、Node/Python 版本可能需要額外調整 |
| 資料庫差異 | 開發環境 vs 正式環境資料不同，某些 bug 只在特定資料條件下重現 |
| 無測試覆蓋 | 專案未見自動化測試，修復後需人工驗證 |
| 依賴套件過時 | Angular 16 已非最新版，相關套件可能有安全性問題（但不在本次修復範圍） |

---

## 五、建議報價方案

| 方案 | 價格 | 內容 |
|------|------|------|
| **A. 基本修復** | NT$15,000 | 修復上述三個問題，基本測試驗證 |
| **B. 完整修復 + 強化** | NT$20,000 | 修復三個問題 + 加入完整的 null 防護 + 後端錯誤處理強化 + 交付修改說明文件 |
| **C. 修復 + 健檢** | NT$25,000 | 方案 B + 系統整體程式碼健康度檢查 + 已知風險清單 + 建議改善事項 |

---

*本報告基於原始碼靜態分析產生，實際修復工時可能因環境建置與資料庫狀態而有差異。*
