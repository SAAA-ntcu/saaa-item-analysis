/**
 * SAAA 心理計量數學核心與四捨五入算法 (SAAAMath)
 * 以 BigInt 純整數算術消除二進位浮點微差與二度進位錯誤，嚴格對齊 114M3+1A.R 鐵律公式。
 */

class SAAAMath {
  /**
   * 【純整數算術四捨五入 (Pure Integer Arithmetic)】
   * 公式：(2 * 10^digits * |k| + |n|) // (2 * |n|)
   * 內建正負號獨立保護 (abs & sign)，徹底消滅小數點浮點雜訊。
   */
  static roundHalfUpRatio(k, n, digits = 2) {
    if (n === 0) return 0.0;
    const sign = (k >= 0) === (n >= 0) ? 1 : -1;
    const kAbs = BigInt(Math.abs(Math.round(k)));
    const nAbs = BigInt(Math.abs(Math.round(n)));
    const factor = BigInt(10 ** digits);
    const roundedInt = (2n * factor * kAbs + nAbs) / (2n * nAbs);
    return sign * (Number(roundedInt) / (10 ** digits));
  }

  /**
   * 連續數值四捨五入 (遇 5 必進)
   * 補上 1e-12 避免 0.425 * 100 = 42.49999999999999 之浮點數偏差
   */
  static roundHalfUpFloat(val, digits = 2) {
    if (val === null || val === undefined || isNaN(val)) return NaN;
    const factor = 10 ** digits;
    const sign = val >= 0 ? 1 : -1;
    return sign * (Math.floor(Math.abs(val) * factor + 0.5 + 1e-12) / factor);
  }

  /**
   * 計算 Cronbach's Alpha 全卷信度 (無偏樣本變異數 ddof = 1)
   */
  static calculateCronbachAlpha(scoredMatrix, nValid, nItems) {
    if (!scoredMatrix || nValid < 2 || nItems < 2) return NaN;

    let itemVarSum = 0;
    const totalScores = new Float64Array(nValid);

    for (let j = 0; j < nItems; j++) {
      let sum = 0;
      let sumSq = 0;
      for (let i = 0; i < nValid; i++) {
        const val = scoredMatrix[i][j];
        sum += val;
        sumSq += val * val;
        totalScores[i] += val;
      }
      const itemVar = (sumSq - (sum * sum) / nValid) / (nValid - 1);
      itemVarSum += itemVar;
    }

    let totSum = 0;
    let totSumSq = 0;
    for (let i = 0; i < nValid; i++) {
      const s = totalScores[i];
      totSum += s;
      totSumSq += s * s;
    }
    const totalVar = (totSumSq - (totSum * totSum) / nValid) / (nValid - 1);

    if (totalVar <= 0) return NaN;
    return (nItems / (nItems - 1)) * (1 - itemVarSum / totalVar);
  }

  /**
   * 計算點二系列相關 (Point-Biserial Correlation)
   */
  static calculatePointBiserial(selectionArray, totalScores, nValid) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < nValid; i++) {
      const x = selectionArray[i] ? 1 : 0;
      const y = totalScores[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }
    const numerator = nValid * sumXY - sumX * sumY;
    const denominator = Math.sqrt((nValid * sumX2 - sumX * sumX) * (nValid * sumY2 - sumY * sumY));
    if (denominator === 0 || isNaN(denominator)) return NaN;
    return numerator / denominator;
  }

  /**
   * 動態計算高低中分組門檻與人數比例 (114 鐵律公式)
   */
  static getCTTGroups(totalScores, groupRatio = 0.27, defineGroups = null) {
    const n = totalScores.length;
    const sortedScores = Float64Array.from(totalScores).sort();

    let hnRatio, lowRatio, midRatio, highRatio;
    let highThreshold, lowThreshold;

    if (!defineGroups) {
      const x = Math.max(1, Math.round(n * groupRatio));
      highThreshold = sortedScores[n - x];
      
      let hn = 0;
      for (let i = 0; i < n; i++) {
        if (totalScores[i] >= highThreshold) hn++;
      }
      hnRatio = this.roundHalfUpFloat(hn / n, 2);

      lowRatio = groupRatio;
      midRatio = this.roundHalfUpFloat(1.0 - hnRatio - groupRatio - 0.01, 4);
      highRatio = this.roundHalfUpFloat(hnRatio + 0.01, 4);
      defineGroups = [lowRatio, midRatio, highRatio];
    } else {
      [lowRatio, midRatio, highRatio] = defineGroups;
      hnRatio = this.roundHalfUpFloat(highRatio - 0.01, 2);
      const x = Math.max(1, Math.round(n * lowRatio));
      highThreshold = sortedScores[n - x];
    }

    const quantMaker1 = defineGroups[0] + defineGroups[1];
    const midPct = Math.trunc(100 * quantMaker1);
    const midColName = `mid${midPct}`;

    const lowCutoffIdx = Math.max(1, Math.round(n * defineGroups[0]));
    lowThreshold = sortedScores[lowCutoffIdx - 1];

    const lowerMask = new Uint8Array(n);
    const upperMask = new Uint8Array(n);
    const midMask = new Uint8Array(n);

    let nLower = 0, nUpper = 0, nMid = 0;
    for (let i = 0; i < n; i++) {
      const s = totalScores[i];
      if (s <= lowThreshold) {
        lowerMask[i] = 1;
        nLower++;
      }
      if (s >= highThreshold) {
        upperMask[i] = 1;
        nUpper++;
      }
      if (!lowerMask[i] && !upperMask[i]) {
        midMask[i] = 1;
        nMid++;
      }
    }

    return {
      lowerMask,
      midMask,
      upperMask,
      nLower,
      nMid,
      nUpper,
      midColName,
      lowThreshold,
      highThreshold,
      actualLowerPct: nLower / n,
      actualUpperPct: nUpper / n,
      actualMidPct: nMid / n,
      defineGroups,
      hnRatio
    };
  }
}

export default SAAAMath;
export { SAAAMath };

