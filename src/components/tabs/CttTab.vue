<template>
  <div class="space-y-5">
    <!-- Upload & Setup Card -->
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <svg class="w-5 h-5 text-[#52796f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            試題分析 (Classical Test Theory)
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">
            全卷通過率 ｜ 難度指數 ｜ 鑑別度 (D) ｜ 雙系列相關 ｜ 誘答力品質診斷 ｜ 0.00 規範
          </p>
        </div>
      </div>

      <!-- Alert Notice -->
      <div class="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs text-amber-900 mb-4">
        <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>依規範：精熟等級需手動輸入題數門檻，無設定則純粹分析試題；極端組固定為 Kelley 27% 鐵律。</span>
      </div>

      <!-- Dropzone Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Answer Dropzone -->
        <div
          class="border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative"
          :class="ansFile ? 'border-[#52796f] bg-[#edf2ee]' : 'border-[#52796f]/40 hover:border-[#52796f] bg-[#f4f7f5]/70 hover:bg-[#edf2ee]'"
          @dragover.prevent
          @drop.prevent="handleDrop($event, 'ans')"
        >
          <input type="file" accept=".xlsx,.xls,.csv" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileSelect($event, 'ans')" />
          <div class="text-3xl mb-1.5">🔑</div>
          <div class="text-xs sm:text-sm font-bold text-[#354f52]">
            {{ ansFile ? `已選擇答案檔：${ansFile.name}` : '拖曳或選取【答案檔】(.xlsx / .csv)' }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">支援橫向題號格式、縱向單科或多科格式</div>
          <div v-if="ansFile" class="mt-2 text-xs font-bold text-[#52796f]">✅ 檔案已載入 ({{ (ansFile.size / 1024).toFixed(1) }} KB)</div>
        </div>

        <!-- Response Dropzone -->
        <div
          class="border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative"
          :class="respFile ? 'border-[#52796f] bg-[#edf2ee]' : 'border-[#52796f]/40 hover:border-[#52796f] bg-[#f4f7f5]/70 hover:bg-[#edf2ee]'"
          @dragover.prevent
          @drop.prevent="handleDrop($event, 'resp')"
        >
          <input type="file" accept=".xlsx,.xls,.csv" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileSelect($event, 'resp')" />
          <div class="text-3xl mb-1.5">📝</div>
          <div class="text-xs sm:text-sm font-bold text-[#354f52]">
            {{ respFile ? `已選擇作答檔：${respFile.name}` : '拖曳或選取【作答檔 / 有效樣本】(.xlsx)' }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">自動排除缺考與無效，提取 item 1 ~ N 學生作答</div>
          <div v-if="respFile" class="mt-2 text-xs font-bold text-[#52796f]">✅ 檔案已載入 ({{ (respFile.size / 1024).toFixed(1) }} KB)</div>
        </div>
      </div>

      <!-- Parameters Bar -->
      <div class="flex flex-wrap items-center gap-3.5 mb-3">
        <!-- Subject -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">測驗考科</label>
          <select v-model="subject" class="h-9 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#52796f] focus:ring-2 focus:ring-[#52796f]/20 transition">
            <option value="C">國語文 (C)</option>
            <option value="M">數學 (M)</option>
            <option value="E">英語 (E)</option>
            <option value="S">自然 (S)</option>
          </select>
        </div>

        <!-- Grade (Positive order strictly: 3 4 5 6 7 7n 8) -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">測驗年級 (正序)</label>
          <select v-model="grade" class="h-9 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#52796f] focus:ring-2 focus:ring-[#52796f]/20 transition">
            <option value="3">3 年級</option>
            <option value="4">4 年級</option>
            <option value="5">5 年級</option>
            <option value="6">6 年級</option>
            <option value="7">7 年級</option>
            <option value="7n">7n (七年級新生)</option>
            <option value="8">8 年級</option>
          </select>
        </div>

        <!-- Enable Level Checkbox -->
        <div class="flex items-center gap-2 pt-5">
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#354f52]">
            <input type="checkbox" v-model="enableLevel" class="w-4 h-4 rounded text-[#52796f] focus:ring-[#52796f]" />
            <span>計算精熟等級 (手動門檻)</span>
          </label>
        </div>

        <!-- Mastery Cutoff -->
        <div v-if="enableLevel" class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">精熟門檻題數 (≥ 此題數)</label>
          <input
            type="number"
            v-model.number="masteryCutoff"
            placeholder="如 23"
            min="1"
            class="h-9 px-3 w-28 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#52796f] focus:ring-2 focus:ring-[#52796f]/20 transition"
          />
        </div>

        <!-- Basic Cutoff -->
        <div v-if="enableLevel" class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">基礎門檻題數 (≥ 此題數)</label>
          <input
            type="number"
            v-model.number="basicCutoff"
            placeholder="如 15"
            min="1"
            class="h-9 px-3 w-28 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#52796f] focus:ring-2 focus:ring-[#52796f]/20 transition"
          />
        </div>

        <!-- Start Button -->
        <div class="pt-5 ml-auto">
          <button
            type="button"
            @click="runAnalysis"
            :disabled="isRunning"
            class="h-9 px-5 bg-[#52796f] hover:bg-[#354f52] disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>⚡ 開始 CTT 試題分析</span>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="isRunning" class="mt-3">
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#52796f] to-[#7ea172] transition-all duration-300" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 mt-1">
          <span>{{ progressMsg }}</span>
          <span>{{ progressPct }}%</span>
        </div>
      </div>
    </div>

    <!-- Dashboard Results Card -->
    <div v-if="analyzer" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            📈 試題分析品質總表與三等級分佈
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">全數值四捨五入至小數後 2 位 (0.00) ｜ 100% 精準對齊 R 語言</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="exportOfficialWorkbook"
            class="h-8 px-3 bg-[#52796f] hover:bg-[#354f52] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            📥 匯出官方雙層總表與等級分析 (.xlsx)
          </button>
          <button
            type="button"
            @click="exportClassicWorkbook"
            class="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            📥 匯出 R 經典格式檔 (.xlsx)
          </button>
        </div>
      </div>

      <!-- Stats Cards Matrix -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">有效人數 (N)</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ analyzer.nValid.toLocaleString() }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">測驗總題數</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ analyzer.nItems }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cronbach's α</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ isNaN(analyzer.alpha) ? '-' : analyzer.alpha.toFixed(4) }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">平均通過率 P</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ analyzer.avgPassRate.toFixed(2) }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">平均鑑別度 D</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ analyzer.avgDiscrimination.toFixed(2) }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#52796f]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">中分組標籤</div>
          <div class="text-lg font-black text-[#52796f] mt-1">{{ analyzer.midColName }}</div>
        </div>

        <!-- Level Stats (when enabled) -->
        <template v-if="analyzer.calcLevel && analyzer.levelStats">
          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-emerald-500">
            <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">精熟人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ analyzer.levelStats.masteryCount.toLocaleString() }} ({{ analyzer.levelStats.masteryPct }})</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-amber-500">
            <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">基礎人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ analyzer.levelStats.basicCount.toLocaleString() }} ({{ analyzer.levelStats.basicPct }})</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-rose-500">
            <div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider">待加強人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ analyzer.levelStats.needyCount.toLocaleString() }} ({{ analyzer.levelStats.needyPct }})</div>
          </div>
        </template>
      </div>

      <!-- Trend Chart Component -->
      <ItemTrendChart :items-data="analyzer.itemsData" />

      <!-- Subtabs -->
      <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4">
        <button
          type="button"
          @click="activeSubtab = 'summary'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          :class="activeSubtab === 'summary' ? 'bg-[#52796f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
        >
          逐題摘要表 (含誘答與建議)
        </button>
        <button
          v-if="analyzer.calcLevel"
          type="button"
          @click="activeSubtab = 'level'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          :class="activeSubtab === 'level' ? 'bg-[#52796f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
        >
          縣市三等級試題分析 (6組選答率矩陣)
        </button>
      </div>

      <!-- Summary Table -->
      <div v-show="activeSubtab === 'summary'" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">題號</th>
              <th class="p-2.5">正確答案</th>
              <th class="p-2.5">通過率 (P)</th>
              <th class="p-2.5">鑑別度 (D)</th>
              <th class="p-2.5">雙系列 (pBis)</th>
              <th class="p-2.5">低分組</th>
              <th class="p-2.5">中分組 ({{ analyzer.midColName }})</th>
              <th class="p-2.5">高分組</th>
              <th class="p-2.5">難度 (Index)</th>
              <th class="p-2.5">診斷建議</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in analyzer.itemsData" :key="it.item" class="border-b border-slate-100 hover:bg-[#f4f7f5] transition whitespace-nowrap">
              <td class="p-2.5 font-bold">{{ it.item }}</td>
              <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">{{ it.key }}</span></td>
              <td class="p-2.5 font-mono">{{ it.passRate.toFixed(2) }}</td>
              <td class="p-2.5 font-mono" :class="it.discrim < 0.20 ? 'text-rose-600 font-bold' : ''">{{ it.discrim.toFixed(2) }}</td>
              <td class="p-2.5 font-mono">{{ it.pBis }}</td>
              <td class="p-2.5 font-mono">{{ it.lower.toFixed(2) }}</td>
              <td class="p-2.5 font-mono">{{ it.mid.toFixed(2) }}</td>
              <td class="p-2.5 font-mono">{{ it.upper.toFixed(2) }}</td>
              <td class="p-2.5 font-mono">{{ it.difficulty.toFixed(2) }}</td>
              <td class="p-2.5">
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-bold"
                  :class="it.warning === '正常' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  {{ it.warning }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Level Selection Matrix Table -->
      <div v-show="activeSubtab === 'level' && analyzer.calcLevel" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">題號</th>
              <th class="p-2.5">鑑別度</th>
              <th class="p-2.5">答對率</th>
              <th class="p-2.5">正確答案</th>
              <template v-for="grp in ['全體', '精熟', '基礎', '待加強', '高分組', '低分組']" :key="grp">
                <th v-for="opt in [...analyzer.optLabels, '其它']" :key="grp + opt" class="p-2 text-center border-l border-slate-200">
                  {{ grp }}_{{ opt }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in analyzer.levelSummaryRows" :key="row.item" class="border-b border-slate-100 hover:bg-[#f4f7f5] transition whitespace-nowrap">
              <td class="p-2 font-bold">{{ row.item }}</td>
              <td class="p-2 font-mono">{{ row.discrim.toFixed(2) }}</td>
              <td class="p-2 font-mono">{{ row.passRate.toFixed(2) }}</td>
              <td class="p-2"><span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{{ row.key }}</span></td>
              <template v-for="grp in ['全體', '精熟', '基礎', '待加強', '高分組', '低分組']" :key="grp">
                <td
                  v-for="opt in [...analyzer.optLabels, '其它']"
                  :key="grp + opt"
                  class="p-2 text-center font-mono border-l border-slate-100"
                  :class="opt === row.key ? 'bg-amber-100/70 font-bold text-amber-900' : ''"
                >
                  {{ (row.rates[grp]?.[opt] ?? 0).toFixed(2) }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExcelJS from 'exceljs'
import CTTAnalyzer from '@/core/ctt.js'
import SAAAMath from '@/core/math.js'
import ItemTrendChart from './ItemTrendChart.vue'
import { triggerDownload } from '@/utils/download.js'

const emit = defineEmits(['log'])

const ansFile = ref(null)
const respFile = ref(null)
const subject = ref('C')
const grade = ref('7n')
const enableLevel = ref(false)
const masteryCutoff = ref(null)
const basicCutoff = ref(null)

const isRunning = ref(false)
const progressPct = ref(0)
const progressMsg = ref('')
const analyzer = ref(null)
const activeSubtab = ref('summary')

function handleFileSelect(event, type) {
  const file = event.target.files?.[0]
  if (!file) return
  if (type === 'ans') {
    ansFile.value = file
    emit('log', `[CTT] 已選擇答案檔: ${file.name}`)
  } else {
    respFile.value = file
    emit('log', `[CTT] 已選擇作答檔: ${file.name}`)
  }
}

function handleDrop(event, type) {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (type === 'ans') {
    ansFile.value = file
    emit('log', `[CTT] 拖曳載入答案檔: ${file.name}`)
  } else {
    respFile.value = file
    emit('log', `[CTT] 拖曳載入作答檔: ${file.name}`)
  }
}

function normalizeStr(v) {
  return v === null || v === undefined ? '' : String(v).trim()
}

function extractAnswersFromRows(rows, subjCode, grade) {
  if (!rows || rows.length === 0) return []
  const gStr = String(grade).toUpperCase()
  const targetCol = `${subjCode.toUpperCase()}${gStr}`
  const headerRow = rows[0].map(h => normalizeStr(h).toUpperCase())

  // 1. 縱向欄位匹配 (精確區隔 7 與 7N)
  let targetIdx = headerRow.findIndex(h => h === targetCol)
  if (targetIdx === -1) {
    if (gStr === '7N') {
      targetIdx = headerRow.findIndex(h => h === `${subjCode.toUpperCase()}7N` || h.includes('新生') || h.includes('七年級新生'))
    } else if (gStr === '7') {
      targetIdx = headerRow.findIndex(h => h === `${subjCode.toUpperCase()}7`)
    } else {
      targetIdx = headerRow.findIndex(h => h === targetCol || h.startsWith(targetCol))
    }
  }

  if (targetIdx !== -1 && rows.length >= 3) {
    const keys = []
    for (let r = 1; r < rows.length; r++) {
      const val = normalizeStr(rows[r][targetIdx]).toUpperCase()
      if (val && !/^(不予計分|不計分|此題不計分|無|送分|不採計|精熟|基礎)$/.test(val)) keys.push(val)
    }
    if (keys.length >= 3) return keys
  }

  // 2. 橫向題號列 1, 2, 3...
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r]
    const oneIdx = row.findIndex(c => c === 1 || c === '1' || c === 1.0)
    if (oneIdx !== -1 && row.length > oneIdx + 3) {
      const isItemRow = [2, 3, 4].every((exp, idx) => String(row[oneIdx + 1 + idx]).trim() === String(exp))
      if (isItemRow) {
        let ansRowIdx = -1
        for (let ar = 0; ar < rows.length; ar++) {
          if (ar !== r && rows[ar].some(cell => /答案/i.test(normalizeStr(cell)))) {
            ansRowIdx = ar
            break
          }
        }
        if (ansRowIdx === -1 && r + 1 < rows.length) ansRowIdx = r + 1
        if (ansRowIdx !== -1) {
          const keys = []
          const aRow = rows[ansRowIdx]
          for (let c = oneIdx; c < aRow.length; c++) {
            const val = normalizeStr(aRow[c]).toUpperCase()
            if (val && !/^(不予計分|不計分|此題不計分|無|送分|不採計)$/.test(val)) keys.push(val)
            else if (!val && c >= aRow.length - 2) break
          }
          if (keys.length >= 3) return keys
        }
      }
    }
  }

  // 3. 雙欄式 (答案欄)
  const ansColIdx = headerRow.findIndex(h => /答案|Key/i.test(h))
  if (ansColIdx !== -1 && rows.length >= 4) {
    const keys = []
    for (let r = 1; r < rows.length; r++) {
      const val = normalizeStr(rows[r][ansColIdx]).toUpperCase()
      if (val && !/^(不予計分|不計分|此題不計分|無|送分|不採計)$/.test(val)) keys.push(val)
    }
    if (keys.length >= 3) return keys
  }
  return []
}

async function runAnalysis() {
  if (!ansFile.value || !respFile.value) {
    alert('請先選取答案檔與學生作答檔！')
    return
  }

  isRunning.value = true
  progressPct.value = 10
  progressMsg.value = '正在讀取答案檔...'
  emit('log', '[CTT] 開始讀取答案檔...')

  try {
    const ansBuf = await ansFile.value.arrayBuffer()
    const ansWb = new ExcelJS.Workbook()
    await ansWb.xlsx.load(ansBuf)

    const subjCode = subject.value
    const gVal = grade.value
    const targetCode = `${subjCode.toUpperCase()}${gVal}`
    const ansWs = ansWb.getWorksheet(targetCode) || ansWb.getWorksheet('答案') || ansWb.worksheets[0]
    const ansRows = []
    ansWs.eachRow({ includeEmpty: false }, r => ansRows.push(r.values.slice(1).map(normalizeStr)))

    const keys = extractAnswersFromRows(ansRows, subjCode, gVal)
    if (keys.length === 0) throw new Error('無法從答案檔解析題數與正確答案！')

    progressPct.value = 35
    progressMsg.value = `已解析正解，共 ${keys.length} 題。正在讀取學生作答檔...`
    emit('log', `[CTT] 正解解析成功，共 ${keys.length} 題`)

    const respBuf = await respFile.value.arrayBuffer()
    const respWb = new ExcelJS.Workbook()
    await respWb.xlsx.load(respBuf)
    const respWs = respWb.worksheets[0]

    progressPct.value = 60
    progressMsg.value = '篩選有效樣本 (自動排除缺考與全空)...'

    const headers = respWs.getRow(1).values.slice(1).map(normalizeStr)
    const itemCols = []
    headers.forEach((h, idx) => {
      if (/^(item|Item|第)[ ._]?[0-9]+/i.test(h)) itemCols.push(idx)
    })
    const excludeIdxs = []
    headers.forEach((h, idx) => {
      if (/^(無效|無效標記|無效資料|缺考|缺考標記)$/.test(h)) excludeIdxs.push(idx)
    })

    const validResponses = []
    respWs.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values.slice(1)
      let isExcluded = false
      for (const eIdx of excludeIdxs) {
        const v = String(vals[eIdx] || '').trim()
        if (['1', 'TRUE', 'True', 'true', '缺考', '無效'].includes(v)) {
          isExcluded = true
          break
        }
      }
      if (isExcluded) return

      const studentAns = []
      let emptyCount = 0
      for (let j = 0; j < keys.length; j++) {
        const colIdx = itemCols[j]
        const ans = colIdx !== undefined && colIdx < vals.length ? normalizeStr(vals[colIdx]).toUpperCase() : ''
        if (!ans || ans === '9' || ans === '?') emptyCount++
        studentAns.push(ans)
      }
      if (emptyCount === keys.length) return
      validResponses.push(studentAns)
    })

    progressPct.value = 85
    progressMsg.value = `有效分析樣本 ${validResponses.length.toLocaleString()} 人，正在執行 CTT 試題分析...`
    emit('log', `[CTT] 有效樣本數: ${validResponses.length}`)

    // Handle Cutoffs
    let mCut = null
    let bCut = null
    if (enableLevel.value) {
      if (!masteryCutoff.value || !basicCutoff.value || masteryCutoff.value <= basicCutoff.value || basicCutoff.value < 0) {
        alert('已勾選計算精熟等級，請輸入有效的精熟題數與基礎題數 (精熟 > 基礎 ≥ 0)！\n若不需要計算精熟等級，請取消勾選。')
        isRunning.value = false
        return
      }
      mCut = masteryCutoff.value
      bCut = basicCutoff.value
    }

    const subjMap = { C: '國語文', M: '數學', E: '英語文', S: '自然' }
    const instance = new CTTAnalyzer({
      validResponses,
      answerKeys: keys,
      subjectName: subjMap[subjCode] || '考科',
      grade: gVal,
      code: subjCode,
      groupRatio: 0.27, // 固定 Kelley 27% 鐵律
      masteryCutoff: mCut,
      basicCutoff: bCut
    })

    analyzer.value = instance
    progressPct.value = 100
    progressMsg.value = '試題分析完成！'
    emit('log', `[CTT] 分析完成！Cronbach's α = ${instance.alpha.toFixed(4)}, 平均通過率 = ${instance.avgPassRate.toFixed(2)}`)
  } catch (err) {
    alert('試題分析失敗: ' + err.message)
    emit('log', '❌ 錯誤: ' + err.message)
  } finally {
    isRunning.value = false
  }
}

async function exportOfficialWorkbook() {
  if (!analyzer.value) return
  const a = analyzer.value
  const wb = new ExcelJS.Workbook()
  const gradeLabel = a.grade === '7n' || a.grade === '7N' ? '七年級新生' : `${a.grade}年級`
  const ws1 = wb.addWorksheet(`${a.subjectName}${gradeLabel}`)

  // Title Row
  ws1.addRow([
    `${a.subjectName}${gradeLabel}_試題分析結果`, '', '', '',
    `試題平均難度：${a.avgDifficulty.toFixed(2)}`, '', '', '',
    `試題平均通過率：${a.avgPassRate.toFixed(2)}`, '', '', '',
    `Cronbach's α：${a.alpha.toFixed(2)}`
  ])

  const headers = ['題號', '鑑別度', '難度', '通過率', '正確答案']
  a.optLabels.forEach(o => headers.push(`全體_${o}`))
  headers.push('全體_其它')
  a.optLabels.forEach(o => headers.push(`高分組_${o}`))
  headers.push('高分組_其它')
  a.optLabels.forEach(o => headers.push(`低分組_${o}`))
  headers.push('低分組_其它', '診斷建議')
  ws1.addRow(headers)

  a.itemsData.forEach(it => {
    const row = [it.item, it.discrim, it.difficulty, it.passRate, it.key]
    a.optLabels.forEach(o => row.push(it.optStats[o]?.total ?? 0))
    row.push(it.optStats['其它']?.total ?? 0)
    a.optLabels.forEach(o => row.push(it.optStats[o]?.upper ?? 0))
    row.push(it.optStats['其它']?.upper ?? 0)
    a.optLabels.forEach(o => row.push(it.optStats[o]?.lower ?? 0))
    row.push(it.optStats['其它']?.lower ?? 0)
    row.push(it.warning)
    ws1.addRow(row)
  })

  // Sheet 2: Level Analysis (if enabled)
  if (a.calcLevel) {
    const ws2 = wb.addWorksheet(`${a.subjectName}${gradeLabel}_三等級試題分析`)
    ws2.addRow([`${a.subjectName}${gradeLabel}_三等級試題分析`])
    const h2 = ['題號', '鑑別度', '難度', '正確答案']
    ;['全體', '精熟', '基礎', '待加強', '高分組', '低分組'].forEach(grp => {
      ;[...a.optLabels, '其它'].forEach(opt => h2.push(`${grp}_${opt}`))
    })
    ws2.addRow(h2)

    a.levelSummaryRows.forEach(row => {
      const r = [row.item, row.discrim, row.passRate, row.key]
      ;['全體', '精熟', '基礎', '待加強', '高分組', '低分組'].forEach(grp => {
        ;[...a.optLabels, '其它'].forEach(opt => {
          r.push(row.rates[grp]?.[opt] ?? 0)
        })
      })
      ws2.addRow(r)
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  await triggerDownload(blob, `${a.subjectName}${gradeLabel}_試題分析結果.xlsx`)
}

async function exportClassicWorkbook() {
  if (!analyzer.value) return
  const a = analyzer.value
  const wb = new ExcelJS.Workbook()
  const gradeLabel = a.grade === '7n' || a.grade === '7N' ? '七年級新生' : `${a.grade}年級`
  const ws = wb.addWorksheet(`${a.code}${String(a.grade).toUpperCase()}`)

  const headers = ['題號', '答案', '通過率', '鑑別度', '雙系列', '低分組', a.midColName, '高分組', '難度', '建議']
  ws.addRow(headers)

  a.itemsData.forEach(it => {
    ws.addRow([it.item, it.key, it.passRate, it.discrim, it.pBis, it.lower, it.mid, it.upper, it.difficulty, it.warning])
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  await triggerDownload(blob, `${a.code}${String(a.grade).toUpperCase()}_試題分析_R經典.xlsx`)
}
</script>
