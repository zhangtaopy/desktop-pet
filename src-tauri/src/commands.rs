use crate::database::Database;
use crate::pet::PetState;
use tauri::State;

#[tauri::command]
pub fn get_pet_state(db: State<'_, Database>) -> PetState {
    db.load().unwrap_or_else(|_| PetState::default())
}

#[tauri::command]
pub fn set_pet_name(db: State<'_, Database>, name: String) -> PetState {
    let mut state = db.load().unwrap_or_else(|_| PetState::default());
    state.name = name;
    let _ = db.save(&state);
    state
}

#[tauri::command]
pub fn save_position(db: State<'_, Database>, x: i32, y: i32) -> PetState {
    let mut state = db.load().unwrap_or_else(|_| PetState::default());
    state.position_x = x;
    state.position_y = y;
    let _ = db.save(&state);
    state
}

#[tauri::command]
pub fn get_mouse_position() -> Result<MousePosition, String> {
    #[cfg(target_os = "macos")]
    {
        use core_graphics::event::CGEvent;
        use core_graphics::event_source::CGEventSource;
        use core_graphics::display::{CGDisplay, CGMainDisplayID};

        // 打印显示器信息
        unsafe {
            let display = CGDisplay::new(CGMainDisplayID());
            let width = display.pixels_wide();
            let height = display.pixels_high();
        }

        let source = CGEventSource::new(core_graphics::event_source::CGEventSourceStateID::CombinedSessionState)
            .map_err(|e| format!("Failed to create event source: {:?}", e))?;

        let event = CGEvent::new(source)
            .map_err(|e| format!("Failed to create event: {:?}", e))?;

        let location = event.location();

        Ok(MousePosition {
            x: location.x as i32,
            y: location.y as i32,
        })
    }

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;

        unsafe {
            let mut point = POINT { x: 0, y: 0 };
            GetCursorPos(&mut point).map_err(|e| format!("Failed to get cursor position: {}", e))?;
            Ok(MousePosition {
                x: point.x,
                y: point.y,
            })
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(MousePosition { x: 0, y: 0 })
    }
}

#[derive(serde::Serialize)]
pub struct MousePosition {
    pub x: i32,
    pub y: i32,
}
