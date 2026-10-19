<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modalState.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none"
        @click.self="cancelModal"
      >
        <div
          class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-white/70 transform transition-all duration-200 scale-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          <!-- Top Accent Ribbon -->
          <div
            class="w-20 h-1.5 rounded-full mb-4"
            :class="{
              'bg-[#e9c46a]': modalState.type === 'warning',
              'bg-[#e07a5f]': modalState.type === 'error',
              'bg-[#52796f]': modalState.type === 'success',
              'bg-slate-400': modalState.type === 'info'
            }"
          ></div>

          <!-- Icon Badge -->
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xs"
            :class="{
              'bg-[#fbf9f2] border border-[#e9c46a]/50 text-[#b88728]': modalState.type === 'warning',
              'bg-[#fdf3f2] border border-[#e07a5f]/40 text-[#c85a3a]': modalState.type === 'error',
              'bg-[#edf4f0] border border-[#52796f]/40 text-[#52796f]': modalState.type === 'success',
              'bg-slate-50 border border-slate-200 text-slate-600': modalState.type === 'info'
            }"
          >
            <AlertTriangle v-if="modalState.type === 'warning'" class="w-7 h-7" />
            <AlertCircle v-else-if="modalState.type === 'error'" class="w-7 h-7" />
            <CheckCircle2 v-else-if="modalState.type === 'success'" class="w-7 h-7" />
            <Info v-else class="w-7 h-7" />
          </div>

          <!-- Title -->
          <h3 class="text-base font-black text-slate-800 m-0 mb-1.5">
            {{ modalState.title }}
          </h3>

          <!-- Message Body -->
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line m-0 mb-6 px-2">
            {{ modalState.message }}
          </p>

          <!-- Action Buttons -->
          <div class="flex items-center justify-center gap-3 w-full">
            <button
              v-if="modalState.cancelText"
              type="button"
              @click="cancelModal"
              class="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {{ modalState.cancelText }}
            </button>
            <button
              type="button"
              @click="confirmModal"
              class="flex-1 py-2.5 px-4 bg-[#52796f] hover:bg-[#354f52] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {{ modalState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from '@lucide/vue'
import { useToast } from '@/composables/useToast.js'

const { modalState, confirmModal, cancelModal } = useToast()
</script>
