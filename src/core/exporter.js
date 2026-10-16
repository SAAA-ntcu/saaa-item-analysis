/**
 * SAAA 官方規格 Excel 報表渲染引擎 (ExcelExporter)
 * 使用 exceljs 實現像素級精確的大考中心標準綠底雙層表頭、顏色警示、三等級試題分析與成績統計彙總。
 */

import ExcelJS from "exceljs";
import { EXCEL_STYLES } from "./constants.js";
import SAAAMath from "./math.js";

class ExcelExporter {
  /**
   * 套用標準儲存格格式輔助函式
   */
  static formatCell(cell, {
    font = null,
    fillColor = null,
    align = { horizontal: "center", vertical: "middle", wrapText: true },
    numFmt = null,
    border = EXCEL_STYLES.BORDER_THIN
  } = {}) {
    cell.font = font || { name: EXCEL_STYLES.FONT_FAMILY, size: 11 };
    cell.alignment = align;
    cell.border = border;
    if (fillColor) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor }
      };
    }
    if (numFmt) {
      cell.numFmt = numFmt;
    }
    return cell;
  }

  /**
   * 1. 繪製官方規格 CTT 試題分析工作表 (含綠底雙層表頭、黃/灰/紅字警示與表尾附註)
   */
  static writeOfficialCTTSheet(ws, analyzer, subjectName = null, grade = null) {
    const subj = subjectName || analyzer.subjectName;
    const grd = grade || analyzer.grade;
    const allOpts = analyzer.allOpts;
    const nCols = 5 + 3 * allOpts.length + 1; // 額外加入診斷建議欄

    // 1. 頂部統計橫幅 (Row 1)
    const grdStr = String(grd).toUpperCase();
    const gradeLabel = grdStr === '7N' ? '七年級新生' : `${grd}年級`;
    const banners = [
      { start: 1, end: 4, text: `${subj}${gradeLabel}_試題分析結果` },
      { start: 5, end: 8, text: `試題平均難度：${(SAAAMath.roundHalfUpFloat(analyzer.avgDifficulty, 2) * 100).toFixed(2)}%` },
      { start: 9, end: 12, text: `試題平均通過率：${(SAAAMath.roundHalfUpFloat(analyzer.avgPassRate, 2) * 100).toFixed(2)}%` },
      { start: 13, end: 16, text: `Cronbach's α：${analyzer.alpha.toFixed(2)}` },
      { start: 17, end: 20, text: `有效樣本數：${analyzer.nValid.toLocaleString()}` }
    ];

    ws.getRow(1).height = 28;
    banners.forEach(({ start, end, text }) => {
      ws.mergeCells(1, start, 1, end);
      const cell = ws.getCell(1, start);
      cell.value = text;
    });

    // 2. 複合多層表頭 (Row 2 & 3)
    ws.getRow(2).height = 24;
    ws.getRow(3).height = 24;

    const headerGroups = [
      { start: 1, end: 1, title: "題號", spanV: true },
      { start: 2, end: 5, title: "CTT", spanV: false },
      { start: 6, end: 10, title: "全體", spanV: false },
      { start: 11, end: 15, title: "高分組", spanV: false },
      { start: 16, end: 20, title: "低分組", spanV: false },
      { start: 21, end: 21, title: "診斷建議", spanV: true }
    ];

    headerGroups.forEach(({ start, end, title, spanV }) => {
      ws.getCell(2, start).value = title;
      if (spanV) {
        ws.mergeCells(2, start, 3, end);
      } else {
        ws.mergeCells(2, start, 2, end);
      }
    });

    const subheaders = ["", "鑑別度", "難度", "通過率", "正確答案", ...allOpts, ...allOpts, ...allOpts, "診斷建議"];
    for (let c = 2; c <= nCols; c++) {
      if (c <= subheaders.length) {
        ws.getCell(3, c).value = subheaders[c - 1];
      }
    }

    // 表頭綠底樣式套用 (Row 1 ~ 3)
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= nCols; c++) {
        this.formatCell(ws.getCell(r, c), {
          font: { name: EXCEL_STYLES.FONT_FAMILY, size: 11, bold: true },
          fillColor: EXCEL_STYLES.COLOR_GREEN
        });
      }
    }

    // 3. 逐題資料列 (Row 4+)
    analyzer.itemsData.forEach((it, idx) => {
      const r = 4 + idx;
      ws.getRow(r).height = 22;

      // 欄 1: 題號
      this.formatCell(ws.getCell(r, 1)).value = it.item;

      // 欄 2: 鑑別度 (四捨五入至小數後 2 位 0.00)
      const dCell = this.formatCell(ws.getCell(r, 2), { numFmt: "0.00" });
      dCell.value = it.discrim;
      if (it.discrim < 0.20) {
        dCell.font = { name: EXCEL_STYLES.FONT_FAMILY, size: 11, bold: true, color: { argb: EXCEL_STYLES.FONT_RED } };
      }

      // 欄 3: 難度 (0.00)
      this.formatCell(ws.getCell(r, 3), { numFmt: "0.00" }).value = it.difficulty;

      // 欄 4: 通過率 (0.00)
      this.formatCell(ws.getCell(r, 4), { numFmt: "0.00" }).value = it.passRate;

      // 欄 5: 正確答案
      this.formatCell(ws.getCell(r, 5)).value = it.key;

      // 欄 6~10: 全體選項選答率 (0.00)
      allOpts.forEach((opt, oIdx) => {
        const c = 6 + oIdx;
        const rate = it.optStats[opt]?.total ?? 0.0;
        const cell = this.formatCell(ws.getCell(r, c), { numFmt: "0.00" });
        cell.value = rate;

        if (opt === it.key) {
          this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_YELLOW, numFmt: "0.00" });
        } else if (rate > (it.optStats[it.key]?.total ?? 0.0)) {
          this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_GRAY, numFmt: "0.00" });
        }
      });

      // 欄 11~15: 高分組選項選答率 (0.00)
      allOpts.forEach((opt, oIdx) => {
        const c = 11 + oIdx;
        const rate = it.optStats[opt]?.upper ?? 0.0;
        const cell = this.formatCell(ws.getCell(r, c), { numFmt: "0.00" });
        cell.value = rate;

        if (opt === it.key) {
          this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_YELLOW, numFmt: "0.00" });
        } else if (rate > (it.optStats[it.key]?.upper ?? 0.0)) {
          this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_YELLOW_ALERT, numFmt: "0.00" });
        }
      });

      // 欄 16~20: 低分組選項選答率 (0.00)
      allOpts.forEach((opt, oIdx) => {
        const c = 16 + oIdx;
        const rate = it.optStats[opt]?.lower ?? 0.0;
        const cell = this.formatCell(ws.getCell(r, c), { numFmt: "0.00" });
        cell.value = rate;

        if (opt === it.key) {
          this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_YELLOW, numFmt: "0.00" });
        }
      });

      // 欄 21: 診斷建議
      const warnCell = this.formatCell(ws.getCell(r, 21), {
        align: { horizontal: "left", vertical: "middle" },
        font: {
          name: EXCEL_STYLES.FONT_FAMILY,
          size: 10,
          color: { argb: it.warning !== "正常" ? EXCEL_STYLES.FONT_RED : "FF000000" }
        }
      });
      warnCell.value = it.warning;
    });

    // 4. 自適應欄寬
    const colWidths = { 1: 8, 2: 10, 3: 10, 4: 10, 5: 10, 21: 30 };
    for (let c = 1; c <= nCols; c++) {
      ws.getColumn(c).width = colWidths[c] || 7.5;
    }
  }

  /**
   * 2. 繪製官方規格「縣市三等級試題分析」工作表 (對齊 R/55_ctt_exports.R write_level_ctt_sheet)
   * 包含全體、精熟、基礎、待加強、高分組、低分組 6 組選答率矩陣，頂部包含等級門檻與人數分佈
   */
  static writeLevelCTTSheet(ws, analyzer, subjectName = null, grade = null, year = "115") {
    if (!analyzer.calcLevel || !analyzer.levelStats) return;

    const subj = subjectName || analyzer.subjectName;
    const grd = grade || analyzer.grade;
    const optLabels = analyzer.optLabels;
    const nOpts = optLabels.length;
    const nCols = 4 + 6 * (nOpts + 1); // 4 + 6 * 5 = 34 欄

    const lvl = analyzer.levelStats;
    const mCut = analyzer.masteryCutoff;
    const bCut = analyzer.basicCutoff;

    // 1. 第 1 列：縣市/科目/年級 與 精熟/基礎/待加強 人數門檻橫幅
    ws.getRow(1).height = 28;
    const grdStr = String(grd).toUpperCase();
    const gradeLabel = grdStr === '7N' ? '七年級新生' : `${grd}年級`;
    const title = `${year}年度桃園市${subj}${gradeLabel} 試題分析結果`;

    const topCards = [
      { start: 1, end: 4, text: title },
      { start: 5, end: 8, text: `有效樣本人數：${analyzer.nValid.toLocaleString()}` },
      { start: 9, end: 12, text: `精熟人數：${lvl.masteryCount.toLocaleString()} (${lvl.masteryPctStr})` },
      { start: 13, end: 16, text: `基礎人數：${lvl.basicCount.toLocaleString()} (${lvl.basicPctStr})` },
      { start: 17, end: 20, text: `待加強人數：${lvl.needyCount.toLocaleString()} (${lvl.needyPctStr})` },
      { start: 21, end: 24, text: `高分組人數(前27%)：${lvl.upperCount.toLocaleString()} (${lvl.upperPctStr})` },
      { start: 25, end: 28, text: `低分組人數(後27%)：${lvl.lowerCount.toLocaleString()} (${lvl.lowerPctStr})` },
      { start: 29, end: 31, text: `精熟門檻：≥${mCut} 題` },
      { start: 32, end: 34, text: `基礎門檻：≥${bCut} 題` }
    ];

    topCards.forEach(({ start, end, text }) => {
      ws.mergeCells(1, start, 1, end);
      ws.getCell(1, start).value = text;
    });

    // 2. 第 2 列與第 3 列：6 組表頭
    ws.getRow(2).height = 24;
    ws.getRow(3).height = 24;

    const h2Groups = [
      { start: 1, end: 1, title: "題號", spanV: true },
      { start: 2, end: 2, title: "鑑別度", spanV: true },
      { start: 3, end: 3, title: "答對率", spanV: true },
      { start: 4, end: 4, title: "正確答案", spanV: true },
      { start: 5, end: 9, title: "全體", spanV: false },
      { start: 10, end: 14, title: "精熟", spanV: false },
      { start: 15, end: 19, title: "基礎", spanV: false },
      { start: 20, end: 24, title: "待加強", spanV: false },
      { start: 25, end: 29, title: "高分組(前27%)", spanV: false },
      { start: 30, end: 34, title: "低分組(後27%)", spanV: false }
    ];

    h2Groups.forEach(({ start, end, title, spanV }) => {
      ws.getCell(2, start).value = title;
      if (spanV) {
        ws.mergeCells(2, start, 3, end);
      } else {
        ws.mergeCells(2, start, 2, end);
      }
    });

    const subOpts = [...optLabels, "其它"];
    let subCol = 5;
    for (let g = 0; g < 6; g++) {
      for (let o = 0; o < subOpts.length; o++) {
        ws.getCell(3, subCol++).value = subOpts[o];
      }
    }

    // 樣式：綠底複合表頭 (Row 1 ~ 3)
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= nCols; c++) {
        this.formatCell(ws.getCell(r, c), {
          font: { name: EXCEL_STYLES.FONT_FAMILY, size: 10, bold: true },
          fillColor: EXCEL_STYLES.COLOR_GREEN
        });
      }
    }

    // 3. 資料列 (Row 4+)：四捨五入至小數後 2 位 (0.00)
    analyzer.levelSummaryTable.forEach((rowObj, idx) => {
      const r = 4 + idx;
      ws.getRow(r).height = 20;

      // 題號
      this.formatCell(ws.getCell(r, 1)).value = rowObj.題號;

      // 鑑別度 (0.00)
      const dCell = this.formatCell(ws.getCell(r, 2), { numFmt: "0.00" });
      dCell.value = rowObj.鑑別度;
      if (rowObj.鑑別度 < 0.20) {
        dCell.font = { name: EXCEL_STYLES.FONT_FAMILY, size: 10, bold: true, color: { argb: EXCEL_STYLES.FONT_RED } };
      }

      // 答對率 (0.00)
      this.formatCell(ws.getCell(r, 3), { numFmt: "0.00" }).value = rowObj.答對率;

      // 正確答案
      this.formatCell(ws.getCell(r, 4)).value = rowObj.正確答案;

      // 6 組選答率
      const groups = ["全體", "精熟", "基礎", "待加強", "高分組", "低分組"];
      let cIdx = 5;
      groups.forEach(grp => {
        subOpts.forEach(opt => {
          const rate = rowObj[`${grp}_${opt}`] ?? 0.0;
          const cell = this.formatCell(ws.getCell(r, cIdx++), { numFmt: "0.00" });
          cell.value = rate;

          // 正確答案以淡黃底突顯
          if (opt === rowObj.正確答案) {
            this.formatCell(cell, { fillColor: EXCEL_STYLES.COLOR_YELLOW, numFmt: "0.00" });
          }
        });
      });
    });

    // 自適應欄寬
    ws.getColumn(1).width = 7;
    ws.getColumn(2).width = 9;
    ws.getColumn(3).width = 9;
    ws.getColumn(4).width = 9;
    for (let c = 5; c <= nCols; c++) {
      ws.getColumn(c).width = 7.5;
    }
  }

  /**
   * 3. 建立官方單科 CTT 試題分析工作簿 (含「試題分析總表」與「縣市三等級試題分析」)
   */
  static exportOfficialCTTWorkbook(analyzer, subjectName = null, grade = null, year = "115") {
    const wb = new ExcelJS.Workbook();
    const subj = subjectName || analyzer.subjectName;
    const grd = grade || analyzer.grade;

    // Sheet 1: 官方雙層表頭試題分析總表
    const ws1 = wb.addWorksheet(`${subj}${grd}年級`);
    this.writeOfficialCTTSheet(ws1, analyzer, subj, grd);

    // Sheet 2: 縣市三等級試題分析表 (精熟 / 基礎 / 待加強) - 僅在設定門檻時生成
    if (analyzer.calcLevel) {
      const ws2 = wb.addWorksheet(`${subj}${grd}年級_三等級試題分析`);
      this.writeLevelCTTSheet(ws2, analyzer, subj, grd, year);
    }

    // Sheet 3: 逐題摘要 (工作表1，對齊 R 原生格式)
    const ws3 = wb.addWorksheet("工作表1");
    if (analyzer.summaryTable.length > 0) {
      const headers = Object.keys(analyzer.summaryTable[0]);
      ws3.addRow(headers);
      ws3.getRow(1).height = 24;
      ws3.getRow(1).eachCell(c => this.formatCell(c, { font: { name: EXCEL_STYLES.FONT_FAMILY, bold: true }, fillColor: EXCEL_STYLES.COLOR_GREEN }));
      analyzer.summaryTable.forEach(row => {
        const added = ws3.addRow(headers.map(h => row[h]));
        added.height = 20;
        added.eachCell((c, cIdx) => {
          this.formatCell(c);
          if (cIdx >= 4 && cIdx <= 10) c.numFmt = "0.00";
        });
      });
      headers.forEach((h, idx) => {
        ws3.getColumn(idx + 1).width = Math.max(h.length * 2.5, 10);
      });
    }

    return wb;
  }

  /**
   * 4. 建立 R 經典格式真實值活頁簿 (雙分頁：選項明細 + 單題摘要)
   */
  static exportRClassicCTTWorkbook(analyzer) {
    const wb = new ExcelJS.Workbook();
    const sheetName1 = `${analyzer.subjectName.slice(0, 2)}${analyzer.grade} 分析結果`;
    const ws1 = wb.addWorksheet(sheetName1);

    if (analyzer.distractorTable.length > 0) {
      const headers = Object.keys(analyzer.distractorTable[0]);
      ws1.addRow(headers);
      analyzer.distractorTable.forEach(row => {
        ws1.addRow(headers.map(h => row[h]));
      });
      ws1.getRow(1).font = { name: EXCEL_STYLES.FONT_FAMILY, bold: true };
    }

    const ws2 = wb.addWorksheet("工作表1");
    if (analyzer.summaryTable.length > 0) {
      const headers = Object.keys(analyzer.summaryTable[0]);
      ws2.addRow(headers);
      analyzer.summaryTable.forEach(row => {
        ws2.addRow(headers.map(h => row[h]));
      });
      ws2.getRow(1).font = { name: EXCEL_STYLES.FONT_FAMILY, bold: true };
    }

    return wb;
  }

  /**
   * 5. 建立成績計算彙總報表工作簿 (支援 0.00 四捨五入)
   */
  static exportTableToWorkbook(tableRows, sheetName = "Sheet1", digits = 2) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);
    if (!tableRows || tableRows.length === 0) return wb;

    const headers = Object.keys(tableRows[0]);
    ws.addRow(headers);
    ws.getRow(1).height = 24;
    ws.getRow(1).eachCell(cell => {
      this.formatCell(cell, {
        font: { name: EXCEL_STYLES.FONT_FAMILY, size: 11, bold: true },
        fillColor: EXCEL_STYLES.COLOR_GREEN
      });
    });

    tableRows.forEach(row => {
      const rowValues = headers.map(h => row[h]);
      const addedRow = ws.addRow(rowValues);
      addedRow.height = 20;
      addedRow.eachCell((cell, colIdx) => {
        this.formatCell(cell);
        const val = row[headers[colIdx - 1]];
        if (typeof val === "number" && !headers[colIdx - 1].includes("數") && !headers[colIdx - 1].includes("號")) {
          cell.numFmt = "0.00";
        }
      });
    });

    headers.forEach((h, idx) => {
      ws.getColumn(idx + 1).width = Math.max(h.length * 2.5, 12);
    });

    return wb;
  }

  /**
   * 6. 建立全科整合 CTT 試題分析工作簿
   */
  static exportCombinedCountyWorkbook(analyzers, filterSummaryRows = null, year = "115") {
    const wb = new ExcelJS.Workbook();

    // 整合第 1 頁「有效樣本篩選總表」
    if (filterSummaryRows && filterSummaryRows.length > 0) {
      const wsFilter = wb.addWorksheet("有效樣本篩選總表");
      const headers = Object.keys(filterSummaryRows[0]);
      wsFilter.addRow(headers);
      wsFilter.getRow(1).height = 26;
      wsFilter.getRow(1).eachCell(cell => {
        this.formatCell(cell, {
          font: { name: EXCEL_STYLES.FONT_FAMILY, size: 11, bold: true },
          fillColor: EXCEL_STYLES.COLOR_GREEN
        });
      });

      filterSummaryRows.forEach(row => {
        const addedRow = wsFilter.addRow(headers.map(h => row[h]));
        addedRow.height = 20;
        addedRow.eachCell(cell => {
          this.formatCell(cell);
        });
      });

      headers.forEach((h, idx) => {
        wsFilter.getColumn(idx + 1).width = Math.max(h.length * 2.5, 12);
      });
    }

    // 繪入各考科「試題分析總表」與「三等級試題分析」
    analyzers.forEach(analyzer => {
      const gStr = String(analyzer.grade).toUpperCase();
      const gradeLabel = gStr === '7N' ? '七年級新生' : `${analyzer.grade}年級`;
      const title1 = `${analyzer.subjectName}${gradeLabel}`;
      const ws1 = wb.addWorksheet(title1);
      this.writeOfficialCTTSheet(ws1, analyzer, analyzer.subjectName, analyzer.grade);

      if (analyzer.calcLevel) {
        const title2 = `${analyzer.subjectName}${gradeLabel}_三等級試題分析`;
        const ws2 = wb.addWorksheet(title2);
        this.writeLevelCTTSheet(ws2, analyzer, analyzer.subjectName, analyzer.grade, year);
      }
    });

    return wb;
  }
}

export default ExcelExporter;
export { ExcelExporter };

