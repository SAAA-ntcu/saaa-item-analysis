<template>
  <div class="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5 w-full max-w-md px-4 pointer-events-none select-none">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto w-full rounded-2xl p-4 shadow-xl shadow-slate-900/10 border backdrop-blur-md flex items-start gap-3 transition-all"
        :class="{
          'bg-[#fbf9f2]/95 border-[#e9c46a]/60 text-[#7d5a16]': toast.type === 'warning',
          'bg-[#fdf3f2]/95 border-[#e07a5f]/40 text-[#9c381e]': toast.type === 'error',
          'bg-[#edf4f0]/95 border-[#52796f]/40 text-[#2d5a52]': toast.type === 'success',
          'bg-[#f4f7f8]/95 border-slate-300/80 text-[#23373b]': toast.type === 'info'
        }"
      >
        <!-- Icon -->
        <div class="shrink-0 mt-0.5">
          <AlertTriangle v-if="toast.type === 'warning'" class="w-5 h-5 text-[#b88728]" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-[#c85a3a]" />
          <CheckCircle2 v-else-if="toast.type === 'success'" class="w-5 h-5 text-[#52796f]" />
          <Info v-else class="w-5 h-5 text-[#476269]" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div v-if="toast.title" class="text-xs font-black tracking-wide mb-0.5">
            {{ toast.title }}
          </div>
          <div class="text-xs font-medium leading-relaxed whitespace-pre-line text-slate-700">
            {{ toast.message }}
          </div>
        </div>

        <!-- Close Button -->
        <button
          type="button"
          @click="removeToast(toast.id)"
          class="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          title="關閉提示"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from '@lucide/vue'
import { useToast } from '@/composables/useToast.js'

const { toasts, removeToast } = useToast()
</script>
