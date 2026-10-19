/**
 * SAAA 成績計算引擎 (ScoringEngine)
 * 對齊 SAAA-item/R/30_scoring.R 與 40_summaries.R
 * 包含：學生作答解析、0/1批改、多向度計分、精熟/基礎/待加強三等級判定與統計彙總。
 */

import {
  SUBJECT_NAMES,
  LEVEL_NAMES,
  CITY_CODE_MAP,
  generateCountyId,
  GRADE_TO_CHINESE,
  N_INFO_COLUMNS,
  DEFAULT_INFO_COLUMNS,
  INFO_COLUMN_ALIASES
} from "./constants.js";
import SAAAMath from "./math.js";

class ScoringEngine {
  /**
   * 解碼與標準化字串 (去 BOM、解碼 HTML 實體、去除多餘空白)
   */
  static normalizeString(val) {
    if (val === null || val === undefined) return "";
    let s = String(val).replace(/^\uFEFF/, "").replace(/\u00A0/g, " ").trim();
    // 支援 &#32317; 與 &#x7e3d; 解碼
    s = s.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return s.trim();
  }

  /**
   * 解析答案檔表格 (包含「答案」、「向度」、「等級門檻」工作表)
   */
  static parseAnswerWorkbook(workbook) {
    const sheetNames = workbook.worksheets.map(w => w.name);
    
    // 1. 答案工作表
    let ansWs = workbook.getWorksheet("答案") || workbook.worksheets[0];
    const ansRows = [];
    ansWs.eachRow({ includeEmpty: false }, row => {
      ansRows.push(row.values.slice(1).map(v => this.normalizeString(v)));
    });

    // 2. 向度工作表
    const dimCandidates = ["向度", "評量指標", "評量指標代", "維度"];
    let dimWsName = sheetNames.find(s => dimCandidates.includes(s)) || (sheetNames.length >= 2 ? sheetNames[1] : null);
    let dimRows = [];
    if (dimWsName) {
      const dimWs = workbook.getWorksheet(dimWsName);
      dimWs.eachRow({ includeEmpty: false }, row => {
        dimRows.push(row.values.slice(1).map(v => this.normalizeString(v)));
      });
    }

    // 3. 等級門檻工作表
    let cutWsName = sheetNames.find(s => /等級門檻|門檻|標準門檻|切點|cutoff/i.test(s));
    let cutRows = [];
    if (cutWsName) {
      const cutWs = workbook.getWorksheet(cutWsName);
      cutWs.eachRow({ includeEmpty: false }, row => {
        cutRows.push(row.values.slice(1).map(v => this.normalizeString(v)));
      });
    }

    return { ansRows, dimRows, cutRows };
  }

  /**
   * 提取特定科目與年級之答案鍵向量 (支援縱向 C7 欄位、橫向題號/答案列、以及雙欄模式)
   */
  static extractKeyVector(ansRows, subjectCode, grade) {
    if (!ansRows || ansRows.length === 0) return [];

    const cleanGrade = String(grade).toUpperCase().replace(/N$/, "");
    const cleanSubj = subjectCode ? String(subjectCode).toUpperCase() : "";
    const targetCandidates = [
      `${cleanSubj}${grade}`.toUpperCase(),
      `${cleanSubj}${cleanGrade}`.toUpperCase(),
      `${cleanSubj}${cleanGrade}N`.toUpperCase()
    ];

    // 1. 檢查是否為縱向多欄格式 (如 R 標準答案表：欄位名稱含 C7, M7, E7, E7N 等)
    const headerRow = ansRows[0].map(h => this.normalizeString(h).toUpperCase());
    let targetColIdx = headerRow.findIndex(h => targetCandidates.includes(h));

    // 若未精確匹配，但在單一考科答案表中存在明確的科目欄（如檔內只有 E7 或 E7N）
    if (targetColIdx === -1) {
      const anySubjIdx = headerRow.findIndex(h => /^[CMES][3-8]N?$/.test(h));
      if (anySubjIdx !== -1) {
        targetColIdx = anySubjIdx;
      }
    }
    
    if (targetColIdx !== -1 && ansRows.length >= 3) {
      const keys = [];
      for (let r = 1; r < ansRows.length; r++) {
        const row = ansRows[r];
        if (targetColIdx < row.length) {
          const val = this.normalizeString(row[targetColIdx]).toUpperCase();
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
      const oneIdx = row.findIndex(c => c === 1 || c === "1" || c === 1.0);
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
            if (ar !== r && ansRows[ar].some(cell => /答案/i.test(this.normalizeString(cell)))) {
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
              const val = this.normalizeString(aRow[col]).toUpperCase();
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
          const val = this.normalizeString(ansRows[r][1]).toUpperCase();
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
        const val = this.normalizeString(ansRows[r][0]).toUpperCase();
        if (val && /^[A-D1-9、/]+$/.test(val)) {
          colAKeys.push(val);
        }
      }
    }
    if (colAKeys.length >= 5) return colAKeys;

    return [];
  }

  /**
   * 提取特定科目與年級之向度標籤向量
   */
  static extractDimensionLabels(dimRows, subjectCode, grade, nItems) {
    if (!dimRows || dimRows.length < 2) return Array(nItems).fill("一般向度");
    const headerRow = dimRows[0].map(h => h.trim());
    const gradeStr = String(grade);
    const chineseGrade = GRADE_TO_CHINESE[gradeStr] || `${gradeStr}年級`;
    const targetCol = `${subjectCode.toUpperCase()}${gradeStr}`;

    let colIdx = headerRow.findIndex(h => h === targetCol || h === chineseGrade || h === gradeStr);
    if (colIdx === -1) colIdx = 0;

    const labels = [];
    for (let r = 1; r < dimRows.length && labels.length < nItems; r++) {
      const row = dimRows[r];
      const val = (colIdx < row.length ? this.normalizeString(row[colIdx]) : "") || "一般向度";
      labels.push(val);
    }
    while (labels.length < nItems) labels.push("一般向度");
    return labels;
  }

  /**
   * 提取精熟與基礎等級門檻
   * 遵循規範：精熟等級不可以自己算，必須明確輸入題數；若無輸入亦無門檻表則代表不需要 (calcLevel = false)
   */
  static extractCutoffs(cutRows, ansRows, subjectCode, grade, nItems, userMasteryCut = null, userBasicCut = null) {
    // 1. 優先使用使用者直接輸入的門檻題數
    const uM = parseFloat(userMasteryCut);
    const uB = parseFloat(userBasicCut);
    if (!isNaN(uM) && !isNaN(uB) && uM > uB && uB >= 0) {
      return { masteryCutoff: uM, basicCutoff: uB, calcLevel: true };
    }

    const targetCol = `${subjectCode.toUpperCase()}${grade}`;
    
    // 2. 從答案檔獨立等級門檻工作表提取 (若答案檔中有明確設定)
    if (cutRows && cutRows.length >= 2) {
      const headers = cutRows[0].map(h => this.normalizeString(h).toUpperCase());
      const colIdx = headers.indexOf(targetCol);
      if (colIdx !== -1) {
        let mVal = NaN, bVal = NaN;
        for (let r = 1; r < cutRows.length; r++) {
          const rowLabel = this.normalizeString(cutRows[r][0]);
          const val = parseFloat(cutRows[r][colIdx]);
          if (/精熟/i.test(rowLabel) && !isNaN(val)) mVal = val;
          if (/基礎/i.test(rowLabel) && !isNaN(val)) bVal = val;
        }
        if (!isNaN(mVal) && !isNaN(bVal) && mVal > bVal) {
          return { masteryCutoff: mVal, basicCutoff: bVal, calcLevel: true };
        }
      }
    }

    // 3. 使用者未提供題數且答案檔無門檻表 -> 代表不需要計算精熟等級
    return {
      masteryCutoff: null,
      basicCutoff: null,
      calcLevel: false
    };
  }

  /**
   * 解析作答檔資料列與欄位結構
   */
  static parseResponseRows(rawRows) {
    if (!rawRows || rawRows.length < 2) {
      throw new Error("作答檔缺少標題列或無學生作答資料列。");
    }

    const headers = rawRows[0].map(h => this.normalizeString(h));
    const dataRows = rawRows.slice(1);

    // 找出作答題目的起始欄位 (支援 item1 ~ N、第 1 ~ N 題、或純數字 1 ~ N)
    let itemIndices = [];
    headers.forEach((h, idx) => {
      const isItem = /^(item|Item|第)[ ._]?[0-9]+/i.test(h) || (/^[0-9]+$/.test(h) && parseInt(h, 10) >= 1 && parseInt(h, 10) <= 200);
      if (isItem) {
        itemIndices.push(idx);
      }
    });

    let infoBoundary = N_INFO_COLUMNS;
    if (itemIndices.length > 0) {
      infoBoundary = Math.min(...itemIndices);
    } else {
      infoBoundary = Math.min(N_INFO_COLUMNS, headers.length - 1);
      itemIndices = Array.from({ length: headers.length - infoBoundary }, (_, i) => infoBoundary + i);
    }

    // 解析基本資料欄位索引
    const infoColIndices = {};
    Object.keys(INFO_COLUMN_ALIASES).forEach(key => {
      const aliases = INFO_COLUMN_ALIASES[key];
      const foundIdx = headers.findIndex((h, idx) => idx < infoBoundary && aliases.includes(h));
      infoColIndices[key] = foundIdx !== -1 ? foundIdx : (DEFAULT_INFO_COLUMNS[key] ? DEFAULT_INFO_COLUMNS[key] - 1 : -1);
    });

    return {
      headers,
      dataRows,
      infoBoundary,
      itemIndices,
      infoColIndices,
      nItems: itemIndices.length,
      nTotal: dataRows.length
    };
  }

  /**
   * 核心批改與成績計算流程 (完整重現 30_scoring.R)
   */
  static scoreExam({
    rawResponseRows,
    ansRows,
    dimRows,
    cutRows,
    subjectCode = "C",
    grade = 7,
    year = "115",
    digits = 2,
    masteryCutoff = null,
    basicCutoff = null
  }) {
    const resp = this.parseResponseRows(rawResponseRows);
    const keyVector = this.extractKeyVector(ansRows, subjectCode, grade);
    const nItems = Math.min(resp.nItems, keyVector.length > 0 ? keyVector.length : resp.nItems);
    const activeItemIndices = resp.itemIndices.slice(0, nItems);
    const activeKeyVector = keyVector.slice(0, nItems);

    const dimensionLabels = this.extractDimensionLabels(dimRows, subjectCode, grade, nItems);
    const cutoffs = this.extractCutoffs(cutRows, ansRows, subjectCode, grade, nItems, masteryCutoff, basicCutoff);

    const uniqueDimensions = Array.from(new Set(dimensionLabels.filter(d => d && d !== "")));
    const dimItemMap = {};
    uniqueDimensions.forEach(dim => {
      dimItemMap[dim] = [];
      dimensionLabels.forEach((label, idx) => {
        if (label === dim) dimItemMap[dim].push(idx);
      });
    });

    const students = [];
    const scoredMatrix = [];

    // 逐生批改與資訊組裝
    for (let i = 0; i < resp.nTotal; i++) {
      const row = resp.dataRows[i];

      // 提取基本資訊
      const getVal = key => {
        const idx = resp.infoColIndices[key];
        return (idx !== -1 && idx < row.length) ? this.normalizeString(row[idx]) : "";
      };

      const cityName = getVal("city") || "桃園市";
      const studentId = getVal("id") || String(i + 1).padStart(6, "0");
      const countyId = getVal("county_id") || generateCountyId(year, cityName, `${subjectCode}${grade}N`, i + 1);

      // 檢查缺考與無效
      let emptyCount = 0;
      activeItemIndices.forEach(colIdx => {
        const ans = (colIdx < row.length ? this.normalizeString(row[colIdx]) : "");
        if (!ans || ans === "9" || ans === "?") emptyCount++;
      });
      const allEmpty = emptyCount === nItems;
      const isAbsentMark = /^(1|TRUE|缺考)$/i.test(getVal("absent")) || /^(1|TRUE|無效)$/i.test(getVal("invalid"));
      const absentFlag = allEmpty || isAbsentMark;

      // 特殊生與身分別
      const specialVal = getVal("special") || "0";
      const isSpecial123 = ["1", "2", "3"].includes(specialVal);
      const specialFlag = isSpecial123 || (specialVal !== "" && specialVal !== "0");

      const aboriginal = getVal("aboriginal") === "1" ? 1 : 0;
      const immigrant = getVal("immigrant") === "1" ? 1 : 0;
      let familyType = "一般生";
      if (aboriginal === 1 && immigrant === 0) familyType = "原住民子女";
      else if (aboriginal === 0 && immigrant === 1) familyType = "新住民子女";
      else if (aboriginal === 1 && immigrant === 1) familyType = "原且新住民子女";

      // 0/1 逐題批改
      const studentScored = new Uint8Array(nItems);
      const studentRawResponses = [];
      let totalCorrect = 0;

      activeItemIndices.forEach((colIdx, j) => {
        const respVal = (colIdx < row.length ? this.normalizeString(row[colIdx]) : "").toUpperCase();
        studentRawResponses.push(respVal);
        const key = activeKeyVector[j] || "";
        
        let isCorrect = false;
        if (key.includes("、")) {
          const validKeys = key.split("、").map(k => k.trim());
          isCorrect = validKeys.includes(respVal);
        } else {
          isCorrect = (respVal === key);
        }

        if (isCorrect) {
          studentScored[j] = 1;
          totalCorrect++;
        } else {
          studentScored[j] = 0;
        }
      });
      scoredMatrix.push(studentScored);

      // 總答對率 (四捨五入至指定小數後位數，預設 2 位 0.00)
      const totalCorrectRate = absentFlag ? NaN : SAAAMath.roundHalfUpRatio(totalCorrect, nItems, digits);

      // 向度計分 (四捨五入至指定小數後位數，預設 2 位 0.00)
      const dimScores = {};
      const dimCounts = {};
      uniqueDimensions.forEach(dim => {
        const itemIdxs = dimItemMap[dim];
        let dimCorrect = 0;
        itemIdxs.forEach(idx => {
          if (studentScored[idx] === 1) dimCorrect++;
        });
        dimCounts[dim] = absentFlag ? NaN : dimCorrect;
        dimScores[dim] = absentFlag ? NaN : SAAAMath.roundHalfUpRatio(dimCorrect, itemIdxs.length, digits);
      });

      // 精熟等級判定 (只有在提供門檻題數且 calcLevel 為 true 時判定，絕不自動計算；無輸入則為 null 代表不需要)
      let level = null;
      if (cutoffs.calcLevel && !absentFlag) {
        if (totalCorrect >= cutoffs.masteryCutoff) level = "精熟";
        else if (totalCorrect >= cutoffs.basicCutoff) level = "基礎";
        else level = "待加強";
      }

      students.push({
        index: i + 1,
        id: studentId,
        countyId,
        city: cityName,
        district: getVal("district"),
        schoolCode: getVal("school_code"),
        schoolName: getVal("school_name"),
        classCode: getVal("class_code"),
        seatNo: parseInt(getVal("seat_no"), 10) || null,
        name: getVal("student_name"),
        sex: getVal("sex") === "1" ? "男" : (getVal("sex") === "2" ? "女" : getVal("sex")),
        totalCorrectCount: absentFlag ? null : totalCorrect,
        totalCorrectRate,
        level,
        absentFlag,
        specialVal,
        isSpecial123,
        specialFlag,
        aboriginal,
        immigrant,
        familyType,
        dimScores,
        dimCounts,
        rawResponses: studentRawResponses,
        scored: studentScored
      });
    }

    return {
      students,
      scoredMatrix,
      nItems,
      nTotal: resp.nTotal,
      activeKeyVector,
      activeItemIndices,
      uniqueDimensions,
      cutoffs,
      calcLevel: cutoffs.calcLevel
    };
  }
}

export default ScoringEngine;
export { ScoringEngine };

