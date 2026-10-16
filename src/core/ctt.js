/**
 * SAAA 古典測驗理論 (CTT) 試題分析引擎 (CTTAnalyzer)
 * 嚴格對齊 CTT_Item_Analysis_Report.py 與 SAAA-item/R/35_ctt.R
 * 具備：
 *   1. 114 鐵律分群切點與動態 midXX 欄位
 *   2. 精熟等級計算（精熟 / 基礎 / 待加強）與 6 組等級試題分析矩陣
 *   3. 試題分析數值全面四捨五入至小數後 2 位 (0.00) 純整數 BigInt 演算法
 *   4. Cronbach's alpha 信度、點二系列相關 (pBis)、誘答力分析與品質異常診斷
 */

import SAAAMath from "./math.js";

class CTTAnalyzer {
  constructor({
    validResponses, // 二維陣列或物件陣列 (僅含有效受試者作答選項)
    answerKeys,     // 正解陣列 (如 ['C', 'A', 'C', 'B', ...])
    subjectName = "考科",
    grade = 7,
    code = "SUBJ",
    optLabels = ["A", "B", "C", "D"],
    groupRatio = 0.27,
    defineGroups = null,
    masteryCutoff = null,
    basicCutoff = null,
    digits = 2
  }) {
    this.validResponses = validResponses;
    this.answerKeys = answerKeys.map(k => String(k || "").trim().toUpperCase());
    this.subjectName = subjectName;
    this.grade = grade;
    const hasNumKeys = this.answerKeys.some(k => ['1', '2', '3', '4'].includes(k));
    const gNum = parseInt(String(grade).replace(/\D/g, ''), 10);
    const isElem = (!isNaN(gNum) && gNum < 7);
    if (hasNumKeys || (isElem && !this.answerKeys.some(k => ['A', 'B', 'C', 'D'].includes(k)))) {
      this.optLabels = ["1", "2", "3", "4"];
    } else {
      this.optLabels = optLabels.map(o => String(o).toUpperCase());
    }
    this.allOpts = [...this.optLabels, "其它"];
    this.groupRatio = groupRatio;
    this.defineGroups = defineGroups;
    this.digits = digits;

    this.nValid = validResponses.length;
    this.nItems = this.answerKeys.length;

    // 門檻設定：嚴格遵循「精熟等級不可以自己算，要讓我輸入題數，如果沒有的話就代表不需要」
    const hasUserMastery = masteryCutoff !== null && masteryCutoff !== undefined && masteryCutoff !== "" && !isNaN(Number(masteryCutoff));
    const hasUserBasic = basicCutoff !== null && basicCutoff !== undefined && basicCutoff !== "" && !isNaN(Number(basicCutoff));

    if (hasUserMastery && hasUserBasic && Number(masteryCutoff) > Number(basicCutoff) && Number(basicCutoff) >= 0) {
      this.calcLevel = true;
      this.masteryCutoff = Number(masteryCutoff);
      this.basicCutoff = Number(basicCutoff);
    } else {
      this.calcLevel = false;
      this.masteryCutoff = null;
      this.basicCutoff = null;
    }

    this.scoredMatrix = null;
    this.totalScores = null;
    this.alpha = NaN;
    this.groupsInfo = null;
    this.midColName = "mid";

    // 等級分佈統計 (精熟 / 基礎 / 待加強)
    this.levelStats = null;

    this.itemsData = [];
    this.distractorTable = [];
    this.summaryTable = [];
    this.levelSummaryTable = []; // 6 組等級試題分析矩陣 (僅在 calcLevel = true 時生成)
    this.avgDifficulty = 0.0;
    this.avgPassRate = 0.0;
    this.avgDiscrimination = 0.0;

    this.fit();
  }

  fit() {
    if (this.nValid === 0 || this.nItems === 0) return this;

    // 1. 建立 0/1 計分矩陣
    this.scoredMatrix = [];
    this.totalScores = new Float64Array(this.nValid);

    for (let i = 0; i < this.nValid; i++) {
      const respRow = this.validResponses[i];
      const studentScored = new Uint8Array(this.nItems);
      let sTot = 0;

      for (let j = 0; j < this.nItems; j++) {
        const studentAns = String(respRow[j] || "").trim().toUpperCase();
        const key = this.answerKeys[j];

        let isCorrect = false;
        if (key.includes("、")) {
          const keys = key.split("、").map(k => k.trim());
          isCorrect = keys.includes(studentAns);
        } else {
          isCorrect = (studentAns === key);
        }

        if (isCorrect) {
          studentScored[j] = 1;
          sTot++;
        } else {
          studentScored[j] = 0;
        }
      }

      this.scoredMatrix.push(studentScored);
      this.totalScores[i] = sTot;
    }

    // 2. Cronbach's Alpha 全卷信度 (無偏樣本變異數 ddof = 1)
    this.alpha = SAAAMath.calculateCronbachAlpha(this.scoredMatrix, this.nValid, this.nItems);

    // 3. 114 鐵律分群切割 (Kelley's Rule)
    this.groupsInfo = SAAAMath.getCTTGroups(this.totalScores, this.groupRatio, this.defineGroups);
    const { lowerMask, midMask, upperMask, nLower, nMid, nUpper, midColName } = this.groupsInfo;
    this.midColName = midColName;
    this.groupsInfo.upperCount = nUpper;
    this.groupsInfo.lowerCount = nLower;
    this.groupsInfo.upperPctStr = ((nUpper / this.nValid) * 100).toFixed(this.digits) + "%";
    this.groupsInfo.lowerPctStr = ((nLower / this.nValid) * 100).toFixed(this.digits) + "%";

    // 4. 精熟等級分組遮罩與人數統計 (精熟 / 基礎 / 待加強)
    // 嚴格遵循：精熟等級不可以自己算，若無輸入題數則代表不需要 (calcLevel = false)
    let masteryMask = null;
    let basicMask = null;
    let needyMask = null;
    let mCnt = 0, bCnt = 0, iCnt = 0;

    if (this.calcLevel) {
      masteryMask = new Uint8Array(this.nValid);
      basicMask = new Uint8Array(this.nValid);
      needyMask = new Uint8Array(this.nValid);

      for (let i = 0; i < this.nValid; i++) {
        const s = this.totalScores[i];
        if (s >= this.masteryCutoff) {
          masteryMask[i] = 1;
          mCnt++;
        } else if (s >= this.basicCutoff) {
          basicMask[i] = 1;
          bCnt++;
        } else {
          needyMask[i] = 1;
          iCnt++;
        }
      }

      const mRate = SAAAMath.roundHalfUpRatio(mCnt, this.nValid, this.digits);
      const bRate = SAAAMath.roundHalfUpRatio(bCnt, this.nValid, this.digits);
      const iRate = SAAAMath.roundHalfUpRatio(iCnt, this.nValid, this.digits);

      this.levelStats = {
        calcLevel: true,
        masteryCount: mCnt,
        basicCount: bCnt,
        needyCount: iCnt,
        masteryRate: mRate,
        basicRate: bRate,
        needyRate: iRate,
        masteryPctStr: (mRate * 100).toFixed(this.digits) + "%",
        basicPctStr: (bRate * 100).toFixed(this.digits) + "%",
        needyPctStr: (iRate * 100).toFixed(this.digits) + "%",
        upperCount: nUpper,
        lowerCount: nLower,
        upperPctStr: this.groupsInfo.upperPctStr,
        lowerPctStr: this.groupsInfo.lowerPctStr
      };
    } else {
      this.levelStats = null;
    }

    // 5. 逐題計算難度、鑑別度、誘答力與診斷旗標 (全數值純整數四捨五入至 2 位 0.00)
    this.itemsData = [];
    this.distractorTable = [];
    this.summaryTable = [];
    this.levelSummaryTable = [];

    const allOptsTarget = [...this.optLabels, "其它"];

    for (let j = 0; j < this.nItems; j++) {
      const key = this.answerKeys[j];

      // 全體答對人數
      let kCorrect = 0;
      let kUpperCorrect = 0;
      let kLowerCorrect = 0;

      for (let i = 0; i < this.nValid; i++) {
        if (this.scoredMatrix[i][j] === 1) {
          kCorrect++;
          if (upperMask[i] === 1) kUpperCorrect++;
          if (lowerMask[i] === 1) kLowerCorrect++;
        }
      }

      // 難度與鑑別度 (四捨五入至小數後 2 位)
      const pVal = SAAAMath.roundHalfUpRatio(kCorrect, this.nValid, this.digits);
      const phVal = nUpper > 0 ? SAAAMath.roundHalfUpRatio(kUpperCorrect, nUpper, this.digits) : 0.0;
      const plVal = nLower > 0 ? SAAAMath.roundHalfUpRatio(kLowerCorrect, nLower, this.digits) : 0.0;
      const dVal = SAAAMath.roundHalfUpFloat(phVal - plVal, this.digits);
      const diffIdxVal = SAAAMath.roundHalfUpFloat((phVal + plVal) / 2.0, this.digits);

      // 雙系列相關 pBis (四捨五入至小數後 2 位)
      const itemSelection = new Uint8Array(this.nValid);
      for (let i = 0; i < this.nValid; i++) itemSelection[i] = this.scoredMatrix[i][j];
      const pBisRaw = SAAAMath.calculatePointBiserial(itemSelection, this.totalScores, this.nValid);
      const pBisVal = isNaN(pBisRaw) ? NaN : SAAAMath.roundHalfUpFloat(pBisRaw, this.digits);

      // 選項分析與各組分佈
      const optStats = {};
      const groupRates = {
        全體: {},
        高分組: {},
        低分組: {}
      };

      const groupsDef = [
        { name: "全體", mask: null, n: this.nValid },
        { name: "高分組", mask: upperMask, n: nUpper },
        { name: "低分組", mask: lowerMask, n: nLower }
      ];

      if (this.calcLevel) {
        groupRates.精熟 = {};
        groupRates.基礎 = {};
        groupRates.待加強 = {};
        groupsDef.splice(1, 0,
          { name: "精熟", mask: masteryMask, n: mCnt },
          { name: "基礎", mask: basicMask, n: bCnt },
          { name: "待加強", mask: needyMask, n: iCnt }
        );
      }

      allOptsTarget.forEach(opt => {
        const isOther = (opt === "其它" || opt === "其他");
        
        // 分組選答率
        groupsDef.forEach(grp => {
          let selCount = 0;
          for (let i = 0; i < this.nValid; i++) {
            if (grp.mask && grp.mask[i] !== 1) continue;
            const r = String(this.validResponses[i][j] || "").trim().toUpperCase();
            const match = isOther ? (!this.optLabels.includes(r)) : (r === opt);
            if (match) selCount++;
          }
          const rate = grp.n > 0 ? SAAAMath.roundHalfUpRatio(selCount, grp.n, this.digits) : 0.0;
          groupRates[grp.name][opt] = rate;
        });

        // 傳統 CTT 中分組選答率
        let midSelCount = 0;
        for (let i = 0; i < this.nValid; i++) {
          if (midMask[i] === 1) {
            const r = String(this.validResponses[i][j] || "").trim().toUpperCase();
            const match = isOther ? (!this.optLabels.includes(r)) : (r === opt);
            if (match) midSelCount++;
          }
        }
        const midRate = nMid > 0 ? SAAAMath.roundHalfUpRatio(midSelCount, nMid, this.digits) : 0.0;

        optStats[opt] = {
          total: groupRates["全體"][opt],
          upper: groupRates["高分組"][opt],
          mid: midRate,
          lower: groupRates["低分組"][opt],
          mastery: this.calcLevel ? groupRates["精熟"][opt] : null,
          basic: this.calcLevel ? groupRates["基礎"][opt] : null,
          needy: this.calcLevel ? groupRates["待加強"][opt] : null
        };
      });

      // 診斷建議判定
      const warnings = [];
      if (dVal < 0.05) {
        warnings.push("鑑別度未達0.05建議直接刪除");
      } else if (dVal >= 0.05 && dVal <= 0.15) {
        warnings.push("鑑別度0.05～0.15需進行試題修改");
      }

      this.optLabels.forEach(opt => {
        if (opt !== key) {
          if (optStats[opt].upper > optStats[key].upper) {
            warnings.push("高分組錯誤選項選答率高於正確選項");
          }
          if (optStats[opt].total > optStats[key].total) {
            warnings.push("錯誤選項選答率高於正確選項");
          }
        }
      });

      const uniqueWarnings = Array.from(new Set(warnings));
      const diagnosis = uniqueWarnings.length > 0 ? uniqueWarnings.join("；") : "正常";

      const itemInfo = {
        item: j + 1,
        key,
        nValid: this.nValid,
        passRate: pVal,
        difficulty: diffIdxVal,
        discrim: dVal,
        pBis: isNaN(pBisVal) ? NaN : pBisVal,
        lower: plVal,
        mid: optStats[key]?.mid ?? 0.0,
        upper: phVal,
        optStats,
        warning: diagnosis
      };

      this.itemsData.push(itemInfo);

      // 6. 組裝 6 組等級試題分析列 (僅在 calcLevel = true 時計算，對齊 R/35_ctt.R)
      if (this.calcLevel) {
        const levelRow = {
          題號: j + 1,
          鑑別度: dVal,
          答對率: pVal,
          正確答案: key
        };
        ["全體", "精熟", "基礎", "待加強", "高分組", "低分組"].forEach(grp => {
          allOptsTarget.forEach(opt => {
            levelRow[`${grp}_${opt}`] = groupRates[grp][opt];
          });
        });
        this.levelSummaryTable.push(levelRow);
      }

      // 7. 組裝摘要工作表
      this.summaryTable.push({
        題號: j + 1,
        正確答案: key,
        樣本數: kCorrect,
        通過率: pVal,
        pBis: isNaN(pBisVal) ? "-" : pBisVal.toFixed(this.digits),
        鑑別度: dVal,
        低分組: plVal,
        [this.midColName]: optStats[key]?.mid ?? 0.0,
        高分組: phVal,
        難度: diffIdxVal,
        診斷建議: diagnosis
      });
    }

    // 8. 計算全卷平均指標 (四捨五入至 2 位小數)
    const rawDiffAvg = this.itemsData.reduce((acc, it) => acc + it.difficulty, 0) / this.nItems;
    const rawPassAvg = this.itemsData.reduce((acc, it) => acc + it.passRate, 0) / this.nItems;
    const rawDiscAvg = this.itemsData.reduce((acc, it) => acc + it.discrim, 0) / this.nItems;

    this.avgDifficulty = SAAAMath.roundHalfUpFloat(rawDiffAvg, this.digits);
    this.avgPassRate = SAAAMath.roundHalfUpFloat(rawPassAvg, this.digits);
    this.avgDiscrimination = SAAAMath.roundHalfUpFloat(rawDiscAvg, this.digits);

    return this;
  }
}

export default CTTAnalyzer;
export { CTTAnalyzer };

