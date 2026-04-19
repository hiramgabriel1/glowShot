use base64::{engine::general_purpose::STANDARD, Engine};
use image::ImageEncoder;
use tauri::Emitter;
use tauri::Manager;

#[derive(serde::Deserialize)]
pub struct CaptureRect {
  x: f64,
  y: f64,
  width: f64,
  height: f64,
  /// Si se indica, se reescala el PNG manteniendo proporción cuando el lado mayor lo supera.
  #[serde(default, rename = "maxSide")]
  max_side: Option<u32>,
}

/// Captura un rectángulo de pantalla (en puntos lógicos, origen top-left de la pantalla principal)
/// usando `/usr/sbin/screencapture`. Necesario porque WebKit/Tauri no rasteriza correctamente
/// `<img>` dentro de `<foreignObject>` (lo que usa `html-to-image`), y la foto desaparece del PNG.
/// La captura nativa coge exactamente lo que el usuario ve en el editor.
#[cfg(target_os = "macos")]
#[tauri::command]
fn capture_screen_rect_png(rect: CaptureRect) -> Result<tauri::ipc::Response, String> {
  let x = rect.x.round() as i32;
  let y = rect.y.round() as i32;
  let w = rect.width.max(1.0).round() as i32;
  let h = rect.height.max(1.0).round() as i32;

  let nanos = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_nanos())
    .unwrap_or(0);
  let tmp_path = std::env::temp_dir().join(format!(
    "glowshot-capture-{}-{nanos}.png",
    std::process::id()
  ));

  let region = format!("{x},{y},{w},{h}");
  let status = std::process::Command::new("/usr/sbin/screencapture")
    .args(["-x", "-t", "png", "-R", &region])
    .arg(&tmp_path)
    .status()
    .map_err(|e| format!("screencapture spawn: {e}"))?;

  if !status.success() {
    let _ = std::fs::remove_file(&tmp_path);
    return Err(format!("screencapture exit: {status:?}"));
  }

  let bytes = std::fs::read(&tmp_path).map_err(|e| format!("read png: {e}"))?;
  let _ = std::fs::remove_file(&tmp_path);

  let final_bytes = match rect.max_side {
    Some(max_side) if max_side > 0 => match image::load_from_memory(&bytes) {
      Ok(img) => {
        let (iw, ih) = (img.width(), img.height());
        if iw.max(ih) > max_side {
          let resized =
            img.resize(max_side, max_side, image::imageops::FilterType::Lanczos3);
          let rgba = resized.to_rgba8();
          let mut out: Vec<u8> = Vec::new();
          let encoder = image::codecs::png::PngEncoder::new(&mut out);
          if encoder
            .write_image(
              &rgba,
              resized.width(),
              resized.height(),
              image::ExtendedColorType::Rgba8,
            )
            .is_ok()
          {
            out
          } else {
            bytes
          }
        } else {
          bytes
        }
      }
      Err(_) => bytes,
    },
    _ => bytes,
  };

  Ok(tauri::ipc::Response::new(final_bytes))
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
fn capture_screen_rect_png(_rect: CaptureRect) -> Result<tauri::ipc::Response, String> {
  Err("Native screen capture is only implemented on macOS".to_string())
}

#[cfg(target_os = "macos")]
mod macos_dock;

fn emit_new_project_request(app: &tauri::AppHandle) {
  let _ = app.emit("new-project-request", ());
  if let Some(w) = app.get_webview_window("main") {
    let _ = w.set_focus();
  }
}

#[cfg(target_os = "macos")]
fn run_interactive_screencapture_to_clipboard() -> std::io::Result<std::process::ExitStatus> {
  std::process::Command::new("/usr/sbin/screencapture")
    .args(["-i", "-c"])
    .status()
}

/* Convert a clipboard image to a PNG data URL */
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

/* Spawn a thread to capture a screenshot and emit it to the main window */
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
  let builder = {
    let b = tauri::Builder::default()
      .plugin(tauri_plugin_dialog::init())
      .plugin(tauri_plugin_fs::init())
      .plugin(tauri_plugin_clipboard_manager::init())
      .invoke_handler(tauri::generate_handler![capture_screen_rect_png]);
    #[cfg(desktop)]
    {
      b.menu(|app| {
        use tauri::menu::{Menu, MenuItem, Submenu};
        Menu::with_items(app, &[&Submenu::with_items(
          app,
          "Archivo",
          true,
          &[&MenuItem::with_id(
            app,
            "new_project",
            "Nuevo proyecto",
            true,
            None::<&str>,
          )?],
        )?])
      })
      .on_menu_event(|app, event| {
        if event.id() == "new_project" {
          emit_new_project_request(app);
        }
      })
    }
    #[cfg(not(desktop))]
    {
      b
    }
  };

  builder
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
      let new_project_i = tauri::menu::MenuItem::with_id(
        app,
        "new_project",
        "Nuevo proyecto",
        true,
        None::<&str>,
      )?;
      let snap_i = tauri::menu::MenuItem::with_id(
        app,
        "snap_select",
        "Seleccionar snap…",  
        true,
        None::<&str>,
      )?;
      let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
      let menu = tauri::menu::Menu::with_items(
        app,
        &[&show_i, &new_project_i, &snap_i, &quit_i],
      )?;

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
          "new_project" => {
            emit_new_project_request(app);
          }
          "snap_select" => {
            spawn_snap_select(app.clone());
          }
          _ => {}
        })
        .build(app)?;

      #[cfg(target_os = "macos")]
      {
        if let Err(e) = macos_dock::install(&app.handle()) {
          log::warn!("dock menu: {e}");
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
