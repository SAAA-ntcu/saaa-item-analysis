/**
 * SAAA 常數定義與全域設定 (SAAA Constants)
 * 對齊 SAAA-item/R/00_constants.R
 */

export const SUBJECT_NAMES = {
  C: "國語",
  E: "英語",
  M: "數學",
  S: "自然"
};

export const LEVEL_NAMES = ["精熟", "基礎", "待加強"];

export const CITY_CODE_MAP = {
  "基隆市": "C",
  "台北市": "A", "臺北市": "A",
  "新北市": "F", "臺北縣": "F", "台北縣": "F",
  "桃園市": "H", "桃園縣": "H",
  "新竹市": "O", "新竹縣": "J",
  "苗栗縣": "K",
  "台中市": "B", "臺中市": "B", "台中縣": "L", "臺中縣": "L",
  "彰化縣": "N", "南投縣": "M", "雲林縣": "P",
  "嘉義市": "I", "嘉義縣": "Q",
  "台南市": "D", "臺南市": "D", "台南縣": "R", "臺南縣": "R",
  "高雄市": "E", "高雄縣": "S",
  "屏東縣": "T",
  "台東縣": "V", "臺東縣": "V",
  "花蓮縣": "U", "宜蘭縣": "G",
  "澎湖縣": "X", "金門縣": "W", "連江縣": "Z", "陽明山": "Y"
};

export function generateCountyId(year, cityName, volume, serialNumber) {
  const cityCode = CITY_CODE_MAP[cityName] || "X";
  const serialFormatted = String(serialNumber).padStart(6, "0");
  return `${year}_${cityCode}_${volume}_${serialFormatted}`;
}

export const GRADE_TO_CHINESE = {
  "3": "三年級",
  "4": "四年級",
  "5": "五年級",
  "6": "六年級",
  "7": "七年級",
  "7n": "七年級新生",
  "7N": "七年級新生",
  "8": "八年級"
};

export const N_INFO_COLUMNS = 23;

export const DEFAULT_INFO_COLUMNS = {
  id: 1,
  county_id: 2,
  city: 3,
  district: 4,
  school_code: 5,
  school_name: 6,
  class_code: 10,
  seat_no: 12,
  student_name: 13,
  sex: 14,
  teacher: 16,
  gifted: 17,
  special: 18,
  aboriginal: 19,
  immigrant: 20,
  arts: 21,
  sports: 22,
  non_school: 23
};

export const INFO_COLUMN_ALIASES = {
  id: ["總流水號", "流水號", "學生流水號"],
  county_id: ["縣市流水號"],
  city: ["縣市", "縣市名稱"],
  district: ["鄉鎮區", "鄉鎮市區", "鄉鎮區名稱", "學校所屬區域(鄉鎮區)"],
  school_code: ["學校代碼", "學校編號"],
  school_name: ["學校名稱", "校名"],
  class_code: ["班級代碼", "班級編號", "班級"],
  seat_no: ["座號"],
  student_name: ["姓名", "學生姓名"],
  sex: ["性別", "性別代碼"],
  teacher: ["導師", "導師姓名"],
  gifted: ["資賦優異", "資優生"],
  special: ["特殊生", "特殊生註記", "特殊生（成績不列入平均）"],
  aboriginal: ["原住民子女", "原住民子女註記"],
  immigrant: ["新住民子女", "新住民子女註記"],
  arts: ["藝才班學生", "藝術才能班學生"],
  sports: ["體育班學生"],
  non_school: ["非學校型態實驗教育者", "非學校型態實驗教育", "在家教育", "非學校型態實驗教育者(在家教育)"]
};

// Excel 官方規格樣式常數
export const EXCEL_STYLES = {
  FONT_FAMILY: "Microsoft JhengHei",
  COLOR_GREEN: "FFE2EFDA",      // 表頭綠底
  COLOR_KEY_YELLOW: "FFFFF2CC", // 正確答案淡黃底
  COLOR_WARN_YELLOW: "FFFFFF00",// 高分組誘答警示黃底
  COLOR_WARN_GREY: "FFD9D9D9",  // 全體誘答警示灰底
  COLOR_RED: "FFFF0000",        // 低鑑別度紅字
  BORDER_THIN: {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } }
  }
};

export default {
  SUBJECT_NAMES,
  LEVEL_NAMES,
  CITY_CODE_MAP,
  generateCountyId,
  GRADE_TO_CHINESE,
  N_INFO_COLUMNS,
  DEFAULT_INFO_COLUMNS,
  INFO_COLUMN_ALIASES,
  EXCEL_STYLES
};
