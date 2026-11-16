<template>
  <footer class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#52796f] shadow-[0_-4px_20px_rgba(47,62,70,0.06)] py-2 transition-colors">
    <div class="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-1 text-center text-slate-600 text-[11px] sm:text-xs">
      <!-- Copyright -->
      <div class="flex flex-wrap items-center justify-center gap-x-2 text-slate-500 text-[10px] sm:text-[11px] font-medium">
        <span class="inline-flex items-center gap-1.5">
          <img :src="logoIcon" alt="SAAA" class="w-4 h-4 object-contain inline-block shrink-0" />
          <span>&copy; 國立臺中教育大學 ｜ 測驗統計與適性學習研究中心</span>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import logoIcon from '@/assets/images/saaa-logo-icon.svg'
</script>
