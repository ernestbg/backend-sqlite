const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const DB_PATH = path.resolve(__dirname, 'phrasal-verbs.db');

// Función para conectar a la base de datos
function connectToDatabase() {
    return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos', err.message);
        } 
    });
}


function setupDatabase() {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error al crear la base de datos', err.message);
        } else {
            console.log('Base de datos creada con éxito');

            // Crear tabla Verbos
            db.run(`CREATE TABLE IF NOT EXISTS PHRASAL_VERBS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        HEADWORD TEXT NOT NULL UNIQUE
    );`);

            // Crear tabla Significados
            db.run(`CREATE TABLE IF NOT EXISTS DEFINITIONS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PHRASAL_VERB_ID INTEGER,
    DEFINITION TEXT,
    LEVEL TEXT,
    FOREIGN KEY (PHRASAL_VERB_ID) REFERENCES PHRASAL_VERBS(ID) ON DELETE NO ACTION
);`);


            // Crear tabla Ejemplos
            db.run(`CREATE TABLE IF NOT EXISTS EXAMPLES (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        DEFINITION_ID INTEGER,
        EXAMPLE TEXT,
        FOREIGN KEY (DEFINITION_ID) REFERENCES DEFINITIONS(ID) ON DELETE CASCADE
    );`);
        }
    });
}


module.exports = { connectToDatabase, setupDatabase };
