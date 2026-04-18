use objc2::define_class;
use objc2::msg_send;
use objc2::rc::Retained;
use objc2::runtime::{AnyObject, NSObjectProtocol};
use objc2::sel;
use objc2_app_kit::{NSApplication, NSMenu};
use objc2_foundation::{MainThreadMarker, NSObject, NSString};
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static DOCK_TARGET: OnceLock<Retained<DockNewProjectTarget>> = OnceLock::new();

define_class!(
    #[unsafe(super(NSObject))]
    struct DockNewProjectTarget;

    unsafe impl NSObjectProtocol for DockNewProjectTarget {}

    impl DockNewProjectTarget {
        #[unsafe(method(glowshotNewProject:))]
        fn on_new_project(&self, _sender: Option<&AnyObject>) {
            if let Some(app) = APP_HANDLE.get() {
                let _ = app.emit("new-project-request", ());
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_focus();
                }
            }
        }
    }
);

impl DockNewProjectTarget {
    objc2::extern_methods!(
        #[unsafe(method(new))]
        fn new() -> Retained<Self>;
    );
}

pub fn install(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let _ = APP_HANDLE.set(app.clone());
    let mtm = MainThreadMarker::new().ok_or("main thread only")?;

    let target = DockNewProjectTarget::new();
    let _ = DOCK_TARGET.set(target.clone());

    let menu = NSMenu::new(mtm);
    let title = NSString::from_str("Nuevo proyecto");
    let key_eq = NSString::from_str("");
    let item = unsafe {
        menu.addItemWithTitle_action_keyEquivalent(
            &title,
            Some(sel!(glowshotNewProject:)),
            &key_eq,
        )
    };
    unsafe {
        item.setTarget(Some(target.as_ref()));
    }

    let ns_app = NSApplication::sharedApplication(mtm);
    unsafe {
        let _: () = msg_send![&*ns_app, setDockMenu: &*menu];
    }
    Ok(())
}
