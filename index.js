const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');


const app = express();
const PORT = 3000;



const DB_PATH = 'database/phrasal_verbs.db';

// Verificar si la base de datos ya existe
if (!fs.existsSync(DB_PATH)) {
    // Si la base de datos no existe, crearla
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error al crear la base de datos', err.message);
        } else {
            console.log('Base de datos creada con éxito');
            db.run("CREATE TABLE IF NOT EXISTS PHRASAL_VERBS (id INTEGER PRIMARY KEY AUTOINCREMENT, verbo TEXT, nivel TEXT)", function (err) {
                if (err) {
                    console.error("Error al crear la tabla de verbos:", err.message);
                } else {
                    console.log("Tabla de verbos creada exitosamente o ya existía.");
                }
            });
        }
    });
} else {
    console.log('La base de datos ya existe');
}





app.use('/api/phrasal-verbs', require('./routes/phrasal-verbs'));



// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});