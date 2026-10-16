<template>
  <div class="space-y-5">
    <div class="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <BookOpen class="w-5 h-5 text-[#52796f]" />
            SAAA 演算法規格與四捨五入核心 (0.00 標準)
          </h2>
          <p class="text-xs text-slate-400 mt-0.5 m-0 font-medium">
            設計完全遵循 SAAA 官方 R 語言原始腳本 (114M3+1A.R / 35_ctt.R) 心理計量演算法
          </p>
        </div>
      </div>

      <div class="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <h3 class="text-sm font-black text-[#354f52] mb-1">
            1. 純整數 BigInt 算術四捨五入 (Pure Integer Round-Half-Up 至 0.00)
          </h3>
          <p class="text-slate-600 m-0">
            傳統 JavaScript / Python 浮點數常因 IEEE 754 二進位微差產生「0.605 變成 0.60」或「0.435 變成 0.43」的非預期捨入誤差。本系統採用純整數演算法：<br />
            <code class="inline-block mt-1 px-2.5 py-1 bg-white border border-slate-200 rounded font-mono text-[#0f766e] font-bold">
              (2 * 10^digits * |k| + |n|) // (2 * |n|)
            </code><br />
            搭配 BigInt 與正負號嚴格保護，確保通過率、難度指數、鑑別度與選答率 100% 精準對齊 R 語言標準規範。
          </p>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <h3 class="text-sm font-black text-[#354f52] mb-1">
            2. 精熟等級三級劃分規則 (精熟 / 基礎 / 待加強)
          </h3>
          <p class="text-slate-600 m-0">
            • <strong class="text-emerald-700">精熟 (Mastery)</strong>：答對題數 ≥ 手動輸入之精熟門檻題數。<br />
            • <strong class="text-amber-700">基礎 (Basic)</strong>：答對題數 ≥ 手動輸入之基礎門檻題數，且小於精熟門檻。<br />
            • <strong class="text-rose-700">待加強 (Needs Improvement)</strong>：答對題數 &lt; 基礎門檻題數。<br />
            在試題分析中提供 6 組選答率矩陣（全體、精熟、基礎、待加強、高分組、低分組）；在成績計算中提供【扣除特殊生】與【含特殊生】併列呈現的等級描述總表。未輸入門檻時，系統純粹分析試題品質與原始總分，安全略過等級判定。
          </p>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <h3 class="text-sm font-black text-[#354f52] mb-1">
            3. Kelley 27% 鐵律分群與動態 midXX 標籤
          </h3>
          <p class="text-slate-600 m-0">
            高低分組嚴格取 Kelley 經典 27% 極端組切點，中分組比例由公式
            <code class="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[#0f766e]">1.0 - hn_ratio - 0.27 - 0.01</code>
            動態決定，組名精確對齊 R 語言輸出（如 <code class="font-bold">mid67</code>, <code class="font-bold">mid69</code>, <code class="font-bold">mid70</code>）。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen } from '@lucide/vue'
</script>
