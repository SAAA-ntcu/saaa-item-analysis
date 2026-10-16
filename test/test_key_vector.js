const ExcelJS = require('exceljs');
const path = require('path');

function normalizeString(val) {
  if (val === null || val === undefined) return '';
  let s = String(val).replace(/^\uFEFF/, '').replace(/\u00A0/g, ' ').trim();
  s = s.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return s.trim();
}

function extractKeyVector(ansRows, subjectCode, grade) {
  if (!ansRows || ansRows.length === 0) return [];

  const targetCol = `${subjectCode.toUpperCase()}${grade}`;
  const targetColN = `${targetCol}N`;

  // 1. 檢查是否為縱向多欄格式 (如 R 標準答案表：欄位名稱含 C7, M7, E7 等)
  const headerRow = ansRows[0].map(h => normalizeString(h).toUpperCase());
  let targetColIdx = headerRow.findIndex(h => h === targetCol || h === targetColN);
  
  // 若第一列未找到，且總列數較多 (>= 5)，檢查第一欄是否為題號且第二欄為答案
  if (targetColIdx !== -1 && ansRows.length >= 3) {
    const keys = [];
    for (let r = 1; r < ansRows.length; r++) {
      const row = ansRows[r];
      if (targetColIdx < row.length) {
        const val = normalizeString(row[targetColIdx]).toUpperCase();
        if (val && !/^(不予計分|不計分|此題不計分|無|送分|不採計|精熟|基礎)$/.test(val)) {
          keys.push(val);
        }
      }
    }
    if (keys.length >= 3) return keys;
  }

  // 2. 檢查是否為橫向排列格式 (如縣市新生檢測：Row 1 題號 1, 2, 3...，Row 2 正解)
  for (let r = 0; r < Math.min(5, ansRows.length); r++) {
    const row = ansRows[r];
    // 尋找題號 1 的起始欄位
    const oneIdx = row.findIndex(c => c === 1 || c === '1' || c === 1.0);
    if (oneIdx !== -1 && row.length > oneIdx + 3) {
      // 驗證接下來是否為 2, 3, 4
      const isItemRow = [2, 3, 4].every((expected, idx) => {
        const val = row[oneIdx + 1 + idx];
        return String(val).trim() === String(expected);
      });
      if (isItemRow) {
        // 找到題號列，尋找答案列 (含「答案」字樣的列，或其下一列)
        let ansRowIdx = -1;
        for (let ar = 0; ar < ansRows.length; ar++) {
          if (ar !== r && ansRows[ar].some(cell => /答案/i.test(normalizeString(cell)))) {
            ansRowIdx = ar;
            break;
          }
        }
        if (ansRowIdx === -1 && r + 1 < ansRows.length) {
          ansRowIdx = r + 1;
        }

        if (ansRowIdx !== -1) {
          const keys = [];
          const aRow = ansRows[ansRowIdx];
          for (let col = oneIdx; col < aRow.length; col++) {
            const val = normalizeString(aRow[col]).toUpperCase();
            if (val && !/^(不予計分|不計分|此題不計分|無|送分|不採計)$/.test(val)) {
              keys.push(val);
            } else if (!val && col >= aRow.length - 2) {
              break;
            }
          }
          if (keys.length >= 3) return keys;
        }
      }
    }
  }

  // 3. 檢查縱向雙欄 (Col A 題號，Col B 答案)
  if (ansRows.length >= 5) {
    const colBKeys = [];
    for (let r = 1; r < ansRows.length; r++) {
      if (ansRows[r].length >= 2) {
        const val = normalizeString(ansRows[r][1]).toUpperCase();
        if (val && /^[A-D1-9、/]+$/.test(val)) {
          colBKeys.push(val);
        }
      }
    }
    if (colBKeys.length >= 5) return colBKeys;
  }

  // 4. 回退：如果第一欄縱向有超過 5 題合法答案字元
  const colAKeys = [];
  for (let r = 1; r < ansRows.length; r++) {
    if (ansRows[r].length >= 1) {
      const val = normalizeString(ansRows[r][0]).toUpperCase();
      if (val && /^[A-D1-9、/]+$/.test(val)) {
        colAKeys.push(val);
      }
    }
  }
  if (colAKeys.length >= 5) return colAKeys;

  return [];
}

async function testFiles() {
  const base = 'C:/Users/USER/Downloads/2_分卷資料-20261012T063338Z-1-001/2_分卷資料';
  const saaa = 'C:/Users/USER/Downloads/SAAA-item/桃園7年級_SAAA試題分析專用檔';

  const testCases = [
    { file: path.join(base, '115年桃園市國中新生學力檢測國語文科答案.xlsx'), code: 'C', grade: 7 },
    { file: path.join(base, '115年桃園市國中新生學力檢測數學科答案.xlsx'), code: 'M', grade: 7 },
    { file: path.join(base, '115年桃園市學生學習能力檢測七年級英語科答案.xlsx'), code: 'E', grade: 7 },
    { file: path.join(saaa, '115_C_ans.xlsx'), code: 'C', grade: 7 },
    { file: path.join(saaa, '115_M_ans.xlsx'), code: 'M', grade: 7 },
    { file: path.join(saaa, '115_E_ans.xlsx'), code: 'E', grade: 7 },
  ];

  for (const tc of testCases) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(tc.file);
    const ws = wb.getWorksheet('答案') || wb.worksheets[0];
    const rows = [];
    ws.eachRow({ includeEmpty: true }, row => {
      rows.push(row.values.slice(1).map(v => normalizeString(v)));
    });
    const keys = extractKeyVector(rows, tc.code, tc.grade);
    console.log(`File: ${path.basename(tc.file)} [${tc.code}${tc.grade}] => 題數: ${keys.length}, 前 5 題: ${keys.slice(0, 5).join(', ')}, 末 3 題: ${keys.slice(-3).join(', ')}`);
  }
}

testFiles().catch(console.error);
