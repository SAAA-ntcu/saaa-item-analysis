<template>
  <main class="w-full max-w-[1500px] mx-auto px-3 sm:px-6 my-6 relative select-none">
    <!-- Main Notebook Shell (Morandi Sage/Slate Gradient) -->
    <div class="relative rounded-[2.5rem] p-3 sm:p-5 md:p-6 shadow-2xl shadow-slate-900/15 border-y-4 border-x-[12px] border-white/35 bg-gradient-to-br from-[#729289] to-[#5f7e76]">
      
      <!-- Binder Spine Loops (Left Side Rings: Graphite Slate & Terracotta) -->
      <div class="hidden md:flex absolute left-0 top-10 bottom-12 w-40 flex-col justify-start items-start gap-4 z-30 pointer-events-none transform -translate-x-[34px] overflow-hidden h-[calc(100%-5.5rem)] pb-2">
        <div
          v-for="idx in 26"
          :key="idx"
          class="spine-loop"
        >
          <div class="spine-inner"></div>
          <div class="spine-outer"></div>
        </div>
      </div>

      <!-- Top Ribbon Bookmarks (Oat Mustard & Vintage Slate) -->
      <div
        class="ribbon-bookmark ribbon-oat"
        @click="$emit('switch-tab', 'ctt')"
        title="快速切換至試題分析"
      ></div>
      <div
        class="ribbon-bookmark ribbon-slate"
        @click="$emit('switch-tab', 'scoring')"
        title="快速切換至成績計算"
      ></div>

      <!-- Right Index Tabs (Rose, Apricot, Sage) -->
      <div class="hidden lg:flex flex-col space-y-6 absolute -right-6 top-36 z-0">
        <div
          class="index-tab tab-rose"
          @click="$emit('switch-tab', 'ctt')"
          title="試題分析 (CTT)"
        >
          試題分析
        </div>
        <div
          class="index-tab tab-apricot"
          @click="$emit('switch-tab', 'scoring')"
          title="成績計算 (Scoring)"
        >
          成績計算
        </div>
        <div
          class="index-tab tab-sage"
          @click="$emit('switch-tab', 'batch')"
          title="全科批次 (Batch)"
        >
          全科批次
        </div>
      </div>

      <!-- Inner Notebook White Paper Page -->
      <div class="bg-[#fcfdfd] rounded-[2rem] px-3 py-6 sm:px-6 md:pl-20 md:pr-10 shadow-inner min-h-[720px] flex flex-col justify-start relative z-10 border border-slate-100">
        <slot />
      </div>

      <!-- Bottom Left Boy Illustration -->
      <div class="hidden md:block absolute -bottom-12 -left-8 w-36 lg:w-44 z-30 pointer-events-none transform hover:scale-105 transition-transform duration-300">
        <img
          src="/images/read_boy.png"
          alt="認真讀書男孩"
          class="w-full h-auto drop-shadow-md"
          loading="lazy"
          onerror="this.style.display='none'"
        />
      </div>

      <!-- Bottom Right Girl Illustration -->
      <div class="hidden md:block absolute -bottom-12 -right-8 w-36 lg:w-44 z-30 pointer-events-none transform hover:scale-105 transition-transform duration-300">
        <img
          src="/images/read_girl.png"
          alt="好好學習女孩"
          class="w-full h-auto drop-shadow-md"
          loading="lazy"
          onerror="this.style.display='none'"
        />
      </div>

    </div>
  </main>
</template>

<script setup>
defineEmits(['switch-tab'])
</script>
