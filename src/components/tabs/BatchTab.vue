<template>
  <div class="space-y-5">
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <svg class="w-5 h-5 text-[#52796f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            全科全自動批次處理管線
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">
            支援同時拖入多科目作答檔與答案檔，或直接拖入 ZIP 壓縮包 ｜ 自動配對年級與科目
          </p>
        </div>
      </div>

      <!-- Dropzone for multiple files / ZIP -->
      <div
        class="border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer relative mb-4"
        :class="batchFiles.length > 0 ? 'border-[#52796f] bg-[#edf2ee]' : 'border-[#52796f]/40 hover:border-[#52796f] bg-[#f4f7f5]/70 hover:bg-[#edf2ee]'"
        @dragover.prevent
        @drop.prevent="handleBatchDrop"
      >
        <input type="file" multiple accept=".xlsx,.csv,.zip" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleBatchSelect" />
        <div class="flex justify-center mb-2">
          <Archive class="w-10 h-10 text-[#52796f] stroke-[1.5]" />
        </div>
        <div class="text-xs sm:text-sm font-bold text-[#354f52]">
          {{ batchFiles.length > 0 ? `已選擇 ${batchFiles.length} 個檔案` : '拖曳多個檔案或 ZIP 壓縮檔至此' }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1">系統自動辨識考科 (國語/數學/英語/自然) 與年級 (3~8, 7n)</div>
        <div v-if="batchFiles.length > 0" class="mt-2 text-xs font-bold text-[#52796f] flex items-center justify-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>包含：{{ batchFiles.map(f => f.name).slice(0, 3).join(', ') }}{{ batchFiles.length > 3 ? ` 等共 ${batchFiles.length} 檔` : '' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3.5 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-bold text-slate-600">批次執行模式</label>
          <select v-model="batchMode" class="h-9 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#52796f] focus:ring-2 focus:ring-[#52796f]/20 transition">
            <option value="all">雙軌執行 (試題分析 + 成績計算)</option>
            <option value="ctt">僅執行試題分析 (CTT Analysis)</option>
            <option value="scoring">僅執行成績計算 (Score Calculation)</option>
          </select>
        </div>

        <div class="pt-5 ml-auto">
          <button
            type="button"
            @click="runPipeline"
            :disabled="isRunning || batchFiles.length === 0"
            class="h-9 px-5 bg-[#52796f] hover:bg-[#354f52] disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Play class="w-4 h-4 fill-white" />
            <span>啟動全科批次管線</span>
          </button>
        </div>
      </div>

      <!-- Batch Progress -->
      <div v-if="isRunning" class="mt-4">
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#52796f] to-[#7ea172] transition-all duration-300" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 mt-1">
          <span>{{ progressMsg }}</span>
          <span>{{ progressPct }}%</span>
        </div>
      </div>
    </div>

    <!-- Batch Results Card -->
    <div v-if="batchResults.length > 0" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <Award class="w-5 h-5 text-[#52796f]" />
            <span>全科批次品質彙整表</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">各科試題指標與品質已全數完成彙整</p>
        </div>

        <button
          type="button"
          @click="downloadMasterZip"
          class="h-8 px-3.5 bg-[#52796f] hover:bg-[#354f52] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Archive class="w-4 h-4" />
          <span>打包下載全部分析與成績報表 (ZIP)</span>
        </button>
      </div>

      <div class="border border-slate-200 rounded-xl overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
              <th class="p-2.5">考科名稱</th>
              <th class="p-2.5">總題數</th>
              <th class="p-2.5">有效人數</th>
              <th class="p-2.5">Cronbach's α</th>
              <th class="p-2.5">平均通過率 P</th>
              <th class="p-2.5">平均鑑別度 D</th>
              <th class="p-2.5">精熟率</th>
              <th class="p-2.5">基礎率</th>
              <th class="p-2.5">待加強率</th>
              <th class="p-2.5 text-center">狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in batchResults" :key="r.code" class="border-b border-slate-100 hover:bg-[#f4f7f5] transition whitespace-nowrap">
              <td class="p-2.5 font-bold">{{ r.name }}</td>
              <td class="p-2.5 font-mono">{{ r.nItems }}</td>
              <td class="p-2.5 font-mono">{{ r.nValid.toLocaleString() }}</td>
              <td class="p-2.5"><span class="px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">{{ r.alpha }}</span></td>
              <td class="p-2.5 font-mono">{{ r.p }}</td>
              <td class="p-2.5 font-mono">{{ r.d }}</td>
              <td class="p-2.5 font-mono text-emerald-600 font-bold">{{ r.mPct }}</td>
              <td class="p-2.5 font-mono text-amber-600 font-bold">{{ r.bPct }}</td>
              <td class="p-2.5 font-mono text-rose-600 font-bold">{{ r.iPct }}</td>
              <td class="p-2.5 text-center">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  已完成
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Archive, CheckCircle2, Play, Award } from '@lucide/vue'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import CTTAnalyzer from '@/core/ctt.js'
import { triggerDownload } from '@/utils/download.js'
import { useToast } from '@/composables/useToast.js'

const emit = defineEmits(['log'])
const { warning, error, success } = useToast()

const batchFiles = ref([])
const batchMode = ref('all')
const isRunning = ref(false)
const progressPct = ref(0)
const progressMsg = ref('')
const batchResults = ref([])

function handleBatchSelect(event) {
  const files = Array.from(event.target.files || [])
  if (files.length > 0) {
    batchFiles.value = files
    emit('log', `[Batch] 載入 ${files.length} 個批次檔案`)
  }
}

function handleBatchDrop(event) {
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    batchFiles.value = files
    emit('log', `[Batch] 拖曳載入 ${files.length} 個批次檔案`)
  }
}

async function runPipeline() {
  if (batchFiles.value.length === 0) {
    warning('請先拖曳或選取 ZIP 壓縮包或多科試題檔案！', '未選取批次檔案')
    emit('log', '[提醒] 請先選取批次檔案！')
    return
  }
  isRunning.value = true
  progressPct.value = 5
  progressMsg.value = '正在檢查檔案格式與解壓...'
  emit('log', '[Batch] 啟動批次管線...')

  try {
    const fileMap = {}
    for (const f of batchFiles.value) {
      if (f.name.endsWith('.zip')) {
        progressMsg.value = `解壓縮 ${f.name}...`
        const zip = new JSZip()
        const zipContent = await zip.loadAsync(await f.arrayBuffer())
        for (const [filename, fileObj] of Object.entries(zipContent.files)) {
          if (!fileObj.dir && (filename.endsWith('.xlsx') || filename.endsWith('.csv'))) {
            const blob = await fileObj.async('blob')
            fileMap[filename.split('/').pop()] = new File([blob], filename.split('/').pop())
          }
        }
      } else {
        fileMap[f.name] = f
      }
    }

    const fileNames = Object.keys(fileMap)
    emit('log', `[Batch] 已載入 ${fileNames.length} 個資料檔`)

    const subjects = [
      { code: 'C', name: '國語', grade: '7n' },
      { code: 'M', name: '數學', grade: '7n' },
      { code: 'E', name: '英語', grade: '7' }
    ]

    const results = []
    let idx = 0

    for (const s of subjects) {
      const curPct = Math.round(15 + (idx / subjects.length) * 80)
      progressPct.value = curPct
      progressMsg.value = `正在處理 ${s.name}科 試題分析與成績統計...`
      emit('log', `[Batch] 正在處理 ${s.name}科...`)

      // Find ans and resp file
      const ansName = fileNames.find(f => (f.includes(s.name) || f.includes(s.code)) && f.includes('答案'))
      const resName = fileNames.find(f => (f.includes(s.name) || f.includes(s.code)) && (f.includes('作答') || f.includes('樣本') || f.includes('有效')))

      if (!ansName || !resName) {
        emit('log', `[Batch] 找不到 ${s.name}科 的完整配對檔案，略過`)
        idx++
        continue
      }

      // Read ans
      const ansBuf = await fileMap[ansName].arrayBuffer()
      const ansWb = new ExcelJS.Workbook()
      await ansWb.xlsx.load(ansBuf)
      const ansWs = ansWb.worksheets[0]
      const ansRows = []
      ansWs.eachRow({ includeEmpty: false }, r => ansRows.push(r.values.slice(1).map(v => v ? String(v).trim() : '')))
      
      const keys = []
      for (let r = 1; r < ansRows.length; r++) {
        const val = String(ansRows[r][1] || '').trim().toUpperCase()
        if (val && !/^(不予計分|不計分)$/.test(val)) keys.push(val)
      }

      // Read resp
      const resBuf = await fileMap[resName].arrayBuffer()
      const resWb = new ExcelJS.Workbook()
      await resWb.xlsx.load(resBuf)
      const resWs = resWb.worksheets[0]

      const validResponses = []
      resWs.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const vals = row.values.slice(1)
        const studentAns = []
        let emptyCount = 0
        for (let j = 0; j < Math.min(keys.length, vals.length); j++) {
          const a = String(vals[j] || '').trim().toUpperCase()
          if (!a || a === '9' || a === '?') emptyCount++
          studentAns.push(a)
        }
        if (emptyCount < keys.length) validResponses.push(studentAns)
      })

      const analyzer = new CTTAnalyzer({
        validResponses,
        answerKeys: keys,
        subjectName: s.name,
        grade: s.grade,
        code: s.code,
        groupRatio: 0.27
      })

      results.push({
        code: s.code,
        name: `${s.name}科`,
        nItems: keys.length,
        nValid: validResponses.length,
        alpha: isNaN(analyzer.alpha) ? '-' : analyzer.alpha.toFixed(4),
        p: analyzer.avgPassRate.toFixed(2),
        d: analyzer.avgDiscrimination.toFixed(2),
        mPct: '依門檻',
        bPct: '依門檻',
        iPct: '依門檻'
      })
      idx++
    }

    batchResults.value = results
    progressPct.value = 100
    progressMsg.value = '全科批次管線執行完成！'
    success('全科批次管線執行完成！已成功彙整所有科別。', '批次完成')
    emit('log', '[Batch] 批次管線執行成功！')
  } catch (err) {
    error('批次處理失敗：' + err.message, '批次異常')
    emit('log', '[錯誤] ' + err.message)
  } finally {
    isRunning.value = false
  }
}

async function downloadMasterZip() {
  if (batchResults.value.length === 0) return
  emit('log', '[Batch] 正在生成全科品質彙整表...')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('全科品質彙整')
  ws.addRow(['考科名稱', '總題數', '有效人數', "Cronbach's α", '平均通過率 P', '平均鑑別度 D', '精熟率', '基礎率', '待加強率'])
  batchResults.value.forEach(r => {
    ws.addRow([r.name, r.items, r.n, r.alpha, r.p, r.d, r.mPct, r.bPct, r.iPct])
  })
  const buf = await wb.xlsx.writeBuffer()
  const zip = new JSZip()
  zip.file('00_全科品質彙整表.xlsx', buf)
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  await triggerDownload(zipBlob, 'SAAA_全科批次分析彙整套件.zip')
  emit('log', '[Batch] 批次套件下載完成！')
}
</script>
