const sqlite3 = require('sqlite3').verbose();

// Ruta a tu archivo de base de datos SQLite
const DB_PATH = 'phrasal-verbs.db';

// Función para abrir la conexión a la base de datos
function connectDatabase() {
    return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos', err.message);
        } else {
            console.log('Conexión establecida con la base de datos SQLite');
        }
    });
}

module.exports = { connectDatabase };