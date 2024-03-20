const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const DB_PATH = path.resolve(__dirname, 'phrasal-verbs.db');

// Función para conectar a la base de datos
function connectToDatabase() {
    return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos', err.message);
        } else {
            console.log('Conexión establecida con la base de datos SQLite');
        }
    });
}

module.exports = { connectToDatabase };
