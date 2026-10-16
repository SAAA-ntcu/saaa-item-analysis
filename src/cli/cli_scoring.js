/**
 * SAAA 成績計算專用 CLI 執行入口 (Node.js)
 * 對齊 SAAA-item/R/30_scoring.R 與 40_summaries.R
 * 包含：0/1批改、精熟/基礎/待加強三等級判定、各層級平均、併表等級描述總表與學生排名PR
 * 執行指令: node cli_scoring.js
 */

const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const ScoringEngine = require("./src/scoring");
const SummaryEngine = require("./src/summaries");
const ExcelExporter = require("./src/exporter");

async function runScoringTask({ code, name, grade, ansFile, resFile, outputDir, userMasteryCut = null, userBasicCut = null, digits = 2 }) {
  const gradeLabel = String(grade).toUpperCase() === '7N' ? '七年級新生' : `${grade}年級`;
  console.log(`\n===========================================================================`);
  console.log(`📝【成績計算】正在處理：${name}科 (${gradeLabel})`);
  console.log(`===========================================================================`);

  // 1. 讀取答案檔與作答檔
  const ansWb = new ExcelJS.Workbook();
  await ansWb.xlsx.readFile(ansFile);
  const { ansRows, dimRows, cutRows } = ScoringEngine.parseAnswerWorkbook(ansWb);

  const respWb = new ExcelJS.Workbook();
  await respWb.xlsx.readFile(resFile);
  const respWs = respWb.worksheets[0];
  const respRows = [];
  respWs.eachRow({ includeEmpty: false }, r => {
    respRows.push(r.values.slice(1).map(v => (v !== null && v !== undefined ? String(v).trim() : "")));
  });

  // 2. 執行逐生 0/1 批改與精熟等級判定 (精熟 / 基礎 / 待加強，數值四捨五入至 2 位 0.00)
  const scoreResult = ScoringEngine.scoreExam({
    rawResponseRows: respRows,
    ansRows,
    dimRows,
    cutRows,
    subjectCode: code,
    grade,
    year: "115",
    userMasteryCut,
    userBasicCut,
    digits
  });

  const students = scoreResult.students;
  const dims = scoreResult.uniqueDimensions;
  const cutoffs = scoreResult.cutoffs;

  const validStudents = students.filter(s => !s.absentFlag);
  const mCount = validStudents.filter(s => s.level === "精熟").length;
  const bCount = validStudents.filter(s => s.level === "基礎").length;
  const iCount = validStudents.filter(s => s.level === "待加強").length;

  console.log(`✓ 總學生數: ${students.length.toLocaleString()} 人 | 到考人數: ${validStudents.length.toLocaleString()} 人 | 缺考人數: ${(students.length - validStudents.length).toLocaleString()} 人`);
  if (scoreResult.calcLevel) {
    console.log(`✓ 等級門檻: 精熟 >= ${cutoffs.masteryCutoff} 題, 基礎 >= ${cutoffs.basicCutoff} 題`);
    console.log(`✓ 等級分佈: 精熟 ${mCount.toLocaleString()} 人 (${((mCount/validStudents.length)*100).toFixed(digits)}%) | 基礎 ${bCount.toLocaleString()} 人 (${((bCount/validStudents.length)*100).toFixed(digits)}%) | 待加強 ${iCount.toLocaleString()} 人 (${((iCount/validStudents.length)*100).toFixed(digits)}%)`);
  } else {
    console.log(`✓ 等級門檻：未輸入門檻題數，代表不需要計算精熟等級 (已自動略過等級判定與 6 大等級描述報表)。`);
  }

  // 3. 建立各項統計報表 (全數值精準四捨五入至小數後 2 位 0.00)
  const countySum = SummaryEngine.buildCountySummary(students, dims, digits);
  const schoolSum = SummaryEngine.buildSchoolSummary(students, dims, digits);
  const classSum = SummaryEngine.buildClassSummary(students, dims, digits);
  const regionSum = SummaryEngine.buildRegionSummary(students, dims, digits);
  const familySum = SummaryEngine.buildFamilySummary(students, dims, digits);
  const absentList = SummaryEngine.buildAbsentList(students);

  // 4. 建立等級描述報表 (精熟 / 基礎 / 待加強 併表呈現扣除特殊生與含特殊生 - 僅在 calcLevel = true 時生成)
  const countyLevel = SummaryEngine.buildCountyLevelSummary(students, digits);
  const schoolLevel = SummaryEngine.buildSchoolLevelSummary(students, digits);
  const classLevel = SummaryEngine.buildClassLevelSummary(students, digits);
  const regionLevel = SummaryEngine.buildRegionLevelSummary(students, digits);
  const familyLevel = SummaryEngine.buildFamilyLevelSummary(students, digits);

  // 5. 學生個人完整成績表 (含全體排名、全體PR、答對題數、依設定可選精熟等級)
  const rankedScores = SummaryEngine.buildRankedStudentScores(students, dims, digits);

  // 6. 匯出 Excel 報表
  const taskDir = path.join(outputDir, `${code}${grade}_成績計算輸出`);
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });

  const exports = [
    { data: rankedScores, name: `115_${code}${grade}_全體總答對率.xlsx`, sheet: "全體總答對率" },
    { data: rankedScores, name: `115_${code}${grade}_全體名單成績含缺考.xlsx`, sheet: "全體名單成績含缺考" },
    { data: rankedScores, name: `115_${code}${grade}_個人成績含題數.xlsx`, sheet: "個人成績含題數" },
    { data: countySum, name: `115_${code}${grade}_縣市平均.xlsx`, sheet: "縣市平均" },
    { data: schoolSum, name: `115_${code}${grade}_各校平均.xlsx`, sheet: "各校平均" },
    { data: classSum, name: `115_${code}${grade}_各班平均.xlsx`, sheet: "各班平均" },
    { data: regionSum, name: `115_${code}${grade}_縣市區域平均.xlsx`, sheet: "縣市區域平均" },
    { data: familySum, name: `115_${code}${grade}_不同家庭背景平均.xlsx`, sheet: "不同家庭背景平均" },
    { data: absentList, name: `115_${code}${grade}_缺考名單.xlsx`, sheet: "缺考名單" }
  ];

  if (scoreResult.calcLevel) {
    exports.push(
      { data: countyLevel, name: `115_${code}${grade}_縣市平均(等級描述).xlsx`, sheet: "縣市平均(等級描述)" },
      { data: schoolLevel, name: `115_${code}${grade}_各校平均(等級描述).xlsx`, sheet: "各校平均(等級描述)" },
      { data: classLevel, name: `115_${code}${grade}_各班平均(等級描述).xlsx`, sheet: "各班平均(等級描述)" },
      { data: regionLevel, name: `115_${code}${grade}_縣市區域平均(等級描述).xlsx`, sheet: "縣市區域平均(等級描述)" },
      { data: familyLevel, name: `115_${code}${grade}_不同家庭背景平均(等級描述).xlsx`, sheet: "不同家庭背景平均(等級描述)" }
    );
  }

  for (const exp of exports) {
    const wb = ExcelExporter.exportTableToWorkbook(exp.data, exp.sheet, digits);
    const outPath = path.join(taskDir, exp.name);
    await wb.xlsx.writeFile(outPath);
  }
  console.log(`📁 ${name}科 成績計算 ${exports.length} 份統計報表已全數匯出至: ${taskDir}`);

  return {
    code,
    name,
    grade,
    total: students.length,
    valid: validStudents.length,
    absent: students.length - validStudents.length,
    calcLevel: scoreResult.calcLevel,
    masteryRate: scoreResult.calcLevel ? ((mCount/validStudents.length)*100).toFixed(digits) + "%" : "不計算",
    basicRate: scoreResult.calcLevel ? ((bCount/validStudents.length)*100).toFixed(digits) + "%" : "不計算",
    needyRate: scoreResult.calcLevel ? ((iCount/validStudents.length)*100).toFixed(digits) + "%" : "不計算"
  };
}

async function main() {
  console.log("===========================================================================");
  console.log("🎯 SAAA 成績計算與等級描述系統 (獨立執行管線)");
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
  const outputDir = path.join(baseDataDir, "JS成績計算輸出");

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
  const results = [];
  for (const t of tasks) {
    const res = await runScoringTask({
      ...t,
      outputDir,
      userMasteryCut,
      userBasicCut,
      digits: 2
    });
    results.push(res);
  }
  const sec = ((Date.now() - t0) / 1000).toFixed(2);

  console.log("\n===========================================================================");
  console.log("📊【全科成績計算與三等級判定成果總表 (數值四捨五入至小數後 2 位 0.00)】");
  console.log("===========================================================================");
  console.table(results);
  console.log(`⏱️ 總運算與報表產出耗時：${sec} 秒\n`);
}

main().catch(console.error);
