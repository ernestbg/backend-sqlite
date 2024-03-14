const { connectDatabase } = require('../database/config');


const getPhrasalVerbs = (res) => {
    
    const db = connectDatabase();

    // Realizar la consulta SQL
    db.all("SELECT * FROM PHRASAL_VERBS", (err, rows) => {
        // Cerrar la conexión a la base de datos
        db.close();

        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
}

const addPhrasalVerb = (req, res) => {
    const { verb, meaning, example } = req.body;

    const db = connectDatabase();

    const sql = 'INSERT INTO phrasal_verbs (verb, meaning, example) VALUES (?, ?, ?)';
    db.run(sql, [verb, meaning, example], function (err) {
        if (err) {
            console.error('Error al insertar el phrasal verb', err.message);
            res.status(500).json({ error: 'Error al insertar el phrasal verb' });
        } else {
            console.log(`Nuevo phrasal verb insertado con ID: ${this.lastID}`);
            res.status(201).json({ id: this.lastID, verb, meaning, example });
        }
    });

    db.close();
};



module.exports = { getPhrasalVerbs, addPhrasalVerb }