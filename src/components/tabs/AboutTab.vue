<template>
  <div class="space-y-5 min-w-0 max-w-full">
    <!-- Main Specifications Card -->
    <div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs min-w-0 max-w-full overflow-hidden break-words">
      <!-- Title Header -->
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 class="text-base sm:text-lg font-black text-[#203b46] flex items-center gap-2 m-0">
            <BookOpen class="w-5 h-5 text-[#52796f] shrink-0" />
            <span>SAAA 演算法規格與四捨五入核心 (0.00 標準)</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1 m-0 font-medium">
            設計完全遵循 SAAA 官方 R 語言原始腳本 (114M3+1A.R / 35_ctt.R) 心理計量演算法
          </p>
        </div>
        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-[#edf2ee] border border-[#52796f]/30 rounded-lg text-xs font-bold text-[#354f52]">
          <Binary class="w-3.5 h-3.5 text-[#52796f]" />
          <span>BigInt 0.00 零浮點誤差</span>
        </div>
      </div>

      <!-- Specs Content Sections -->
      <div class="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed min-w-0 max-w-full">
        
        <!-- Section 1: Pure Integer Round-Half-Up -->
        <div class="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl min-w-0 max-w-full overflow-hidden">
          <div class="flex items-center gap-2 mb-1.5">
            <Calculator class="w-4 h-4 text-[#52796f] shrink-0" />
            <h3 class="text-sm font-black text-[#354f52] m-0">
              1. 純整數 BigInt 算術四捨五入 (Pure Integer Round-Half-Up 至 0.00)
            </h3>
          </div>
          <p class="text-slate-600 m-0">
            傳統 JavaScript / Python 浮點數常因 IEEE 754 二進位微差產生「0.605 變成 0.60」或「0.435 變成 0.43」的非預期捨入誤差。本系統採用純整數算術演算法，在整數域（BigInt）完成四捨五入後再行輸出：
          </p>

          <!-- Formula Card -->
          <div class="mt-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs min-w-0 max-w-full">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-bold text-[#354f52] flex items-center gap-1.5">
                <span class="w-1.5 h-3.5 bg-[#52796f] rounded-full inline-block"></span>
                四捨五入核心數學公式
              </span>
              <span class="text-[11px] text-slate-400 font-mono">100% 納準對齊 R 語言標準規範</span>
            </div>

            <!-- Mathematical Typography Block -->
            <div class="py-2.5 px-3 bg-[#f8faf9] border border-slate-200/70 rounded-lg overflow-x-auto max-w-full">
              <div class="flex items-center gap-2 font-serif text-slate-800 text-xs sm:text-sm min-w-max">
                <span class="italic font-bold">Rounded</span>
                <span>=</span>
                <span class="text-base sm:text-lg select-none">⌊</span>
                <div class="inline-flex flex-col items-center justify-center px-1">
                  <span class="border-b border-slate-700 pb-0.5 px-1 font-sans">
                    2 · 10<sup>digits</sup> · |k| + |n|
                  </span>
                  <span class="pt-0.5 px-1 font-sans">
                    2 · |n|
                  </span>
                </div>
                <span class="text-base sm:text-lg select-none">⌋</span>
                <span>·</span>
                <span class="italic font-bold">sgn(k/n)</span>
                <span>÷</span>
                <span class="font-sans">10<sup>digits</sup></span>
              </div>
            </div>

            <!-- BigInt Implementation Code Block -->
            <div class="mt-2.5 p-2.5 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto max-w-full font-mono text-[11px] sm:text-xs">
              <div class="text-emerald-400">// BigInt 純整數實作 (以通過率/難度 k 人、總人數 n 為例)</div>
              <div class="whitespace-nowrap mt-1">
                <span class="text-purple-400">const</span> roundedInt = (2n * factor * kAbs + nAbs) / (2n * nAbs);
              </div>
            </div>

            <!-- Variable Legend -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600 font-sans">
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">k</span>
                <span>分子（如答對人數、各選項選答次數）</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">n</span>
                <span>分母（如有效受試總人數、樣本數）</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">digits</span>
                <span>取位精度（預設為 2，即精確四捨五入至 0.00）</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">//</span>
                <span>整數無條件捨去除法，絕無 IEEE 754 二進位微差</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Mastery 3-Tier Classification -->
        <div class="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl min-w-0 max-w-full overflow-hidden">
          <div class="flex items-center gap-2 mb-1.5">
            <Sliders class="w-4 h-4 text-[#52796f] shrink-0" />
            <h3 class="text-sm font-black text-[#354f52] m-0">
              2. 精熟等級三級劃分規則 (精熟 / 基礎 / 待加強)
            </h3>
          </div>
          <p class="text-slate-600 m-0">
            在試題分析中提供 6 組選答率矩陣（全體、精熟、基礎、待加強、高分組、低分組）；在成績計算中提供【扣除特殊生】與【含特殊生】併列呈現的等級描述總表。未輸入門檻時，系統純粹分析試題品質與原始總分，安全略過等級判定。
          </p>

          <div class="mt-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs min-w-0 max-w-full">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <div class="font-black text-emerald-800 text-sm flex items-center justify-between">
                  <span>精熟 (Mastery)</span>
                  <span class="text-[10px] px-1.5 py-0.5 bg-emerald-200/70 text-emerald-900 rounded font-bold">最高等級</span>
                </div>
                <div class="mt-1.5 text-emerald-900 font-medium">答對題數 ≥ 手動輸入之精熟門檻題數</div>
              </div>
              <div class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div class="font-black text-amber-800 text-sm flex items-center justify-between">
                  <span>基礎 (Basic)</span>
                  <span class="text-[10px] px-1.5 py-0.5 bg-amber-200/70 text-amber-900 rounded font-bold">基準等級</span>
                </div>
                <div class="mt-1.5 text-amber-900 font-medium">基礎門檻 ≤ 答對題數 &lt; 精熟門檻</div>
              </div>
              <div class="p-3 bg-rose-50/80 border border-rose-200 rounded-xl">
                <div class="font-black text-rose-800 text-sm flex items-center justify-between">
                  <span>待加強 (Needs Imp.)</span>
                  <span class="text-[10px] px-1.5 py-0.5 bg-rose-200/70 text-rose-900 rounded font-bold">需輔導</span>
                </div>
                <div class="mt-1.5 text-rose-900 font-medium">答對題數 &lt; 基礎門檻題數</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Kelley 27% & MidXX -->
        <div class="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl min-w-0 max-w-full overflow-hidden">
          <div class="flex items-center gap-2 mb-1.5">
            <Sparkles class="w-4 h-4 text-[#52796f] shrink-0" />
            <h3 class="text-sm font-black text-[#354f52] m-0">
              3. Kelley 27% 鐵律分群與動態 midXX 標籤
            </h3>
          </div>
          <p class="text-slate-600 m-0">
            高低分組嚴格取 Kelley 經典 27% 極端組切點，中分組比例與欄位標籤皆由演算法動態決定，組名精確對齊 R 語言輸出（如 mid67, mid69, mid70）：
          </p>

          <!-- Formula Card -->
          <div class="mt-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs min-w-0 max-w-full">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-bold text-[#354f52] flex items-center gap-1.5">
                <span class="w-1.5 h-3.5 bg-[#52796f] rounded-full inline-block"></span>
                中分組比例與動態欄位標籤公式
              </span>
              <span class="text-[11px] text-slate-400 font-mono">對齊 114M3+1A.R 動態命名</span>
            </div>

            <!-- Mathematical Typography Block -->
            <div class="py-2.5 px-3 bg-[#f8faf9] border border-slate-200/70 rounded-lg overflow-x-auto max-w-full space-y-2">
              <div class="flex items-center gap-2 font-serif text-slate-800 text-xs sm:text-sm min-w-max">
                <span class="italic font-bold">Ratio<sub>mid</sub></span>
                <span>=</span>
                <span class="font-sans">1.0</span>
                <span>−</span>
                <span class="italic font-bold">Ratio<sub>hn</sub></span>
                <span>−</span>
                <span class="font-sans">0.27</span>
                <span>−</span>
                <span class="font-sans">0.01</span>
              </div>
              <div class="flex items-center gap-2 font-serif text-slate-800 text-xs sm:text-sm min-w-max border-t border-slate-200/60 pt-1.5">
                <span class="italic font-bold">ColName</span>
                <span>=</span>
                <span class="font-sans text-xs bg-slate-200/80 px-1.5 py-0.5 rounded text-[#0f766e] font-bold">"mid"</span>
                <span>+</span>
                <span class="text-base select-none">⌊</span>
                <span class="font-sans">100 · (0.27 + <span class="italic font-serif">Ratio<sub>mid</sub></span>)</span>
                <span class="text-base select-none">⌋</span>
              </div>
            </div>

            <!-- Variable Legend -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600 font-sans">
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">Ratio<sub>hn</sub></span>
                <span>高分組門檻依 27% 切出之實際同分人數比例（四捨五入至 2 位）</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">0.27</span>
                <span>低分組 Kelley 極端組經典切點比例 (27%)</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">0.01</span>
                <span>R 語言原始分群腳本邊界保護偏移常數</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="font-mono font-bold text-[#354f52] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">輸出實例</span>
                <span>動態對齊 R 語言輸出，如 <code class="font-bold text-[#0f766e]">mid67</code>、<code class="font-bold text-[#0f766e]">mid69</code>、<code class="font-bold text-[#0f766e]">mid70</code></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Psychometrics (Alpha & Point-Biserial) -->
        <div class="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl min-w-0 max-w-full overflow-hidden">
          <div class="flex items-center gap-2 mb-1.5">
            <BookOpen class="w-4 h-4 text-[#52796f] shrink-0" />
            <h3 class="text-sm font-black text-[#354f52] m-0">
              4. 心理計量統計公式 (Cronbach's α 與點二系列相關)
            </h3>
          </div>
          <p class="text-slate-600 m-0">
            全卷信度採無偏樣本變異數（分母自由度 N - 1），選項誘答品質與試題鑑別度採皮爾森點二系列相關（Point-Biserial Correlation），提供專業教育測驗統計指標：
          </p>

          <!-- Formula Card -->
          <div class="mt-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs min-w-0 max-w-full">
            <div class="py-2.5 px-3 bg-[#f8faf9] border border-slate-200/70 rounded-lg overflow-x-auto max-w-full space-y-2.5">
              <!-- Cronbach's Alpha -->
              <div class="flex items-center gap-2 font-serif text-slate-800 text-xs sm:text-sm min-w-max">
                <span class="italic font-bold">α</span>
                <span>=</span>
                <div class="inline-flex flex-col items-center justify-center px-1">
                  <span class="border-b border-slate-700 pb-0.5 px-1 font-sans">k</span>
                  <span class="pt-0.5 px-1 font-sans">k − 1</span>
                </div>
                <span>·</span>
                <span>(</span>
                <span class="font-sans">1</span>
                <span>−</span>
                <div class="inline-flex flex-col items-center justify-center px-1">
                  <span class="border-b border-slate-700 pb-0.5 px-1 font-sans">∑ s<sub>i</sub><sup>2</sup></span>
                  <span class="pt-0.5 px-1 font-sans">s<sub>total</sub><sup>2</sup></span>
                </div>
                <span>)</span>
                <span class="font-sans text-[11px] text-slate-400 ml-2">（全卷信度，無偏變異數 ddof = 1）</span>
              </div>

              <!-- Point-Biserial -->
              <div class="flex items-center gap-2 font-serif text-slate-800 text-xs sm:text-sm min-w-max border-t border-slate-200/60 pt-2">
                <span class="italic font-bold">r<sub>pbi</sub></span>
                <span>=</span>
                <div class="inline-flex flex-col items-center justify-center px-1">
                  <span class="border-b border-slate-700 pb-0.5 px-1 font-sans">N · ∑ XY − ∑ X · ∑ Y</span>
                  <span class="pt-0.5 px-1 font-sans">√[ (N · ∑ X<sup>2</sup> − (∑ X)<sup>2</sup>) · (N · ∑ Y<sup>2</sup> − (∑ Y)<sup>2</sup>) ]</span>
                </div>
                <span class="font-sans text-[11px] text-slate-400 ml-2">（點二系列相關，雙系列分析）</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen, Calculator, Sliders, Binary, Sparkles } from '@lucide/vue'
</script>
