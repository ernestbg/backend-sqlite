const { connectToDatabase } = require('../database/config');

const getPhrasalVerbs = (req, res) => {
    // Conéctate a la base de datos
    const db = connectToDatabase();

    // Realiza la consulta SQL
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
    const { id, headword, definition, guide_word, example, phonetics, level, sublevel } = req.body;

    const db = connectToDatabase();

    const sql = 'INSERT INTO PHRASAL_VERBS (id, headword, definition, guide_word, example, phonetics, level, sublevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [id, headword, definition, guide_word, example, phonetics, level, sublevel], function (err) {
        if (err) {
            console.error('Error al insertar el phrasal verb', err.message);
            res.status(500).json({ error: 'Error al insertar el phrasal verb' });
        } else {
            console.log(`Nuevo phrasal verb insertado con ID: ${this.lastID}`);
            res.status(201).json({ id: this.lastID, headword, definition, guide_word, example, phonetics, level, sublevel });
        }
    });

    db.close();
};



module.exports = { getPhrasalVerbs, addPhrasalVerb }