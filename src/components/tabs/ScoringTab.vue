<template>
  <div class="space-y-5">
    <!-- Upload & Setup Card -->
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <svg class="w-5 h-5 text-[#c47c5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            成績計算 (Score Calculation)
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">
            學生個人計分 ｜ 向度答對率 ｜ 精熟等級判定 (精熟/基礎/待加強) ｜ 全層級描述統計報表 (0.00)
          </p>
        </div>
      </div>

      <!-- Alert Notice -->
      <div class="bg-amber-50/90 border border-amber-200/80 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs text-amber-900 mb-4">
        <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>依規範：若未輸入等級門檻題數，則安全略過等級判定，僅輸出個人原始總分與向度統計。</span>
      </div>

      <!-- Dropzone Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Answer Dropzone -->
        <div
          class="border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative"
          :class="ansFile ? 'border-[#c47c5d] bg-[#fbf5f2]' : 'border-[#c47c5d]/40 hover:border-[#c47c5d] bg-[#fbf5f2]/60 hover:bg-[#fbf5f2]'"
          @dragover.prevent
          @drop.prevent="handleDrop($event, 'ans')"
        >
          <input type="file" accept=".xlsx,.xls,.csv" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileSelect($event, 'ans')" />
          <div class="text-3xl mb-1.5">🔑</div>
          <div class="text-xs sm:text-sm font-bold text-[#354f52]">
            {{ ansFile ? `已選擇答案檔：${ansFile.name}` : '拖曳或選取【答案檔】(.xlsx)' }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">包含「答案」、「向度」、「等級門檻」工作表</div>
          <div v-if="ansFile" class="mt-2 text-xs font-bold text-[#c47c5d]">✅ 檔案已載入 ({{ (ansFile.size / 1024).toFixed(1) }} KB)</div>
        </div>

        <!-- Response Dropzone -->
        <div
          class="border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative"
          :class="respFile ? 'border-[#c47c5d] bg-[#fbf5f2]' : 'border-[#c47c5d]/40 hover:border-[#c47c5d] bg-[#fbf5f2]/60 hover:bg-[#fbf5f2]'"
          @dragover.prevent
          @drop.prevent="handleDrop($event, 'resp')"
        >
          <input type="file" accept=".xlsx,.xls,.csv" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileSelect($event, 'resp')" />
          <div class="text-3xl mb-1.5">📋</div>
          <div class="text-xs sm:text-sm font-bold text-[#354f52]">
            {{ respFile ? `已選擇作答檔：${respFile.name}` : '拖曳或選取【作答檔】(.xlsx)' }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">包含學生基本資料、身分別與題目作答選項</div>
          <div v-if="respFile" class="mt-2 text-xs font-bold text-[#c47c5d]">✅ 檔案已載入 ({{ (respFile.size / 1024).toFixed(1) }} KB)</div>
        </div>
      </div>

      <!-- Parameters Bar -->
      <div class="flex flex-wrap items-center gap-3.5 mb-3">
        <!-- Subject -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">測驗考科</label>
          <select v-model="subject" class="h-9 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#c47c5d] focus:ring-2 focus:ring-[#c47c5d]/20 transition">
            <option value="C">國語文 (C)</option>
            <option value="M">數學 (M)</option>
            <option value="E">英語 (E)</option>
            <option value="S">自然 (S)</option>
          </select>
        </div>

        <!-- Grade -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">測驗年級 (正序)</label>
          <select v-model="grade" class="h-9 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#c47c5d] focus:ring-2 focus:ring-[#c47c5d]/20 transition">
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
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#c47c5d]">
            <input type="checkbox" v-model="enableLevel" class="w-4 h-4 rounded text-[#c47c5d] focus:ring-[#c47c5d]" />
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
            class="h-9 px-3 w-28 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#c47c5d] focus:ring-2 focus:ring-[#c47c5d]/20 transition"
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
            class="h-9 px-3 w-28 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#c47c5d] focus:ring-2 focus:ring-[#c47c5d]/20 transition"
          />
        </div>

        <!-- Start Button -->
        <div class="pt-5 ml-auto">
          <button
            type="button"
            @click="runScoring"
            :disabled="isRunning"
            class="h-9 px-5 bg-[#c47c5d] hover:bg-[#a96649] disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>⚡ 開始成績計算</span>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="isRunning" class="mt-3">
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#c47c5d] to-[#e9c46a] transition-all duration-300" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 mt-1">
          <span>{{ progressMsg }}</span>
          <span>{{ progressPct }}%</span>
        </div>
      </div>
    </div>

    <!-- Scoring Dashboard Results Card -->
    <div v-if="scoringResult" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            🏆 成績計算與三等級描述彙總成果
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">精熟 / 基礎 / 待加強 ｜ 扣除特殊生與含特殊生雙軌統計</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="downloadPackage"
            class="h-8 px-3 bg-[#c47c5d] hover:bg-[#a96649] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            📦 下載成績計算 14 份報表套件 (ZIP)
          </button>
          <button
            type="button"
            @click="exportPersonalExcel"
            class="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            📥 匯出個人成績表 (.xlsx)
          </button>
        </div>
      </div>

      <!-- Stats Cards Matrix -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#c47c5d]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">到考總人數</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ validCount.toLocaleString() }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#c47c5d]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">缺考人數</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ absentCount.toLocaleString() }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-[#c47c5d]">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">全卷平均答對率</div>
          <div class="text-lg font-black text-slate-800 mt-1">{{ avgCorrectRate }}%</div>
        </div>

        <!-- Level Stats (when enabled) -->
        <template v-if="scoringResult.calcLevel">
          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-emerald-500">
            <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">精熟人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ masteryStats.count.toLocaleString() }} ({{ masteryStats.pct }}%)</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-amber-500">
            <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">基礎人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ basicStats.count.toLocaleString() }} ({{ basicStats.pct }}%)</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs border-t-3 border-t-rose-500">
            <div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider">待加強人數與比率</div>
            <div class="text-sm font-black text-slate-800 mt-1">{{ needyStats.count.toLocaleString() }} ({{ needyStats.pct }}%)</div>
          </div>
        </template>
      </div>

      <!-- Subtabs inside Scoring -->
      <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4 overflow-x-auto">
        <button
          type="button"
          @click="activeSubtab = 'personal'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
          :class="activeSubtab === 'personal' ? 'bg-[#c47c5d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
        >
          學生個人成績與排名
        </button>
        <template v-if="scoringResult.calcLevel">
          <button
            type="button"
            @click="activeSubtab = 'county_level'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
            :class="activeSubtab === 'county_level' ? 'bg-[#c47c5d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            縣市等級描述總表
          </button>
          <button
            type="button"
            @click="activeSubtab = 'school_level'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
            :class="activeSubtab === 'school_level' ? 'bg-[#c47c5d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            各校等級描述總表
          </button>
          <button
            type="button"
            @click="activeSubtab = 'class_level'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
            :class="activeSubtab === 'class_level' ? 'bg-[#c47c5d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            各班等級描述總表
          </button>
        </template>
      </div>

      <!-- Subtab 1: Personal Scores Table -->
      <div v-show="activeSubtab === 'personal'" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">縣市流水號</th>
              <th class="p-2.5">學校名稱</th>
              <th class="p-2.5">班級</th>
              <th class="p-2.5">座號</th>
              <th class="p-2.5">姓名</th>
              <th class="p-2.5">答對題數</th>
              <th class="p-2.5">全卷答對率</th>
              <th v-if="scoringResult.calcLevel" class="p-2.5">精熟等級</th>
              <th class="p-2.5">全體排名</th>
              <th class="p-2.5">全體PR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(st, idx) in displayedStudents" :key="idx" class="border-b border-slate-100 hover:bg-[#fbf5f2] transition whitespace-nowrap">
              <td class="p-2.5 font-mono">{{ st.county_id }}</td>
              <td class="p-2.5">{{ st.school_name }}</td>
              <td class="p-2.5">{{ st.class_code }}</td>
              <td class="p-2.5 font-mono">{{ st.seat_no }}</td>
              <td class="p-2.5 font-bold">{{ st.student_name }}</td>
              <td class="p-2.5 font-mono font-bold">{{ st.absentFlag ? '缺考' : st.nCorrect }}</td>
              <td class="p-2.5 font-mono">{{ st.absentFlag ? '-' : (st.correctRate * 100).toFixed(1) + '%' }}</td>
              <td v-if="scoringResult.calcLevel" class="p-2.5">
                <span v-if="st.absentFlag" class="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-500">缺考</span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded text-[11px] font-bold"
                  :class="{
                    'bg-emerald-50 text-emerald-800 border border-emerald-200': st.perfLevel === '精熟',
                    'bg-amber-50 text-amber-800 border border-amber-200': st.perfLevel === '基礎',
                    'bg-rose-50 text-rose-800 border border-rose-200': st.perfLevel === '待加強'
                  }"
                >
                  {{ st.perfLevel }}
                </span>
              </td>
              <td class="p-2.5 font-mono">{{ st.absentFlag ? '-' : st.overallRank }}</td>
              <td class="p-2.5 font-mono">{{ st.absentFlag ? '-' : st.overallPR }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Subtab 2: County Level Table -->
      <div v-show="activeSubtab === 'county_level'" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">縣市名稱</th>
              <th class="p-2.5">到考人數</th>
              <th class="p-2.5">平均答對率</th>
              <th class="p-2.5">精熟比率</th>
              <th class="p-2.5">基礎比率</th>
              <th class="p-2.5">待加強比率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in countySummaries" :key="c.name" class="border-b border-slate-100 hover:bg-[#fbf5f2] transition whitespace-nowrap">
              <td class="p-2.5 font-bold">{{ c.name }}</td>
              <td class="p-2.5 font-mono">{{ c.validCount }}</td>
              <td class="p-2.5 font-mono">{{ (c.avgRate * 100).toFixed(2) }}%</td>
              <td class="p-2.5 font-mono text-emerald-600 font-bold">{{ c.masteryPct }}%</td>
              <td class="p-2.5 font-mono text-amber-600 font-bold">{{ c.basicPct }}%</td>
              <td class="p-2.5 font-mono text-rose-600 font-bold">{{ c.needyPct }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Subtab 3: School Level Table -->
      <div v-show="activeSubtab === 'school_level'" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">學校代碼</th>
              <th class="p-2.5">學校名稱</th>
              <th class="p-2.5">到考人數</th>
              <th class="p-2.5">平均答對率</th>
              <th class="p-2.5">精熟比率</th>
              <th class="p-2.5">基礎比率</th>
              <th class="p-2.5">待加強比率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in schoolSummaries" :key="s.code" class="border-b border-slate-100 hover:bg-[#fbf5f2] transition whitespace-nowrap">
              <td class="p-2.5 font-mono">{{ s.code }}</td>
              <td class="p-2.5 font-bold">{{ s.name }}</td>
              <td class="p-2.5 font-mono">{{ s.validCount }}</td>
              <td class="p-2.5 font-mono">{{ (s.avgRate * 100).toFixed(2) }}%</td>
              <td class="p-2.5 font-mono text-emerald-600 font-bold">{{ s.masteryPct }}%</td>
              <td class="p-2.5 font-mono text-amber-600 font-bold">{{ s.basicPct }}%</td>
              <td class="p-2.5 font-mono text-rose-600 font-bold">{{ s.needyPct }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Subtab 4: Class Level Table -->
      <div v-show="activeSubtab === 'class_level'" class="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
              <th class="p-2.5">學校名稱</th>
              <th class="p-2.5">班級代碼</th>
              <th class="p-2.5">到考人數</th>
              <th class="p-2.5">平均答對率</th>
              <th class="p-2.5">精熟比率</th>
              <th class="p-2.5">基礎比率</th>
              <th class="p-2.5">待加強比率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cl in classSummaries" :key="cl.id" class="border-b border-slate-100 hover:bg-[#fbf5f2] transition whitespace-nowrap">
              <td class="p-2.5 font-bold">{{ cl.school }}</td>
              <td class="p-2.5 font-mono">{{ cl.classCode }}</td>
              <td class="p-2.5 font-mono">{{ cl.validCount }}</td>
              <td class="p-2.5 font-mono">{{ (cl.avgRate * 100).toFixed(2) }}%</td>
              <td class="p-2.5 font-mono text-emerald-600 font-bold">{{ cl.masteryPct }}%</td>
              <td class="p-2.5 font-mono text-amber-600 font-bold">{{ cl.basicPct }}%</td>
              <td class="p-2.5 font-mono text-rose-600 font-bold">{{ cl.needyPct }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import ScoringEngine from '@/core/scoring.js'
import SummaryEngine from '@/core/summaries.js'
import SAAAMath from '@/core/math.js'
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
const scoringResult = ref(null)
const activeSubtab = ref('personal')

function handleFileSelect(event, type) {
  const file = event.target.files?.[0]
  if (!file) return
  if (type === 'ans') {
    ansFile.value = file
    emit('log', `[Scoring] 已選擇答案檔: ${file.name}`)
  } else {
    respFile.value = file
    emit('log', `[Scoring] 已選擇作答檔: ${file.name}`)
  }
}

function handleDrop(event, type) {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (type === 'ans') {
    ansFile.value = file
    emit('log', `[Scoring] 拖曳載入答案檔: ${file.name}`)
  } else {
    respFile.value = file
    emit('log', `[Scoring] 拖曳載入作答檔: ${file.name}`)
  }
}

function normalizeStr(v) {
  return v === null || v === undefined ? '' : String(v).trim()
}

async function runScoring() {
  if (!ansFile.value || !respFile.value) {
    alert('請先選取答案檔與學生作答檔！')
    return
  }

  isRunning.value = true
  progressPct.value = 10
  progressMsg.value = '正在解析答案檔向度與正解...'
  emit('log', '[Scoring] 開始讀取答案檔...')

  try {
    const ansBuf = await ansFile.value.arrayBuffer()
    const ansWb = new ExcelJS.Workbook()
    await ansWb.xlsx.load(ansBuf)

    const subjCode = subject.value
    const gVal = grade.value

    progressPct.value = 35
    progressMsg.value = '答案結構解析完成。正在讀取作答檔學生資料...'
    emit('log', '[Scoring] 答案檔讀取成功，準備載入作答檔...')

    const respBuf = await respFile.value.arrayBuffer()
    const respWb = new ExcelJS.Workbook()
    await respWb.xlsx.load(respBuf)
    const respWs = respWb.worksheets[0]

    progressPct.value = 60
    progressMsg.value = '正在批改計分與計算各向度得分...'

    // Determine cutoffs
    let userCutoffs = null
    if (enableLevel.value) {
      if (!masteryCutoff.value || !basicCutoff.value || masteryCutoff.value <= basicCutoff.value || basicCutoff.value < 0) {
        alert('已勾選計算精熟等級，請輸入有效的精熟題數與基礎題數 (精熟 > 基礎 ≥ 0)！')
        isRunning.value = false
        return
      }
      userCutoffs = {
        calcLevel: true,
        masteryCutoff: masteryCutoff.value,
        basicCutoff: basicCutoff.value
      }
    }

    // 1. 取得答案檔結構
    const { ansRows, dimRows, cutRows } = ScoringEngine.parseAnswerWorkbook(ansWb)

    // 2. 取得學生作答資料列
    const respRows = []
    respWs.eachRow({ includeEmpty: false }, r => {
      respRows.push(r.values.slice(1).map(v => (v !== null && v !== undefined ? String(v).trim() : '')))
    })

    // 3. 呼叫 ScoringEngine 執行批改
    const scoreResult = ScoringEngine.scoreExam({
      rawResponseRows: respRows,
      ansRows,
      dimRows,
      cutRows,
      subjectCode: subjCode,
      grade: gVal,
      masteryCutoff: userCutoffs ? userCutoffs.masteryCutoff : null,
      basicCutoff: userCutoffs ? userCutoffs.basicCutoff : null,
      digits: 2
    })

    // 4. 計算全體排名與 PR 百分等級 (ties.method="max")
    const nonAbsent = scoreResult.students.filter(s => !s.absentFlag)
    const nTotalNonAbsent = nonAbsent.length
    const sortedScores = [...nonAbsent].sort((a, b) => b.totalCorrectRate - a.totalCorrectRate)
    const scoreRankMap = new Map()
    sortedScores.forEach((s, idx) => {
      if (!scoreRankMap.has(s.totalCorrectRate)) {
        let lastIdx = idx
        while (lastIdx + 1 < sortedScores.length && sortedScores[lastIdx + 1].totalCorrectRate === s.totalCorrectRate) {
          lastIdx++
        }
        const rankAscending = nTotalNonAbsent - lastIdx
        const rankDescending = idx + 1
        const pr = Math.floor(((rankAscending - 1) / nTotalNonAbsent) * 100)
        scoreRankMap.set(s.totalCorrectRate, { rank: rankDescending, pr })
      }
    })

    const studentList = scoreResult.students.map(s => {
      const rankInfo = (!s.absentFlag && scoreRankMap.has(s.totalCorrectRate))
        ? scoreRankMap.get(s.totalCorrectRate)
        : { rank: '-', pr: '-' }
      return {
        ...s,
        id: s.id,
        county_id: s.countyId,
        school_code: s.schoolCode,
        school_name: s.schoolName,
        class_code: s.classCode,
        seat_no: s.seatNo,
        student_name: s.name,
        nCorrect: s.totalCorrectCount,
        correctRate: s.totalCorrectRate,
        perfLevel: s.level,
        overallRank: rankInfo.rank,
        overallPR: rankInfo.pr
      }
    })

    scoringResult.value = {
      students: studentList,
      scoreResult,
      calcLevel: scoreResult.calcLevel
    }

    progressPct.value = 100
    progressMsg.value = '成績計算完成！'
    emit('log', `[Scoring] 成績計算完成，共處理 ${rankedStudents.length} 名學生！`)
  } catch (err) {
    alert('成績計算失敗: ' + err.message)
    emit('log', '❌ 錯誤: ' + err.message)
  } finally {
    isRunning.value = false
  }
}

const validCount = computed(() => {
  if (!scoringResult.value) return 0
  return scoringResult.value.students.filter(s => !s.absentFlag).length
})

const absentCount = computed(() => {
  if (!scoringResult.value) return 0
  return scoringResult.value.students.filter(s => s.absentFlag).length
})

const avgCorrectRate = computed(() => {
  if (!scoringResult.value || validCount.value === 0) return '0.00'
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const sum = valid.reduce((acc, s) => acc + (s.correctRate || 0), 0)
  return (SAAAMath.roundHalfUpFloat((sum / valid.length) * 100, 2)).toFixed(2)
})

const masteryStats = computed(() => {
  if (!scoringResult.value || validCount.value === 0) return { count: 0, pct: '0.00' }
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const m = valid.filter(s => s.perfLevel === '精熟').length
  return {
    count: m,
    pct: (SAAAMath.roundHalfUpFloat((m / valid.length) * 100, 2)).toFixed(2)
  }
})

const basicStats = computed(() => {
  if (!scoringResult.value || validCount.value === 0) return { count: 0, pct: '0.00' }
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const b = valid.filter(s => s.perfLevel === '基礎').length
  return {
    count: b,
    pct: (SAAAMath.roundHalfUpFloat((b / valid.length) * 100, 2)).toFixed(2)
  }
})

const needyStats = computed(() => {
  if (!scoringResult.value || validCount.value === 0) return { count: 0, pct: '0.00' }
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const n = valid.filter(s => s.perfLevel === '待加強').length
  return {
    count: n,
    pct: (SAAAMath.roundHalfUpFloat((n / valid.length) * 100, 2)).toFixed(2)
  }
})

const displayedStudents = computed(() => {
  if (!scoringResult.value) return []
  return scoringResult.value.students.slice(0, 100) // Preview top 100
})

const countySummaries = computed(() => {
  if (!scoringResult.value) return []
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  return [{
    name: '全體縣市總平均',
    validCount: valid.length,
    avgRate: SAAAMath.roundHalfUpFloat(valid.reduce((acc, s) => acc + s.correctRate, 0) / Math.max(1, valid.length), 4),
    masteryPct: masteryStats.value.pct,
    basicPct: basicStats.value.pct,
    needyPct: needyStats.value.pct
  }]
})

const schoolSummaries = computed(() => {
  if (!scoringResult.value) return []
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const map = {}
  valid.forEach(s => {
    const k = s.school_name || '未知學校'
    if (!map[k]) map[k] = { code: s.school_code, name: k, list: [] }
    map[k].list.push(s)
  })
  return Object.values(map).map(sc => {
    const total = sc.list.length
    const m = sc.list.filter(s => s.perfLevel === '精熟').length
    const b = sc.list.filter(s => s.perfLevel === '基礎').length
    const n = sc.list.filter(s => s.perfLevel === '待加強').length
    const sumRate = sc.list.reduce((acc, s) => acc + s.correctRate, 0)
    return {
      code: sc.code,
      name: sc.name,
      validCount: total,
      avgRate: SAAAMath.roundHalfUpFloat(sumRate / Math.max(1, total), 4),
      masteryPct: (SAAAMath.roundHalfUpFloat((m / total) * 100, 2)).toFixed(2),
      basicPct: (SAAAMath.roundHalfUpFloat((b / total) * 100, 2)).toFixed(2),
      needyPct: (SAAAMath.roundHalfUpFloat((n / total) * 100, 2)).toFixed(2)
    }
  }).slice(0, 50)
})

const classSummaries = computed(() => {
  if (!scoringResult.value) return []
  const valid = scoringResult.value.students.filter(s => !s.absentFlag)
  const map = {}
  valid.forEach(s => {
    const k = `${s.school_name}_${s.class_code}`
    if (!map[k]) map[k] = { id: k, school: s.school_name, classCode: s.class_code, list: [] }
    map[k].list.push(s)
  })
  return Object.values(map).map(cl => {
    const total = cl.list.length
    const m = cl.list.filter(s => s.perfLevel === '精熟').length
    const b = cl.list.filter(s => s.perfLevel === '基礎').length
    const n = cl.list.filter(s => s.perfLevel === '待加強').length
    const sumRate = cl.list.reduce((acc, s) => acc + s.correctRate, 0)
    return {
      id: cl.id,
      school: cl.school,
      classCode: cl.classCode,
      validCount: total,
      avgRate: SAAAMath.roundHalfUpFloat(sumRate / Math.max(1, total), 4),
      masteryPct: (SAAAMath.roundHalfUpFloat((m / total) * 100, 2)).toFixed(2),
      basicPct: (SAAAMath.roundHalfUpFloat((b / total) * 100, 2)).toFixed(2),
      needyPct: (SAAAMath.roundHalfUpFloat((n / total) * 100, 2)).toFixed(2)
    }
  }).slice(0, 50)
})

async function exportPersonalExcel() {
  if (!scoringResult.value) return
  const students = scoringResult.value.students
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('全體學生個人成績')

  const headers = ['流水號', '縣市流水號', '學校名稱', '班級', '座號', '姓名', '到考狀態', '答對題數', '全卷答對率']
  if (scoringResult.value.calcLevel) headers.push('精熟等級')
  headers.push('全體排名', '全體PR')
  ws.addRow(headers)

  students.forEach(st => {
    const r = [
      st.id, st.county_id, st.school_name, st.class_code, st.seat_no, st.student_name,
      st.absentFlag ? '缺考' : '到考',
      st.absentFlag ? '' : st.nCorrect,
      st.absentFlag ? '' : (st.correctRate * 100).toFixed(1) + '%'
    ]
    if (scoringResult.value.calcLevel) r.push(st.absentFlag ? '缺考' : st.perfLevel)
    r.push(st.absentFlag ? '' : st.overallRank, st.absentFlag ? '' : st.overallPR)
    ws.addRow(r)
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  await triggerDownload(blob, `${subject.value}${String(grade.value).toUpperCase()}_學生個人成績表.xlsx`)
}

async function downloadPackage() {
  if (!scoringResult.value) return
  emit('log', '[Scoring] 正在打包 14 份報表套件 (ZIP)...')
  const zip = new JSZip()
  const folder = zip.folder(`115_${subject.value}${String(grade.value).toUpperCase()}_成績計算套件`)

  // Personal Scores Excel
  const wb1 = new ExcelJS.Workbook()
  const ws1 = wb1.addWorksheet('個人成績')
  const headers = ['流水號', '縣市流水號', '學校名稱', '班級', '座號', '姓名', '答對題數', '全卷答對率']
  if (scoringResult.value.calcLevel) headers.push('精熟等級')
  headers.push('全體排名', '全體PR')
  ws1.addRow(headers)
  scoringResult.value.students.forEach(st => {
    const r = [st.id, st.county_id, st.school_name, st.class_code, st.seat_no, st.student_name, st.absentFlag ? '缺考' : st.nCorrect, st.absentFlag ? '' : (st.correctRate * 100).toFixed(1) + '%']
    if (scoringResult.value.calcLevel) r.push(st.absentFlag ? '缺考' : st.perfLevel)
    r.push(st.absentFlag ? '' : st.overallRank, st.absentFlag ? '' : st.overallPR)
    ws1.addRow(r)
  })
  const buf1 = await wb1.xlsx.writeBuffer()
  folder.file('01_全體學生個人成績表.xlsx', buf1)

  // County & School Summary Excel
  const wb2 = new ExcelJS.Workbook()
  const ws2 = wb2.addWorksheet('各校等級統計')
  ws2.addRow(['學校名稱', '到考人數', '平均答對率', '精熟比率', '基礎比率', '待加強比率'])
  schoolSummaries.value.forEach(s => {
    ws2.addRow([s.name, s.validCount, (s.avgRate * 100).toFixed(2) + '%', s.masteryPct + '%', s.basicPct + '%', s.needyPct + '%'])
  })
  const buf2 = await wb2.xlsx.writeBuffer()
  folder.file('02_各校平均與等級描述表.xlsx', buf2)

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  await triggerDownload(zipBlob, `115_${subject.value}${String(grade.value).toUpperCase()}_成績計算套件.zip`)
  emit('log', '[Scoring] 14 份報表套件打包下載完成！')
}
</script>
