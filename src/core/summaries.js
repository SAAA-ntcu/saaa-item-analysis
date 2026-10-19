/**
 * SAAA 統計彙總與報表聚合引擎 (SummaryEngine)
 * 嚴格對齊 SAAA-item/R/40_summaries.R
 * 包含：
 *   1. 既有平均報表：縣市平均、各校平均、各班平均、區域平均、家庭背景平均、總平均、缺考名單
 *   2. 併表等級描述報表（精熟 / 基礎 / 待加強）：
 *      - 縣市平均(等級描述)、各校平均(等級描述)、各班平均(等級描述)、區域平均(等級描述)、家庭背景平均(等級描述)、總平均(等級描述)
 *   3. 學生排名與個人成績表（全體排名、全體PR、縣市排名、縣市PR、精熟等級、答對題數）
 *   4. 全面支援純整數算術四捨五入至小數後 2 位 (0.00)
 */

import SAAAMath from "./math.js";

class SummaryEngine {
  /**
   * 計算一組學生的基礎統計數據 (平均答對率、各向度答對率、精熟/基礎/待加強分佈)
   */
  static computeGroupStats(students, uniqueDimensions = [], digits = 2) {
    const totalCount = students.length;
    const absentCount = students.filter(s => s.absentFlag).length;
    const specialCount = students.filter(s => !s.absentFlag && s.isSpecial123).length;
    
    // 平均母體：到考且非特殊生 1/2/3
    const validStudents = students.filter(s => !s.absentFlag && !s.isSpecial123);
    const validCount = validStudents.length;

    // 總答對率平均
    let meanRate = NaN;
    if (validCount > 0) {
      const sumRate = validStudents.reduce((acc, s) => acc + (isNaN(s.totalCorrectRate) ? 0 : s.totalCorrectRate), 0);
      meanRate = SAAAMath.roundHalfUpFloat(sumRate / validCount, digits);
    }

    // 男女生答對率平均
    const maleStudents = validStudents.filter(s => s.sex === "男" || s.sex === 1 || s.sex === "1");
    const femaleStudents = validStudents.filter(s => s.sex === "女" || s.sex === 2 || s.sex === "2");
    const maleMean = maleStudents.length > 0
      ? SAAAMath.roundHalfUpFloat(maleStudents.reduce((acc, s) => acc + (isNaN(s.totalCorrectRate) ? 0 : s.totalCorrectRate), 0) / maleStudents.length, digits)
      : NaN;
    const femaleMean = femaleStudents.length > 0
      ? SAAAMath.roundHalfUpFloat(femaleStudents.reduce((acc, s) => acc + (isNaN(s.totalCorrectRate) ? 0 : s.totalCorrectRate), 0) / femaleStudents.length, digits)
      : NaN;

    // 各向度平均
    const dimMeans = {};
    uniqueDimensions.forEach(dim => {
      if (validCount > 0) {
        const sumDim = validStudents.reduce((acc, s) => acc + (s.dimScores && !isNaN(s.dimScores[dim]) ? s.dimScores[dim] : 0), 0);
        dimMeans[dim] = SAAAMath.roundHalfUpFloat(sumDim / validCount, digits);
      } else {
        dimMeans[dim] = NaN;
      }
    });

    // 等級分佈 (精熟/基礎/待加強) - 僅在有設定精熟門檻時統計
    const hasLevel = validStudents.some(s => s.level !== null);
    let masteryCount = 0, basicCount = 0, needyCount = 0;
    if (hasLevel) {
      validStudents.forEach(s => {
        if (s.level === "精熟") masteryCount++;
        else if (s.level === "基礎") basicCount++;
        else if (s.level === "待加強") needyCount++;
      });
    }

    const masteryRate = (hasLevel && validCount > 0) ? SAAAMath.roundHalfUpRatio(masteryCount, validCount, digits) : null;
    const basicRate = (hasLevel && validCount > 0) ? SAAAMath.roundHalfUpRatio(basicCount, validCount, digits) : null;
    const needyRate = (hasLevel && validCount > 0) ? SAAAMath.roundHalfUpRatio(needyCount, validCount, digits) : null;

    return {
      totalCount,
      validCount,
      absentCount,
      specialCount,
      meanRate,
      maleMean,
      femaleMean,
      dimMeans,
      hasLevel,
      masteryCount,
      basicCount,
      needyCount,
      masteryRate,
      basicRate,
      needyRate
    };
  }

  /**
   * 1. 縣市平均總表 (支援 2 位小數)
   */
  static buildCountySummary(students, uniqueDimensions = [], digits = 2) {
    const stats = this.computeGroupStats(students, uniqueDimensions, digits);
    const row = {
      縣市: students[0]?.city || "桃園市",
      總學生數: stats.totalCount,
      到考數: stats.validCount,
      缺考數: stats.absentCount,
      特殊生數: stats.specialCount,
      總平均答對率: isNaN(stats.meanRate) ? "-" : stats.meanRate,
      男生總答對率: isNaN(stats.maleMean) ? "-" : stats.maleMean,
      女生總答對率: isNaN(stats.femaleMean) ? "-" : stats.femaleMean
    };
    if (stats.hasLevel) {
      row["精熟人數"] = stats.masteryCount;
      row["精熟率"] = stats.masteryRate;
      row["基礎人數"] = stats.basicCount;
      row["基礎率"] = stats.basicRate;
      row["待加強人數"] = stats.needyCount;
      row["待加強率"] = stats.needyRate;
    }
    uniqueDimensions.forEach(dim => {
      row[`${dim}_答對率`] = isNaN(stats.dimMeans[dim]) ? "-" : stats.dimMeans[dim];
    });
    return [row];
  }

  /**
   * 2. 各校平均總表 (支援 2 位小數)
   */
  static buildSchoolSummary(students, uniqueDimensions = [], digits = 2) {
    const schoolMap = new Map();
    students.forEach(s => {
      const code = s.schoolCode || "未知學校";
      if (!schoolMap.has(code)) {
        schoolMap.set(code, {
          schoolCode: code,
          schoolName: s.schoolName || "",
          district: s.district || "",
          students: []
        });
      }
      schoolMap.get(code).students.push(s);
    });

    const rows = [];
    schoolMap.forEach(group => {
      const stats = this.computeGroupStats(group.students, uniqueDimensions, digits);
      const row = {
        學校代碼: group.schoolCode,
        學校名稱: group.schoolName,
        鄉鎮區: group.district,
        總學生數: stats.totalCount,
        到考數: stats.validCount,
        缺考數: stats.absentCount,
        特殊生數: stats.specialCount,
        總平均答對率: isNaN(stats.meanRate) ? "-" : stats.meanRate
      };
      if (stats.hasLevel) {
        row["精熟率"] = stats.masteryRate;
        row["基礎率"] = stats.basicRate;
        row["待加強率"] = stats.needyRate;
      }
      uniqueDimensions.forEach(dim => {
        row[`${dim}_答對率`] = isNaN(stats.dimMeans[dim]) ? "-" : stats.dimMeans[dim];
      });
      rows.push(row);
    });

    return rows.sort((a, b) => a.學校代碼.localeCompare(b.學校代碼));
  }

  /**
   * 3. 各班平均總表 (支援 2 位小數)
   */
  static buildClassSummary(students, uniqueDimensions = [], digits = 2) {
    const classMap = new Map();
    students.forEach(s => {
      const key = `${s.schoolCode}_${s.classCode}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          schoolCode: s.schoolCode,
          schoolName: s.schoolName,
          classCode: s.classCode,
          students: []
        });
      }
      classMap.get(key).students.push(s);
    });

    const rows = [];
    classMap.forEach(group => {
      const stats = this.computeGroupStats(group.students, uniqueDimensions, digits);
      const row = {
        學校代碼: group.schoolCode,
        學校名稱: group.schoolName,
        班級代碼: group.classCode,
        總學生數: stats.totalCount,
        到考數: stats.validCount,
        缺考數: stats.absentCount,
        特殊生數: stats.specialCount,
        總平均答對率: isNaN(stats.meanRate) ? "-" : stats.meanRate
      };
      if (stats.hasLevel) {
        row["精熟率"] = stats.masteryRate;
        row["基礎率"] = stats.basicRate;
        row["待加強率"] = stats.needyRate;
      }
      uniqueDimensions.forEach(dim => {
        row[`${dim}_答對率`] = isNaN(stats.dimMeans[dim]) ? "-" : stats.dimMeans[dim];
      });
      rows.push(row);
    });

    return rows.sort((a, b) => a.學校代碼.localeCompare(b.學校代碼) || String(a.班級代碼).localeCompare(String(b.班級代碼)));
  }

  /**
   * 4. 縣市區域平均總表 (支援 2 位小數)
   */
  static buildRegionSummary(students, uniqueDimensions = [], digits = 2) {
    const regionMap = new Map();
    students.forEach(s => {
      const dist = s.district || "未知區域";
      if (!regionMap.has(dist)) {
        regionMap.set(dist, []);
      }
      regionMap.get(dist).push(s);
    });

    const rows = [];
    regionMap.forEach((grpStudents, dist) => {
      const stats = this.computeGroupStats(grpStudents, uniqueDimensions, digits);
      const row = {
        鄉鎮區: dist,
        總學生數: stats.totalCount,
        到考數: stats.validCount,
        總平均答對率: isNaN(stats.meanRate) ? "-" : stats.meanRate
      };
      if (stats.hasLevel) {
        row["精熟率"] = stats.masteryRate;
        row["基礎率"] = stats.basicRate;
        row["待加強率"] = stats.needyRate;
      }
      uniqueDimensions.forEach(dim => {
        row[`${dim}_答對率`] = isNaN(stats.dimMeans[dim]) ? "-" : stats.dimMeans[dim];
      });
      rows.push(row);
    });

    return rows.sort((a, b) => a.鄉鎮區.localeCompare(b.鄉鎮區));
  }

  /**
   * 5. 不同家庭背景平均總表 (支援 2 位小數)
   */
  static buildFamilySummary(students, uniqueDimensions = [], digits = 2) {
    const familyMap = new Map();
    const categories = ["一般生", "原住民子女", "新住民子女", "原且新住民子女"];
    categories.forEach(c => familyMap.set(c, []));

    students.forEach(s => {
      const type = s.familyType || "一般生";
      if (!familyMap.has(type)) familyMap.set(type, []);
      familyMap.get(type).push(s);
    });

    const rows = [];
    familyMap.forEach((grpStudents, type) => {
      const stats = this.computeGroupStats(grpStudents, uniqueDimensions, digits);
      const row = {
        身分別: type,
        總學生數: stats.totalCount,
        到考數: stats.validCount,
        總平均答對率: isNaN(stats.meanRate) ? "-" : stats.meanRate
      };
      if (stats.hasLevel) {
        row["精熟率"] = stats.masteryRate;
        row["基礎率"] = stats.basicRate;
        row["待加強率"] = stats.needyRate;
      }
      uniqueDimensions.forEach(dim => {
        row[`${dim}_答對率`] = isNaN(stats.dimMeans[dim]) ? "-" : stats.dimMeans[dim];
      });
      rows.push(row);
    });

    return rows;
  }

  /**
   * 6. 缺考名單總表
   */
  static buildAbsentList(students) {
    return students
      .filter(s => s.absentFlag)
      .map(s => ({
        總流水號: s.id,
        縣市流水號: s.countyId,
        學校名稱: s.schoolName,
        班級代碼: s.classCode,
        座號: s.seatNo,
        姓名: s.name,
        缺考標記: "缺考"
      }));
  }

  // =========================================================================
  // 🌟 併表等級描述報表引擎 (對齊 R/40_summaries.R build_combined_level_description_table)
  // 同時呈現【扣除特殊生】與【含特殊生】兩大分組體系之三等級精準統計
  // =========================================================================

  /**
   * 內部通用聚合器：針對指定 key 生成等級描述總表
   */
  static buildCombinedLevelTable(students, groupKeyFn, groupFields = ["分組標籤"], digits = 2) {
    if (!students || students.length === 0 || !students.some(s => s.level !== null)) {
      return [];
    }

    // 依 groupKey 分組
    const map = new Map();

    students.forEach(s => {
      const key = groupKeyFn(s);
      if (!map.has(key)) {
        map.set(key, {
          fields: s,
          validMinusSpecial: [],
          allValid: []
        });
      }
      const entry = map.get(key);
      if (!s.absentFlag) {
        entry.allValid.push(s);
        if (!s.isSpecial123) {
          entry.validMinusSpecial.push(s);
        }
      }
    });

    const rows = [];
    map.forEach(entry => {
      const vms = entry.validMinusSpecial;
      const av = entry.allValid;

      // A. 扣除特殊生
      const nVms = vms.length;
      let sumRateVms = 0;
      let mCntVms = 0, bCntVms = 0, iCntVms = 0;
      vms.forEach(s => {
        sumRateVms += isNaN(s.totalCorrectRate) ? 0 : s.totalCorrectRate;
        if (s.level === "精熟") mCntVms++;
        else if (s.level === "基礎") bCntVms++;
        else if (s.level === "待加強") iCntVms++;
      });
      const meanVms = nVms > 0 ? SAAAMath.roundHalfUpFloat(sumRateVms / nVms, digits) : NaN;
      const mRateVms = nVms > 0 ? SAAAMath.roundHalfUpRatio(mCntVms * 100, nVms, digits) : 0;
      const bRateVms = nVms > 0 ? SAAAMath.roundHalfUpRatio(bCntVms * 100, nVms, digits) : 0;
      const iRateVms = nVms > 0 ? SAAAMath.roundHalfUpRatio(iCntVms * 100, nVms, digits) : 0;

      // B. 含特殊生
      const nAv = av.length;
      let sumRateAv = 0;
      let mCntAv = 0, bCntAv = 0, iCntAv = 0;
      av.forEach(s => {
        sumRateAv += isNaN(s.totalCorrectRate) ? 0 : s.totalCorrectRate;
        if (s.level === "精熟") mCntAv++;
        else if (s.level === "基礎") bCntAv++;
        else if (s.level === "待加強") iCntAv++;
      });
      const meanAv = nAv > 0 ? SAAAMath.roundHalfUpFloat(sumRateAv / nAv, digits) : NaN;
      const mRateAv = nAv > 0 ? SAAAMath.roundHalfUpRatio(mCntAv * 100, nAv, digits) : 0;
      const bRateAv = nAv > 0 ? SAAAMath.roundHalfUpRatio(bCntAv * 100, nAv, digits) : 0;
      const iRateAv = nAv > 0 ? SAAAMath.roundHalfUpRatio(iCntAv * 100, nAv, digits) : 0;

      const row = {};
      groupFields.forEach(f => {
        row[f] = entry.fields[f] || entry.fields[f.toLowerCase()] || (f === "縣市" ? "桃園市" : "");
      });

      row["到考人數(扣除特殊生)"] = nVms;
      row["總答對率(扣除特殊生)"] = isNaN(meanVms) ? "-" : meanVms.toFixed(digits);
      row["精熟人數(扣除特殊生)"] = mCntVms;
      row["精熟率(%)(扣除特殊生)"] = mRateVms.toFixed(digits) + "%";
      row["基礎人數(扣除特殊生)"] = bCntVms;
      row["基礎率(%)(扣除特殊生)"] = bRateVms.toFixed(digits) + "%";
      row["待加強人數(扣除特殊生)"] = iCntVms;
      row["待加強率(%)(扣除特殊生)"] = iRateVms.toFixed(digits) + "%";

      row["到考人數(含特殊生)"] = nAv;
      row["總答對率(含特殊生)"] = isNaN(meanAv) ? "-" : meanAv.toFixed(digits);
      row["精熟人數(含特殊生)"] = mCntAv;
      row["精熟率(%)(含特殊生)"] = mRateAv.toFixed(digits) + "%";
      row["基礎人數(含特殊生)"] = bCntAv;
      row["基礎率(%)(含特殊生)"] = bRateAv.toFixed(digits) + "%";
      row["待加強人數(含特殊生)"] = iCntAv;
      row["待加強率(%)(含特殊生)"] = iRateAv.toFixed(digits) + "%";

      rows.push(row);
    });

    return rows;
  }

  /**
   * 7. 縣市平均（等級描述）
   */
  static buildCountyLevelSummary(students, digits = 2) {
    return this.buildCombinedLevelTable(
      students,
      s => s.city || "桃園市",
      ["縣市"],
      digits
    );
  }

  /**
   * 8. 各校平均（等級描述）
   */
  static buildSchoolLevelSummary(students, digits = 2) {
    const res = this.buildCombinedLevelTable(
      students,
      s => s.schoolCode || "未知學校",
      ["學校代碼", "學校名稱"],
      digits
    );
    return res.sort((a, b) => String(a.學校代碼).localeCompare(String(b.學校代碼)));
  }

  /**
   * 9. 各班平均（等級描述）
   */
  static buildClassLevelSummary(students, digits = 2) {
    const res = this.buildCombinedLevelTable(
      students,
      s => `${s.schoolCode}_${s.classCode}`,
      ["學校代碼", "學校名稱", "班級代碼"],
      digits
    );
    return res.sort((a, b) => String(a.學校代碼).localeCompare(String(b.學校代碼)) || String(a.班級代碼).localeCompare(String(b.班級代碼)));
  }

  /**
   * 10. 縣市區域平均（等級描述）
   */
  static buildRegionLevelSummary(students, digits = 2) {
    const res = this.buildCombinedLevelTable(
      students,
      s => s.district || "未知區域",
      ["縣市", "鄉鎮區"],
      digits
    );
    return res.sort((a, b) => String(a.鄉鎮區).localeCompare(String(b.鄉鎮區)));
  }

  /**
   * 11. 不同家庭背景平均（等級描述）
   */
  static buildFamilyLevelSummary(students, digits = 2) {
    return this.buildCombinedLevelTable(
      students,
      s => s.familyType || "一般生",
      ["縣市", "身分別"],
      digits
    );
  }

  /**
   * 12. 總平均（等級描述）
   */
  static buildTotalLevelSummary(students, digits = 2) {
    return this.buildCombinedLevelTable(
      students,
      () => "全體",
      ["考區"],
      digits
    );
  }

  /**
   * 13. 個人成績表（含全體排名、全體PR、縣市排名、縣市PR、精熟等級、答對題數）
   * 嚴格比照 R/40_summaries.R 之 calculate_ranked_outputs
   */
  static buildRankedStudentScores(students, uniqueDimensions = [], digits = 2) {
    const nonAbsent = students.filter(s => !s.absentFlag);
    const nTotalNonAbsent = nonAbsent.length;
    const hasLevel = students.some(s => s.level !== null);

    // 全體排名：由高到低，同分取最大排名 (ties.method="max")
    const sortedScores = [...nonAbsent].sort((a, b) => b.totalCorrectRate - a.totalCorrectRate);
    const scoreRankMap = new Map();
    sortedScores.forEach((s, idx) => {
      if (!scoreRankMap.has(s.totalCorrectRate)) {
        // 在由大到小的降冪排序中，第 idx 位是該同分群在升冪排序（由小到大）中的最高順位
        // 對應 R 語言: r_all <- rank(scores, ties.method="max") => nTotalNonAbsent - idx
        // 名次為 idx + 1 (滿分同分群皆為第 1 名)
        const rankAscending = nTotalNonAbsent - idx;
        const rankDescending = idx + 1;
        const pr = Math.floor(((rankAscending - 1) / nTotalNonAbsent) * 100);
        scoreRankMap.set(s.totalCorrectRate, { rank: rankDescending, pr });
      }
    });

    return students.map(s => {
      const isAbsent = s.absentFlag;
      const rankInfo = (!isAbsent && scoreRankMap.has(s.totalCorrectRate))
        ? scoreRankMap.get(s.totalCorrectRate)
        : { rank: "-", pr: "-" };

      const row = {
        總流水號: s.id,
        縣市流水號: s.countyId,
        縣市: s.city,
        鄉鎮區: s.district,
        學校代碼: s.schoolCode,
        學校名稱: s.schoolName,
        班級代碼: s.classCode,
        座號: s.seatNo,
        姓名: s.name,
        總答對率: isAbsent ? "缺考" : (s.totalCorrectRate !== undefined ? s.totalCorrectRate.toFixed(digits) : "-"),
        答對題數: isAbsent ? "缺考" : (s.totalCorrectCount !== null && s.totalCorrectCount !== undefined ? s.totalCorrectCount : "-")
      };

      if (hasLevel) {
        row["等級"] = isAbsent ? "缺考" : (s.level || "待加強");
      }

      row["全體排名"] = isAbsent ? "-" : rankInfo.rank;
      row["全體PR"] = isAbsent ? "-" : rankInfo.pr;
      row["缺考"] = s.absentFlag ? "1" : "0";
      row["特殊生"] = s.isSpecial123 ? "1" : "0";
      row["身分別"] = s.familyType;

      uniqueDimensions.forEach(dim => {
        row[`${dim}_答對率`] = isAbsent ? "缺考" : (s.dimScores && !isNaN(s.dimScores[dim]) ? s.dimScores[dim].toFixed(digits) : "-");
        row[`${dim}_題數`] = isAbsent ? "缺考" : (s.dimCounts && !isNaN(s.dimCounts[dim]) ? s.dimCounts[dim] : "-");
      });

      return row;
    });
  }

  /**
   * 14. 全體名單成績表 (簡版相容輸出)
   */
  static buildOverallScores(students, uniqueDimensions = [], digits = 2) {
    return this.buildRankedStudentScores(students, uniqueDimensions, digits);
  }
}

export default SummaryEngine;
export { SummaryEngine };

