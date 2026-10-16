<template>
  <header class="fixed top-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-b-2 border-[#52796f] shadow-xs z-50 flex items-center justify-between px-4 sm:px-6">
    <!-- Left Logo & Title -->
    <div class="flex items-center gap-3 cursor-pointer select-none group" @click="$emit('switch-tab', 'ctt')" title="回首頁">
      <img src="/images/saaa-logo-icon.svg" alt="SAAA Logo" class="h-10 w-auto group-hover:scale-105 transition-transform" />
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
    <nav class="hidden md:flex items-center gap-1 sm:gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="$emit('switch-tab', tab.key)"
        class="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === tab.key
          ? 'bg-[#edf2ee] text-[#354f52] font-bold shadow-2xs ring-1 ring-[#52796f]/25'
          : 'text-slate-600 hover:bg-[#f4f7f5] hover:text-[#52796f]'"
      >
        <span>{{ tab.icon }}</span>
        <span>{{ tab.title }}</span>
      </button>
    </nav>

    <!-- Right Mode Capsule -->
    <div class="flex items-center gap-2">
      <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200/90 rounded-xl bg-white shadow-2xs text-xs text-slate-700">
        <span class="px-2 py-0.5 rounded-md font-bold text-xs bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
          Vue 3 旗艦版
        </span>
        <span class="font-bold text-slate-800">純 JS 離線運算 · 0.00 規範</span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'ctt'
  }
})

defineEmits(['switch-tab'])

const tabs = [
  { key: 'ctt', title: '試題分析 (CTT)', icon: '📊' },
  { key: 'scoring', title: '成績計算 (Scoring)', icon: '📝' },
  { key: 'batch', title: '全科批次處理 (Batch)', icon: '🚀' },
  { key: 'about', title: '演算法規格 (Specs)', icon: 'ℹ️' }
]
</script>
