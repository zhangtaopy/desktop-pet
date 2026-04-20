use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, AppHandle, Emitter,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示宠物", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "隐藏宠物", true, None::<&str>)?;
    let toggle_menu_item = MenuItem::with_id(app, "toggle-menu-btn", "切换菜单按钮", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &hide_item, &toggle_menu_item, &quit_item])?;

    // 尝试获取图标，优先使用默认窗口图标，否则从文件加载
    let icon = app.default_window_icon()
        .cloned()
        .or_else(|| {
            // 从 icns 文件加载图标
            Image::from_path("icons/icon.icns").ok()
        })
        .or_else(|| {
            // 从 png 文件加载图标
            Image::from_path("icons/32x32.png").ok()
        });

    let mut tray_builder = TrayIconBuilder::new().menu(&menu);

    if let Some(icon) = icon {
        tray_builder = tray_builder.icon(icon);
    }

    tray_builder
        .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _: Result<(), _> = window.show();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _: Result<(), _> = window.hide();
                }
            }
            "toggle-menu-btn" => {
                // 发送事件到前端来切换菜单按钮
                let _ = app.emit("toggle-menu-btn", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}
