use crate::pet::PetState;
use directories::ProjectDirs;
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let db_path = Self::get_db_path();
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS pet_state (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '小像素',
                position_x INTEGER NOT NULL DEFAULT 100,
                position_y INTEGER NOT NULL DEFAULT 100
            )",
            [],
        )?;

        conn.execute(
            "INSERT OR IGNORE INTO pet_state (id) VALUES (1)",
            [],
        )?;

        Ok(Self { conn: Mutex::new(conn) })
    }

    fn get_db_path() -> PathBuf {
        ProjectDirs::from("com", "desktop-pet", "DesktopPet")
            .map(|d| d.data_dir().join("pet.db"))
            .unwrap_or_else(|| PathBuf::from("pet.db"))
    }

    pub fn save(&self, state: &PetState) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE pet_state SET name = ?1, position_x = ?2, position_y = ?3 WHERE id = 1",
            [&state.name, &state.position_x.to_string(), &state.position_y.to_string()],
        )?;
        Ok(())
    }

    pub fn load(&self) -> Result<PetState, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT name, position_x, position_y FROM pet_state WHERE id = 1",
            [],
            |row| Ok(PetState {
                name: row.get(0)?,
                mood: "normal".into(),
                position_x: row.get(1)?,
                position_y: row.get(2)?,
            }),
        )
    }
}
