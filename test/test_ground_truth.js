import ExcelJS from 'exceljs';
import path from 'path';
import ScoringEngine from '../src/core/scoring.js';
import CTTAnalyzer from '../src/core/ctt.js';

async function testSubject(subjName, ansFile, resFile, code, grade) {
  console.log(`\n=================== 測試 ${subjName} ===================`);
  // 1. 讀取答案
  const ansWb = new ExcelJS.Workbook();
  await ansWb.xlsx.readFile(ansFile);
  const { ansRows } = ScoringEngine.parseAnswerWorkbook(ansWb);
  const keys = ScoringEngine.extractKeyVector(ansRows, code, grade);
  console.log(`答案題數: ${keys.length}, 前 5 題: ${keys.slice(0, 5).join(', ')}`);

  // 2. 讀取作答
  const resWb = new ExcelJS.Workbook();
  await resWb.xlsx.readFile(resFile);
  const resWs = resWb.worksheets[0];

  const headers = resWs.getRow(1).values.slice(1).map(v => String(v || '').trim());
  const itemCols = [];
  headers.forEach((h, idx) => {
    if (/^(item|Item|第)[ ._]?[0-9]+/i.test(h)) {
      itemCols.push(idx);
    }
  });
  console.log(`作答題數欄位: ${itemCols.length}`);

  // 找出排除欄位 (缺考、無效)
  const excludeIdxs = [];
  headers.forEach((h, idx) => {
    if (/^(無效|無效標記|無效資料|缺考|缺考標記)$/.test(h)) {
      excludeIdxs.push(idx);
    }
  });

  const validResponses = [];
  resWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const vals = row.values.slice(1);
    
    // 檢查無效或缺考
    let isExcluded = false;
    for (const eIdx of excludeIdxs) {
      const v = String(vals[eIdx] || '').trim();
      if (['1', 'TRUE', 'True', 'true', '缺考', '無效'].includes(v)) {
        isExcluded = true;
        break;
      }
    }
    if (isExcluded) return;

    // 提取題目答案
    const studentAns = [];
    let emptyCount = 0;
    for (let j = 0; j < keys.length; j++) {
      const colIdx = itemCols[j];
      const ans = (colIdx !== undefined && colIdx < vals.length) ? String(vals[colIdx] || '').trim().toUpperCase() : '';
      if (!ans || ans === '9' || ans === '?') emptyCount++;
      studentAns.push(ans);
    }
    // 全空視為缺考
    if (emptyCount === keys.length) return;

    validResponses.push(studentAns);
  });

  console.log(`有效受試者人數: ${validResponses.length}`);

  const analyzer = new CTTAnalyzer({
    validResponses,
    answerKeys: keys,
    subjectName: subjName,
    grade,
    code,
    groupRatio: 0.27
  });

  console.log(`試題分析結果:
  • 總題數: ${analyzer.nItems}
  • 有效分析人數: ${analyzer.nValid}
  • Cronbach Alpha: ${analyzer.alpha.toFixed(4)}
  • 平均難度 P: ${analyzer.avgDifficulty.toFixed(3)}
  • 平均鑑別度 D: ${analyzer.avgDiscrimination.toFixed(3)}
  • 中分組欄名: ${analyzer.midColName}
  • 高低分組切點: 低分組 <= ${analyzer.groupsInfo.lowThreshold} 分 (${(analyzer.groupsInfo.actualLowerPct*100).toFixed(2)}%), 高分組 >= ${analyzer.groupsInfo.highThreshold} 分 (${(analyzer.groupsInfo.actualUpperPct*100).toFixed(2)}%)
  `);

  return analyzer;
}

async function run() {
  const saaaDir = 'C:/Users/USER/Downloads/SAAA-item/桃園7年級_SAAA試題分析專用檔';
  
  console.log('--- 驗證 SAAA-item 專用檔 (Ground Truth 對照) ---');
  await testSubject('國語文科', path.join(saaaDir, '115_C_ans.xlsx'), path.join(saaaDir, '115_C7_有效樣本.xlsx'), 'C', 7);
  await testSubject('數學科', path.join(saaaDir, '115_M_ans.xlsx'), path.join(saaaDir, '115_M7_有效樣本.xlsx'), 'M', 7);
  await testSubject('英語科', path.join(saaaDir, '115_E_ans.xlsx'), path.join(saaaDir, '115_E7_有效樣本.xlsx'), 'E', 7);
}

run().catch(console.error);
