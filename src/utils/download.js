/**
 * 檔案下載工具模組（Tauri 跨平台原生桌面模式 / 瀏覽器模式自動感應切換）
 * 比照 SAAA-Deidentification-Tool 設計
 */

/**
 * 觸發檔案儲存與下載
 * @param {Blob|Uint8Array|ArrayBuffer} content 欲儲存的檔案內容
 * @param {string} filename 預設檔案名稱
 */
export async function triggerDownload(content, filename) {
  // 1. Tauri 桌面原生模式：呼叫 Rust 後端系統原生另存新檔對話框
  if (typeof window !== 'undefined' && (window.__TAURI__ || window.__TAURI_INTERNALS__)) {
    try {
      let uint8Array
      if (content instanceof Uint8Array) {
        uint8Array = content
      } else if (content instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(content)
      } else if (content instanceof Blob) {
        const buf = await content.arrayBuffer()
        uint8Array = new Uint8Array(buf)
      } else {
        uint8Array = new TextEncoder().encode(String(content))
      }

      // 調用 Tauri v2 invoke
      let invokeFn = null
      if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
        invokeFn = window.__TAURI__.core.invoke
      } else if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
        invokeFn = window.__TAURI_INTERNALS__.invoke
      }

      if (invokeFn) {
        const savedPath = await invokeFn('save_bytes', {
          filename,
          data: Array.from(uint8Array)
        })
        if (savedPath) {
          console.log(`[Tauri 原生儲存成功] ${savedPath}`)
          return savedPath
        }
      }
    } catch (err) {
      if (err !== '使用者取消' && err !== 'User cancelled') {
        console.warn('[Tauri 儲存警告，切換回瀏覽器模式]', err)
      } else {
        return null // 使用者主動取消
      }
    }
  }

  // 2. 瀏覽器網頁模式 fallback：建立 Object URL 並觸發點擊
  const blob = content instanceof Blob ? content : new Blob([content])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

export default triggerDownload
