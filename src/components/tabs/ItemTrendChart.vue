<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 relative select-none">
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <h3 class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
        <svg class="w-4 h-4 text-[#52796f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
        全卷試題通過率與難度趨勢圖
      </h3>
      <div class="flex items-center gap-3 text-[11px] sm:text-xs font-semibold text-slate-600">
        <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-[#52796f] rounded-full"></span> 通過率 (P)</div>
        <div class="flex items-center gap-1.5"><span class="w-3.5 h-1 bg-[#e07a5f] rounded-full"></span> 難度 (Index)</div>
        <div class="flex items-center gap-1.5"><span class="w-3.5 h-0.5 border-t border-dashed border-[#d4a373]"></span> 鑑別度 (D)</div>
        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#e07a5f]"></span> 待檢視弱題</div>
      </div>
    </div>

    <!-- Scrollable SVG viewport -->
    <div class="w-full overflow-x-auto pb-2 relative" @mouseleave="hoveredPoint = null">
      <div :style="{ minWidth: `${chartWidth}px` }" class="relative">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-auto overflow-visible block">
          <!-- Y Grid & Labels -->
          <g class="stroke-slate-100" stroke-width="1" stroke-dasharray="4 4">
            <line :x1="padding.left" :y1="padding.top" :x2="chartWidth - padding.right" :y2="padding.top" />
            <line :x1="padding.left" :y1="padding.top + plotHeight / 2" :x2="chartWidth - padding.right" :y2="padding.top + plotHeight / 2" />
            <line :x1="padding.left" :y1="chartHeight - padding.bottom" :x2="chartWidth - padding.right" :y2="chartHeight - padding.bottom" stroke-dasharray="none" class="stroke-slate-200" />
          </g>
          <g class="text-[10px] fill-slate-400 font-mono" text-anchor="end">
            <text :x="padding.left - 8" :y="padding.top + 4">100%</text>
            <text :x="padding.left - 8" :y="padding.top + plotHeight / 2 + 4">50%</text>
            <text :x="padding.left - 8" :y="chartHeight - padding.bottom + 4">0%</text>
          </g>

          <!-- Paths -->
          <path :d="discPath" fill="none" stroke="#d4a373" stroke-width="1.5" stroke-dasharray="4 4" />
          <path :d="diffPath" fill="none" stroke="#e07a5f" stroke-width="2" />
          <path :d="passPath" fill="none" stroke="#52796f" stroke-width="2.5" />

          <!-- Points and Indicators -->
          <g v-for="(p, idx) in chartPoints" :key="idx">
            <!-- X Axis Label -->
            <text :x="p.x" :y="chartHeight - 10" text-anchor="middle" class="text-[10px] fill-slate-500 font-mono">{{ p.it.item }}</text>
            
            <!-- Weak item indicator dot -->
            <circle v-if="p.isWeak" :cx="p.x" :cy="chartHeight - 24" r="3" fill="#e07a5f" />

            <!-- Point circles -->
            <circle
              :cx="p.x"
              :cy="p.yP"
              :r="hoveredPoint === p ? 5 : 3.5"
              fill="#52796f"
              stroke="#ffffff"
              stroke-width="1.5"
            />

            <!-- Hover Guideline -->
            <line
              v-if="hoveredPoint === p"
              :x1="p.x"
              :y1="padding.top"
              :x2="p.x"
              :y2="chartHeight - padding.bottom"
              stroke="#cbd5e1"
              stroke-width="1"
              stroke-dasharray="3 3"
            />

            <!-- Invisible hit rect for easy hover -->
            <rect
              :x="p.x - stepWidth / 2"
              :y="padding.top"
              :width="stepWidth"
              :height="plotHeight"
              fill="transparent"
              class="cursor-pointer"
              @mouseover="hoveredPoint = p"
            />
          </g>
        </svg>

        <!-- Hover Tooltip -->
        <div
          v-if="hoveredPoint"
          class="absolute z-30 bg-slate-900/95 backdrop-blur-xs text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs pointer-events-none transition-all duration-150 min-w-[170px]"
          :style="{
            left: `${Math.min(chartWidth - 190, Math.max(10, hoveredPoint.x - 85))}px`,
            top: `${Math.max(10, hoveredPoint.yP - 95)}px`
          }"
        >
          <div class="mb-1 border-b border-slate-700 pb-1 font-bold text-emerald-300">
            第 {{ hoveredPoint.it.item }} 題 (正解: {{ hoveredPoint.it.key }})
          </div>
          <div class="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]">
            <span class="text-slate-400">通過率 (P):</span>
            <span class="font-bold text-emerald-400 text-right">{{ (hoveredPoint.it.passRate * 100).toFixed(1) }}%</span>

            <span class="text-slate-400">難度 (Index):</span>
            <span class="text-amber-300 text-right">{{ (hoveredPoint.it.difficulty * 100).toFixed(1) }}%</span>

            <span class="text-slate-400">鑑別度 (D):</span>
            <span class="text-yellow-300 text-right">{{ hoveredPoint.it.discrim.toFixed(2) }}</span>

            <span class="text-slate-400">點二系列:</span>
            <span class="text-slate-200 text-right">{{ hoveredPoint.it.pBis }}</span>

            <span class="text-slate-400">診斷建議:</span>
            <span :class="hoveredPoint.it.warning === '正常' ? 'text-emerald-300' : 'text-rose-400 font-bold'" class="text-right">
              {{ hoveredPoint.it.warning }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2 text-center text-[11px] text-slate-400">
      <span class="inline-flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-[#e07a5f]"></span>
        題號上方的紅點表示該題通過率低於 40% 或鑑別度低於 0.20，建議檢視題意敘述或誘答選項設計。
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  itemsData: {
    type: Array,
    default: () => []
  }
})

const hoveredPoint = ref(null)

const padding = { top: 30, right: 35, bottom: 45, left: 45 }
const chartHeight = 240
const plotHeight = chartHeight - padding.top - padding.bottom

const chartWidth = computed(() => {
  const n = props.itemsData.length
  return Math.max(760, n * 34)
})

const plotWidth = computed(() => chartWidth.value - padding.left - padding.right)
const stepWidth = computed(() => plotWidth.value / Math.max(1, props.itemsData.length - 1))

const chartPoints = computed(() => {
  const n = props.itemsData.length
  if (n === 0) return []

  return props.itemsData.map((it, idx) => {
    const x = padding.left + (idx / Math.max(1, n - 1)) * plotWidth.value
    const yP = chartHeight - padding.bottom - (Math.max(0, Math.min(1, it.passRate)) * plotHeight)
    const yDiff = chartHeight - padding.bottom - (Math.max(0, Math.min(1, it.difficulty)) * plotHeight)
    const yDisc = chartHeight - padding.bottom - (Math.max(0, Math.min(1, it.discrim)) * plotHeight)
    const isWeak = (it.passRate < 0.40 || it.discrim < 0.20 || it.warning !== '正常')
    return { it, x, yP, yDiff, yDisc, isWeak }
  })
})

const passPath = computed(() => {
  return chartPoints.value.map((p, i) => (i === 0 ? `M ${p.x} ${p.yP}` : `L ${p.x} ${p.yP}`)).join(' ')
})

const diffPath = computed(() => {
  return chartPoints.value.map((p, i) => (i === 0 ? `M ${p.x} ${p.yDiff}` : `L ${p.x} ${p.yDiff}`)).join(' ')
})

const discPath = computed(() => {
  return chartPoints.value.map((p, i) => (i === 0 ? `M ${p.x} ${p.yDisc}` : `L ${p.x} ${p.yDisc}`)).join(' ')
})
</script>
