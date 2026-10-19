/**
 * SAAA 全自動批次執行管線 (SAAABatchPipeline)
 * 整合「成績計算」與「CTT 試題分析」，支援批次多科目自動化處理、即時進度回調與檔案匯出。
 */

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import ScoringEngine from "./scoring.js";
import SummaryEngine from "./summaries.js";
import CTTAnalyzer from "./ctt.js";
import ExcelExporter from "./exporter.js";
import SAAAMath from "./math.js";

class SAAABatchPipeline {
  constructor({
    tasks = [],
    outputDir = "./output",
    desktopDir = null,
    filterSummaryFile = null,
    groupRatio = 0.27,
    calcLevel = true,
    onProgress = null
  } = {}) {
    this.tasks = tasks;
    this.outputDir = outputDir;
    this.desktopDir = desktopDir;
    this.filterSummaryFile = filterSummaryFile;
    this.groupRatio = groupRatio;
    this.calcLevel = calcLevel;
    this.onProgress = onProgress || ((pct, msg) => {});

    this.results = {};
    this.analyzers = [];
    this.summaryList = [];
  }

  /**
   * 輔助函式：從路徑讀取 Excel 的所有 row 資料為純字串二維陣列
   */
  static async readWorkbookRows(filePath) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];
    const rows = [];
    ws.eachRow({ includeEmpty: false }, row => {
      rows.push(row.values.slice(1).map(v => (v !== null && v !== undefined ? String(v).trim() : "")));
    });
    return { workbook: wb, rows };
  }

  /**
   * 執行全流程批次分析
   */
  async run() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const totalTasks = this.tasks.length;
    this.summaryList = [];
    this.analyzers = [];

    for (let tIdx = 0; tIdx < totalTasks; tIdx++) {
      const task = this.tasks[tIdx];
      const basePct = Math.round((tIdx / totalTasks) * 90);
      this.onProgress(basePct, `正在載入 ${task.name}科 (${task.grade}年級) 資料...`);

      // 1. 讀取答案檔與作答檔
      const ansWb = new ExcelJS.Workbook();
      await ansWb.xlsx.readFile(task.ansFile);
      const { ansRows, dimRows, cutRows } = ScoringEngine.parseAnswerWorkbook(ansWb);

      const { rows: respRows } = await SAAABatchPipeline.readWorkbookRows(task.resFile);

      // 2. 執行成績計算 (Scoring)
      this.onProgress(basePct + 10, `正在計算 ${task.name}科 個人成績、向度與等級...`);
      const scoreResult = ScoringEngine.scoreExam({
        rawResponseRows: respRows,
        ansRows,
        dimRows,
        cutRows,
        subjectCode: task.code,
        grade: task.grade,
        year: task.year || "115"
      });

      // 3. 執行統計彙總 (Summaries)
      const countySummary = SummaryEngine.buildCountySummary(scoreResult.students, scoreResult.uniqueDimensions);
      const schoolSummary = SummaryEngine.buildSchoolSummary(scoreResult.students, scoreResult.uniqueDimensions);
      const classSummary = SummaryEngine.buildClassSummary(scoreResult.students, scoreResult.uniqueDimensions);
      const regionSummary = SummaryEngine.buildRegionSummary(scoreResult.students, scoreResult.uniqueDimensions);
      const familySummary = SummaryEngine.buildFamilySummary(scoreResult.students, scoreResult.uniqueDimensions);
      const absentList = SummaryEngine.buildAbsentList(scoreResult.students);
      const overallScores = SummaryEngine.buildOverallScores(scoreResult.students, scoreResult.uniqueDimensions);

      // 4. 篩選有效樣本執行 CTT 試題分析 (CTT Analysis)
      this.onProgress(basePct + 20, `正在進行 ${task.name}科 CTT 試題分析 (鐵律分群與誘答力)...`);
      const validStudents = scoreResult.students.filter(s => !s.absentFlag);
      const validResponses = validStudents.map(s => s.rawResponses);

      const analyzer = new CTTAnalyzer({
        validResponses,
        answerKeys: scoreResult.activeKeyVector,
        subjectName: task.name,
        grade: task.grade,
        code: task.code,
        groupRatio: this.groupRatio
      });
      this.analyzers.push(analyzer);

      console.log(`🚀 ${task.name}科 (${task.grade}年級): 有效樣本 ${analyzer.nValid.toLocaleString()} 人 | 信度 α=${analyzer.alpha.toFixed(4)} | 平均難度=${analyzer.avgDifficulty.toFixed(3)} | 平均鑑別度=${analyzer.avgDiscrimination.toFixed(3)}`);
      console.log(`   • 極端組劃分: 低分組<=${analyzer.groupsInfo.lowThreshold}分 (${(analyzer.groupsInfo.actualLowerPct*100).toFixed(1)}%), 高分組>=${analyzer.groupsInfo.highThreshold}分 (${(analyzer.groupsInfo.actualUpperPct*100).toFixed(1)}%), 中分組標籤=【${analyzer.midColName}】`);

      // 5. 匯出 Excel 報表
      this.onProgress(basePct + 25, `正在匯出 ${task.name}科 官方總表與分析結果...`);

      // 5.1 單科官方 CTT 總表
      const officialWb = ExcelExporter.exportOfficialCTTWorkbook(analyzer, task.name, task.grade);
      const cttNames = [
        `${task.code}${task.grade}N_試題分析總表.xlsx`,
        `115_${task.code}_試題分析總表.xlsx`
      ];
      for (const targetDir of [this.outputDir, this.desktopDir].filter(Boolean)) {
        for (const fname of cttNames) {
          const outPath = path.join(targetDir, fname);
          try {
            await officialWb.xlsx.writeFile(outPath);
          } catch (e) {
            console.log(`   ⚠️ 檔案被鎖定，跳過更新: ${fname}`);
          }
        }
      }
      console.log(`   ✓ 單科總表處理完成: ${task.code}${task.grade}N_試題分析總表.xlsx`);

      // 5.2 R 經典格式分析結果檔
      const rClassicWb = ExcelExporter.exportRClassicCTTWorkbook(analyzer);
      const rNames = [
        `${task.code}${task.grade}N_分析結果.xlsx`,
        `115_${task.code}${task.grade}_分析結果.xlsx`
      ];
      for (const targetDir of [this.outputDir, this.desktopDir].filter(Boolean)) {
        for (const fname of rNames) {
          const outPath = path.join(targetDir, fname);
          try {
            await rClassicWb.xlsx.writeFile(outPath);
          } catch (e) {
            console.log(`   ⚠️ 檔案被鎖定，跳過更新: ${fname}`);
          }
        }
      }
      console.log(`   ✓ R 經典格式分析結果檔處理完成: ${task.code}${task.grade}N_分析結果.xlsx`);

      // 5.3 成績計算相關報表匯出 (可選)
      const scoringWb = ExcelExporter.exportTableToWorkbook(overallScores, "全體總答對率");
      const scoringOutPath = path.join(this.outputDir, `115_${task.code}${task.grade}_全體總答對率.xlsx`);
      await scoringWb.xlsx.writeFile(scoringOutPath);

      const countyWb = ExcelExporter.exportTableToWorkbook(countySummary, "縣市平均");
      await countyWb.xlsx.writeFile(path.join(this.outputDir, `115_${task.code}${task.grade}_縣市平均.xlsx`));

      this.summaryList.push({
        考科: `${task.name}科`,
        總題數: analyzer.nItems,
        有效分析人數: analyzer.nValid,
        Cronbach_Alpha: SAAAMath.roundHalfUpFloat(analyzer.alpha, 4),
        平均難度_P: SAAAMath.roundHalfUpFloat(analyzer.avgPassRate, 3),
        平均鑑別度_D: SAAAMath.roundHalfUpFloat(analyzer.avgDiscrimination, 3)
      });

      this.results[task.code] = {
        scoreResult,
        summaries: {
          countySummary,
          schoolSummary,
          classSummary,
          regionSummary,
          familySummary,
          absentList,
          overallScores
        },
        analyzer
      };
    }

    // 6. 整合全縣市綜合工作簿
    this.onProgress(95, "正在整合全科綜合報表...");
    let filterRows = null;
    if (this.filterSummaryFile && fs.existsSync(this.filterSummaryFile)) {
      try {
        const { rows } = await SAAABatchPipeline.readWorkbookRows(this.filterSummaryFile);
        if (rows.length >= 2) {
          const headers = rows[0];
          filterRows = rows.slice(1).map(r => {
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = r[idx] || "";
            });
            return obj;
          });
        }
      } catch (e) {
        console.log("讀取篩選總結表失敗，略過嵌入首頁。");
      }
    }

    const combinedWb = ExcelExporter.exportCombinedCountyWorkbook(this.analyzers, filterRows);
    for (const targetDir of [this.outputDir, this.desktopDir].filter(Boolean)) {
      const cpath = path.join(targetDir, "115年度_桃園市_縣市試題分析.xlsx");
      try {
        await combinedWb.xlsx.writeFile(cpath);
        console.log(`🏆 全科整合總表已存檔至: ${cpath}`);
      } catch (e) {
        console.log(`⚠️ 全科整合總表被 Excel 鎖定中，跳過更新: ${cpath}`);
      }
    }

    // 7. 匯出指標總結表
    const sumWb = ExcelExporter.exportTableToWorkbook(this.summaryList, "全科CTT試題分析總結表");
    for (const targetDir of [this.outputDir, this.desktopDir].filter(Boolean)) {
      const spath = path.join(targetDir, "桃園市7年級_全科CTT試題分析總結表.xlsx");
      try {
        await sumWb.xlsx.writeFile(spath);
        console.log(`📄 全科彙整表已儲存至: ${spath}`);
      } catch (e) {
        console.log(`⚠️ 全科彙整表被 Excel 鎖定中，跳過更新: ${spath}`);
      }
    }

    this.onProgress(100, "全科試題分析與成績計算批次處理完成！");
    return this.results;
  }
}

export default SAAABatchPipeline;
export { SAAABatchPipeline };
