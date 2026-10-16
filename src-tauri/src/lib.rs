use tauri_plugin_dialog::{DialogExt, FilePath};

/// 接收前端傳來的 Vec<u8> (Excel / ZIP / CSV 等二進位或文字資料)，彈出系統原生另存新檔對話框並寫入磁碟
#[tauri::command]
async fn save_bytes(
    app: tauri::AppHandle,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let (tx, rx) = std::sync::mpsc::channel::<Option<FilePath>>();

    let mut dialog = app.dialog().file().set_file_name(&filename);
    if filename.ends_with(".xlsx") {
        dialog = dialog.add_filter("Excel 活頁簿 (*.xlsx)", &["xlsx"]);
    } else if filename.ends_with(".zip") {
        dialog = dialog.add_filter("ZIP 壓縮檔 (*.zip)", &["zip"]);
    } else if filename.ends_with(".csv") {
        dialog = dialog.add_filter("CSV 檔案 (*.csv)", &["csv"]);
    } else {
        dialog = dialog.add_filter("所有檔案 (*.*)", &["*"]);
    }

    dialog.save_file(move |path| {
        let _ = tx.send(path);
    });

    match rx.recv() {
        Ok(Some(file_path)) => {
            let path = file_path.into_path()
                .map_err(|e| format!("路徑轉換失敗：{}", e))?;
            std::fs::write(&path, &data)
                .map_err(|e| format!("寫入檔案失敗：{}", e))?;
            Ok(path.to_string_lossy().to_string())
        }
        Ok(None) => Err("使用者取消".to_string()),
        Err(e) => Err(format!("對話框錯誤：{}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_bytes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
