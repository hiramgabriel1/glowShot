use base64::{engine::general_purpose::STANDARD, Engine};
use image::ImageEncoder;
use tauri::Emitter;
use tauri::Manager;

#[cfg(target_os = "macos")]
fn run_interactive_screencapture_to_clipboard() -> std::io::Result<std::process::ExitStatus> {
  std::process::Command::new("/usr/sbin/screencapture")
    .args(["-i", "-c"])
    .status()
}

/// Portapapeles (imagen RGBA) → data URL PNG para el frontend.
fn clipboard_to_png_data_url() -> Option<String> {
  let mut cb = arboard::Clipboard::new().ok()?;
  let img = cb.get_image().ok()?;
  let w = img.width as u32;
  let h = img.height as u32;
  let raw = img.bytes.as_ref();
  let expected = (w as usize).checked_mul(h as usize)?.checked_mul(4)?;
  if raw.len() < expected {
    return None;
  }
  let packed = raw[..expected].to_vec();
  let mut png_out = Vec::new();
  let encoder = image::codecs::png::PngEncoder::new(&mut png_out);
  encoder
    .write_image(&packed, w, h, image::ExtendedColorType::Rgba8)
    .ok()?;
  Some(format!(
    "data:image/png;base64,{}",
    STANDARD.encode(&png_out)
  ))
}

fn spawn_snap_select(app: tauri::AppHandle) {
  let app = app.clone();
  std::thread::spawn(move || {
    #[cfg(target_os = "macos")]
    {
      match run_interactive_screencapture_to_clipboard() {
        Ok(s) if s.success() => {
          if let Some(data_url) = clipboard_to_png_data_url() {
            let _ = app.emit(
              "snap-import",
              serde_json::json!({ "dataUrl": data_url }),
            );
            if let Some(w) = app.get_webview_window("main") {
              let _ = w.unminimize();
              let _ = w.show();
              let _ = w.set_focus();
            }
          }
        }
        _ => {}
      }
    }
    #[cfg(not(target_os = "macos"))]
    {
      let _ = app.emit("snap-select-unavailable", ());
      if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
      }
    }
  });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray_menubar.png"))?;
      let show_i =
        tauri::menu::MenuItem::with_id(app, "show", "Mostrar GlowShot", true, None::<&str>)?;
      let snap_i = tauri::menu::MenuItem::with_id(
        app,
        "snap_select",
        "Seleccionar snap…",
        true,
        None::<&str>,
      )?;
      let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
      let menu = tauri::menu::Menu::with_items(app, &[&show_i, &snap_i, &quit_i])?;

      let _tray = tauri::tray::TrayIconBuilder::new()
        .icon(tray_icon)
        .icon_as_template(false)
        .menu(&menu)
        .tooltip("GlowShot")
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "quit" => {
            app.exit(0);
          }
          "show" => {
            if let Some(w) = app.get_webview_window("main") {
              let _ = w.unminimize();
              let _ = w.show();
              let _ = w.set_focus();
            }
          }
          "snap_select" => {
            spawn_snap_select(app.clone());
          }
          _ => {}
        })
        .build(app)?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
