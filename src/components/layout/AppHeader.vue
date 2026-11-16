<template>
  <header class="fixed top-0 left-0 right-0 md:h-[68px] bg-white/95 backdrop-blur-md border-b-2 border-[#52796f] shadow-xs z-50 flex flex-wrap md:flex-nowrap items-center justify-between px-4 sm:px-6">
    <!-- Left Logo & Title -->
    <div class="flex items-center gap-3 w-full h-[68px] md:w-auto md:h-auto shrink-0 cursor-pointer select-none group" @click="$emit('switch-tab', 'ctt')" title="回首頁">
      <img :src="logoIcon" alt="SAAA Logo" class="h-10 w-auto group-hover:scale-105 transition-transform" />
      <div class="flex flex-col justify-center">
        <h1 class="text-base sm:text-lg font-black text-[#203b46] tracking-wide leading-tight group-hover:text-[#52796f] transition-colors m-0">
          縣市學生學習能力檢測
        </h1>
        <p class="text-[9px] sm:text-[10px] text-[#5f7f6f] uppercase font-bold tracking-wider m-0 font-sans">
          Students' Academic Attainment Assessment
        </p>
      </div>
    </div>

    <!-- Center Navigation Tabs -->
    <nav class="flex items-center gap-1 sm:gap-2 w-full md:w-auto md:ml-4 min-w-0 overflow-x-auto pb-2 md:pb-0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="$emit('switch-tab', tab.key)"
        class="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
        :class="activeTab === tab.key
          ? 'bg-[#edf2ee] text-[#354f52] font-bold shadow-2xs ring-1 ring-[#52796f]/25'
          : 'text-slate-600 hover:bg-[#f4f7f5] hover:text-[#52796f]'"
      >
        <component :is="tab.icon" class="w-4 h-4 shrink-0" />
        <span>{{ tab.title }}</span>
      </button>
    </nav>
  </header>
</template>

<script setup>
import { BarChart3, GraduationCap, Layers, BookOpen } from '@lucide/vue'
import logoIcon from '@/assets/images/saaa-logo-icon.svg'

defineProps({
  activeTab: {
    type: String,
    default: 'ctt'
  }
})

defineEmits(['switch-tab'])

const tabs = [
  { key: 'ctt', title: '試題分析 (CTT)', icon: BarChart3 },
  { key: 'scoring', title: '成績計算 (Scoring)', icon: GraduationCap },
  { key: 'batch', title: '全科批次處理 (Batch)', icon: Layers },
  { key: 'about', title: '演算法規格 (Specs)', icon: BookOpen }
]
</script>
