<template>
  <div class="flex flex-col min-h-screen pt-16 pb-20 select-none">
    <!-- Fixed Top Header -->
    <AppHeader :active-tab="currentTab" @switch-tab="switchTab" />

    <!-- Notebook Frame Shell -->
    <NotebookFrame @switch-tab="switchTab">
      <!-- Tab 1: CTT Item Analysis -->
      <CttTab v-show="currentTab === 'ctt'" @log="addLog" />

      <!-- Tab 2: Score Calculation -->
      <ScoringTab v-show="currentTab === 'scoring'" @log="addLog" />

      <!-- Tab 3: Batch Pipeline -->
      <BatchTab v-show="currentTab === 'batch'" @log="addLog" />

      <!-- Tab 4: About / Specs -->
      <AboutTab v-show="currentTab === 'about'" />

      <!-- Live Console Log Viewer -->
      <div class="mt-5 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <h4 class="text-xs font-bold text-slate-700 flex items-center gap-1.5 m-0">
            <svg class="w-4 h-4 text-[#52796f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            系統執行日誌 (Live Console)
          </h4>
          <button
            type="button"
            @click="logs = ['系統已就緒。試題分析與成績計算雙引擎可獨立運行。']"
            class="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            清空日誌
          </button>
        </div>
        <div class="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs max-h-36 overflow-y-auto space-y-1">
          <div v-for="(log, idx) in logs" :key="idx" class="whitespace-pre-wrap leading-relaxed">{{ log }}</div>
        </div>
      </div>
    </NotebookFrame>

    <!-- Fixed Bottom Footer -->
    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import NotebookFrame from './components/layout/NotebookFrame.vue'
import AppFooter from './components/layout/AppFooter.vue'
import CttTab from './components/tabs/CttTab.vue'
import ScoringTab from './components/tabs/ScoringTab.vue'
import BatchTab from './components/tabs/BatchTab.vue'
import AboutTab from './components/tabs/AboutTab.vue'

const currentTab = ref('ctt')
const logs = ref([
  '系統已就緒。試題分析與成績計算雙引擎可獨立運行。',
  '已載入 Morandi Notebook 手帳設計語彙與 BigInt 0.00 演算法規範。'
])

function switchTab(tabKey) {
  currentTab.value = tabKey
}

function addLog(msg) {
  const time = new Date().toLocaleTimeString()
  logs.value.push(`[${time}] ${msg}`)
}
</script>
