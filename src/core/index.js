/**
 * SAAA 試題分析與成績計算系統 (JavaScript 模組入口)
 */

import constants from "./constants.js";
import SAAAMath from "./math.js";
import ScoringEngine from "./scoring.js";
import SummaryEngine from "./summaries.js";
import CTTAnalyzer from "./ctt.js";
import ExcelExporter from "./exporter.js";

export {
  constants,
  SAAAMath,
  ScoringEngine,
  SummaryEngine,
  CTTAnalyzer,
  ExcelExporter
};

export default {
  ...constants,
  SAAAMath,
  ScoringEngine,
  SummaryEngine,
  CTTAnalyzer,
  ExcelExporter
};
