const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const { setupDatabase } = require('./database/config');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = 3000;

// Configurar la base de datos
setupDatabase();

app.use('/api/phrasal-verbs', require('./routes/phrasal-verbs'));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
