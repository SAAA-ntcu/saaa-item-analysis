/**
 * SAAA 試題分析 (CTT) 專用 CLI 執行入口 (Node.js)
 * 嚴格對齊 CTT_Item_Analysis_Report.py 與 SAAA-item/R/35_ctt.R & 55_ctt_exports.R
 * 包含：Kelley 27% 鐵律分群、精熟等級 6 組試題分析、Cronbach's α、pBis、診斷建議與官方綠底雙層 Excel 匯出
 * 執行指令: node cli_ctt.js
 */

const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const ScoringEngine = require("./src/scoring");
const CTTAnalyzer = require("./src/ctt");
const ExcelExporter = require("./src/exporter");
const SAAAMath = require("./src/math");

async function runCTTTask({ code, name, grade, ansFile, resFile, outputDir, desktopDir, masteryCutoff = null, basicCutoff = null, digits = 2 }) {
  const gradeLabel = String(grade).toUpperCase() === '7N' ? '七年級新生' : `${grade}年級`;
  console.log(`\n===========================================================================`);
  console.log(`📊【試題分析】正在處理：${name}科 (${gradeLabel})`);
  console.log(`===========================================================================`);

  // 1. 讀取答案
  const ansWb = new ExcelJS.Workbook();
  await ansWb.xlsx.readFile(ansFile);
  const { ansRows } = ScoringEngine.parseAnswerWorkbook(ansWb);
  const keys = ScoringEngine.extractKeyVector(ansRows, code, grade);

  // 2. 讀取作答檔並篩選有效樣本 (自動排除缺考與無效)
  const respWb = new ExcelJS.Workbook();
  await respWb.xlsx.readFile(resFile);
  const respWs = respWb.worksheets[0];

  const headers = respWs.getRow(1).values.slice(1).map(v => String(v || "").trim());
  const itemCols = [];
  headers.forEach((h, idx) => {
    if (/^(item|Item|第)[ ._]?[0-9]+/i.test(h) || (/^[0-9]+$/.test(h) && parseInt(h, 10) >= 1 && parseInt(h, 10) <= 200)) {
      itemCols.push(idx);
    }
  });

  const excludeIdxs = [];
  headers.forEach((h, idx) => {
    if (/^(無效|無效標記|無效資料|缺考|缺考標記)$/.test(h)) excludeIdxs.push(idx);
  });

  const validResponses = [];
  respWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const vals = row.values.slice(1);
    
    let isExcluded = false;
    for (const eIdx of excludeIdxs) {
      const v = String(vals[eIdx] || '').trim();
      if (['1', 'TRUE', 'True', 'true', '缺考', '無效'].includes(v)) {
        isExcluded = true;
        break;
      }
    }
    if (isExcluded) return;

    const studentAns = [];
    let emptyCount = 0;
    for (let j = 0; j < keys.length; j++) {
      const colIdx = itemCols[j];
      const ans = (colIdx !== undefined && colIdx < vals.length) ? String(vals[colIdx] || '').trim().toUpperCase() : '';
      if (!ans || ans === '9' || ans === '?') emptyCount++;
      studentAns.push(ans);
    }
    if (emptyCount === keys.length) return; // 全空缺考
    validResponses.push(studentAns);
  });

  console.log(`✓ 答案題數: ${keys.length} 題 | 有效納入分析人數: ${validResponses.length.toLocaleString()} 人`);

  // 3. 執行 CTT 試題分析 (門檻題數未指定則不計算精熟等級)
  const analyzer = new CTTAnalyzer({
    validResponses,
    answerKeys: keys,
    subjectName: name,
    grade,
    code,
    groupRatio: 0.27,
    masteryCutoff,
    basicCutoff,
    digits
  });

  const grp = analyzer.groupsInfo;
  console.log(`✓ 全卷信度 α: ${analyzer.alpha.toFixed(4)} | 平均難度 P: ${analyzer.avgDifficulty.toFixed(digits)} | 平均鑑別度 D: ${analyzer.avgDiscrimination.toFixed(digits)}`);
  console.log(`✓ 中分組動態標籤: 【${analyzer.midColName}】 | 低分組切點 <= ${grp.lowThreshold} 分 (${grp.lowerPctStr}), 高分組切點 >= ${grp.highThreshold} 分 (${grp.upperPctStr})`);

  if (analyzer.calcLevel) {
    const lvl = analyzer.levelStats;
    console.log(`✓ 精熟等級分佈 (精熟/基礎/待加強):
      • 精熟門檻 >= ${analyzer.masteryCutoff} 題: ${lvl.masteryCount.toLocaleString()} 人 (${lvl.masteryPctStr})
      • 基礎門檻 >= ${analyzer.basicCutoff} 題: ${lvl.basicCount.toLocaleString()} 人 (${lvl.basicPctStr})
      • 待加強人數: ${lvl.needyCount.toLocaleString()} 人 (${lvl.needyPctStr})`);
  } else {
    console.log(`✓ 精熟等級：未輸入門檻題數，代表不需要計算精熟等級 (已自動略過三等級試題分析與等級分佈)。`);
  }

  // 4. 匯出單科官方 CTT 報表 (雙分頁：試題分析總表 + 縣市三等級試題分析 + 工作表1)
  const officialWb = ExcelExporter.exportOfficialCTTWorkbook(analyzer, name, grade, "115");
  const cttNames = [
    `${code}${grade}N_試題分析總表.xlsx`,
    `115_${code}_試題分析總表.xlsx`
  ];
  for (const dir of [outputDir, desktopDir].filter(Boolean)) {
    for (const fn of cttNames) {
      try {
        await officialWb.xlsx.writeFile(path.join(dir, fn));
      } catch (e) {
        console.log(`   ⚠️ 檔案被鎖定，跳過更新: ${fn}`);
      }
    }
  }

  // 5. 匯出 R 經典格式真實值結果表
  const rClassicWb = ExcelExporter.exportRClassicCTTWorkbook(analyzer);
  const rNames = [
    `${code}${grade}N_分析結果.xlsx`,
    `115_${code}${grade}_分析結果.xlsx`
  ];
  for (const dir of [outputDir, desktopDir].filter(Boolean)) {
    for (const fn of rNames) {
      try {
        await rClassicWb.xlsx.writeFile(path.join(dir, fn));
      } catch (e) {
        console.log(`   ⚠️ 檔案被鎖定，跳過更新: ${fn}`);
      }
    }
  }

  console.log(`📁 ${name}科 官方試題分析總表與三等級報表已儲存。`);
  return analyzer;
}

async function main() {
  console.log("===========================================================================");
  console.log("🎯 SAAA 試題分析 (CTT) 與三等級試題分析系統 (獨立執行管線)");
  console.log("===========================================================================");

  // 解析命令列門檻參數 (若未指定，則代表不需要計算精熟等級)
  const args = process.argv.slice(2);
  let userMasteryCut = null;
  let userBasicCut = null;
  for (const a of args) {
    if (a.startsWith("--mastery=")) userMasteryCut = parseFloat(a.split("=")[1]);
    if (a.startsWith("--basic=")) userBasicCut = parseFloat(a.split("=")[1]);
  }

  if (userMasteryCut !== null && userBasicCut !== null && !isNaN(userMasteryCut) && !isNaN(userBasicCut) && userMasteryCut > userBasicCut && userBasicCut >= 0) {
    console.log(`📌 已輸入等級門檻題數：精熟 >= ${userMasteryCut} 題，基礎 >= ${userBasicCut} 題`);
  } else {
    userMasteryCut = null;
    userBasicCut = null;
    console.log(`💡 提示：未輸入精熟門檻題數 (可透過 --mastery=23 --basic=15 指定)，代表不需要計算精熟等級。`);
  }

  const baseDataDir = path.resolve(
    "C:/Users/USER/Downloads/2_分卷資料-20261012T063338Z-1-001/2_分卷資料"
  );
  const filterResDir = path.join(baseDataDir, "分析結果輸出");
  const outputDir = path.join(baseDataDir, "JS試題分析輸出");
  const desktopDir = "C:/Users/USER/Desktop";

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tasks = [
    {
      code: "C", name: "國語文", grade: "7N",
      ansFile: path.join(baseDataDir, "115年桃園市國中新生學力檢測國語文科答案.xlsx"),
      resFile: path.join(filterResDir, "國語_7年級_有效樣本篩選結果.xlsx")
    },
    {
      code: "M", name: "數學", grade: "7N",
      ansFile: path.join(baseDataDir, "115年桃園市國中新生學力檢測數學科答案.xlsx"),
      resFile: path.join(filterResDir, "數學_7年級_有效樣本篩選結果.xlsx")
    },
    {
      code: "E", name: "英語", grade: "7N",
      ansFile: path.join(baseDataDir, "115年桃園市學生學習能力檢測七年級英語科答案.xlsx"),
      resFile: path.join(filterResDir, "英語_7年級_有效樣本篩選結果.xlsx")
    }
  ];

  const t0 = Date.now();
  const analyzers = [];
  for (const t of tasks) {
    const a = await runCTTTask({
      ...t,
      outputDir,
      desktopDir,
      masteryCutoff: userMasteryCut,
      basicCutoff: userBasicCut,
      digits: 2
    });
    analyzers.push(a);
  }

  // 6. 整合全縣市綜合工作簿
  console.log("\n正在匯出全科整合試題分析總表...");
  const filterSummaryPath = path.join(filterResDir, "桃園市7年級_有效樣本篩選總結表.xlsx");
  let filterRows = null;
  if (fs.existsSync(filterSummaryPath)) {
    try {
      const fWb = new ExcelJS.Workbook();
      await fWb.xlsx.readFile(filterSummaryPath);
      const ws = fWb.worksheets[0];
      const rows = [];
      ws.eachRow(r => rows.push(r.values.slice(1)));
      if (rows.length >= 2) {
        const h = rows[0];
        filterRows = rows.slice(1).map(r => {
          const obj = {};
          h.forEach((name, i) => obj[name] = r[i] || "");
          return obj;
        });
      }
    } catch (e) {}
  }

  const combinedWb = ExcelExporter.exportCombinedCountyWorkbook(analyzers, filterRows, "115");
  for (const dir of [outputDir, desktopDir].filter(Boolean)) {
    const cpath = path.join(dir, "115年度_桃園市_縣市試題分析.xlsx");
    try {
      await combinedWb.xlsx.writeFile(cpath);
      console.log(`🏆 全科整合總表已存檔至: ${cpath}`);
    } catch (e) {
      console.log(`⚠️ 全科整合總表被 Excel 鎖定中，跳過更新: ${cpath}`);
    }
  }

  // 7. 匯出指標總結表 (全部數值四捨五入至小數後 2 位 0.00)
  const summaryList = analyzers.map(a => ({
    考科: `${a.subjectName}科`,
    總題數: a.nItems,
    有效分析人數: a.nValid,
    Cronbach_Alpha: SAAAMath.roundHalfUpFloat(a.alpha, 4),
    平均難度_P: a.avgDifficulty.toFixed(2),
    平均鑑別度_D: a.avgDiscrimination.toFixed(2),
    精熟率: (a.calcLevel && a.levelStats) ? a.levelStats.masteryPctStr : "不計算",
    基礎率: (a.calcLevel && a.levelStats) ? a.levelStats.basicPctStr : "不計算",
    待加強率: (a.calcLevel && a.levelStats) ? a.levelStats.needyPctStr : "不計算"
  }));

  const sumWb = ExcelExporter.exportTableToWorkbook(summaryList, "全科CTT試題分析總結表", 2);
  for (const dir of [outputDir, desktopDir].filter(Boolean)) {
    const spath = path.join(dir, "桃園市7年級_全科CTT試題分析總結表.xlsx");
    try {
      await sumWb.xlsx.writeFile(spath);
      console.log(`📄 全科彙整表已儲存至: ${spath}`);
    } catch (e) {
      console.log(`⚠️ 全科彙整表被 Excel 鎖定中，跳過更新: ${spath}`);
    }
  }

  const sec = ((Date.now() - t0) / 1000).toFixed(2);
  console.log("\n===========================================================================");
  console.log("📊【桃園市 115 年國中新生學力檢測全科 CTT 試題分析品質總表 (JS 引擎)】");
  console.log("===========================================================================");
  console.table(summaryList);
  console.log(`⏱️ 總運算與報表產出耗時：${sec} 秒\n`);
}

main().catch(console.error);
