use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetState {
    pub name: String,
    pub mood: String,
    pub position_x: i32,
    pub position_y: i32,
}

impl Default for PetState {
    fn default() -> Self {
        Self {
            name: "小像素".into(),
            mood: "normal".into(),
            position_x: 100,
            position_y: 100,
        }
    }
}
