const { connectToDatabase } = require('../database/config');


const getPhrasalVerbs = (req, res) => {
    // Conectar a la base de datos SQLite
    const db = connectToDatabase();

    // Realizar la consulta SQL para obtener todos los phrasal verbs
    db.all("SELECT * FROM PHRASAL_VERBS", (err, rows) => {
        if (err) {
            db.close();
            res.status(500).json({ error: err.message });
            return;
        }

        // Realizar la consulta SQL para contar el número total de phrasal verbs
        db.get("SELECT COUNT(*) AS total FROM PHRASAL_VERBS", (err, row) => {
            // Cerrar la conexión a la base de datos
            db.close();

            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Devolver los phrasal verbs y el número total en la misma respuesta
            res.json({ phrasalVerbs: rows, total: row.total });
        });
    });
};



const getPhrasalVerbById = (req, res) => {
    const id = req.params.id; // Obtén el ID del parámetro de la ruta

    const db = connectToDatabase();

    const sql = 'SELECT * FROM phrasal_verbs WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        db.close(); // Cierra la conexión a la base de datos

        if (err) {
            console.error('Error al obtener el phrasal verb por ID:', err.message);
            res.status(500).json({ error: 'Error al obtener el phrasal verb por ID' });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Phrasal verb no encontrado' });
            return;
        }

        res.json(row);
    });
};


const addPhrasalVerb = (req, res) => {
    const { headword, definition, example, level, sublevel } = req.body;

    // Abrir la conexión a la base de datos
    const db = connectToDatabase();

    // Preparar la consulta SQL para insertar un nuevo phrasal verb
    const sql = `INSERT INTO phrasal_verbs (headword, definition, example, level, sublevel) 
                 VALUES (?, ?, ?, ?, ?)`;

    // Ejecutar la consulta SQL con los valores correspondientes
    db.run(sql, [headword, definition, example, level, sublevel], function (err) {
        if (err) {
            console.error('Error al insertar el phrasal verb', err.message);
            res.status(500).json({ error: 'Error al insertar el phrasal verb' });
        } else {
            console.log(`Nuevo phrasal verb insertado con ID: ${this.lastID}`);
            res.status(201).json({ id: this.lastID, headword, definition, example, level, sublevel });
        }
    });

    // Cerrar la conexión a la base de datos después de realizar la inserción
    db.close();
};

const updatePhrasalVerb = (req, res) => {
    const id = req.params.id;
    const { headword, definition, example, level, sublevel } = req.body;
    const db = connectToDatabase();

    const sql = `UPDATE PHRASAL_VERBS
                 SET headword = ?, definition = ?, example = ?, level = ?, sublevel = ?
                 WHERE id = ?`;

    db.run(sql, [headword, definition, example, level, sublevel, id], function (err) {
        if (err) {
            console.error('Error al actualizar el verbo frasal:', err.message);
            res.status(500).json({ error: 'Error al actualizar el verbo frasal' });
        } else {
            console.log(`Verbo frasal actualizado con ID: ${id}`);
            res.status(200).json({ id, headword, definition, example, level, sublevel });
        }
    });

    db.close();
};


const deletePhrasalVerb = (req, res) => {
    const phrasalVerbId = req.params.id; // Obtener el ID del phrasal verb de los parámetros de la solicitud
    // Abrir la conexión a la base de datos
    const db = connectToDatabase();

    // Preparar la consulta SQL para eliminar el phrasal verb con el ID especificado
    const sql = 'DELETE FROM phrasal_verbs WHERE id = ?';

    // Ejecutar la consulta SQL con el ID del phrasal verb a eliminar
    db.run(sql, [phrasalVerbId], function (err) {
        if (err) {
            console.error('Error al eliminar el phrasal verb', err.message);
            res.status(500).json({ error: 'Error al eliminar el phrasal verb' });
        } else {
            console.log(`Phrasal verb con ID ${phrasalVerbId} eliminado correctamente`);
            res.status(200).json({ message: `Phrasal verb con ID ${phrasalVerbId} eliminado correctamente` });
        }
    });

    // Cerrar la conexión a la base de datos después de realizar la eliminación
    db.close();
};




module.exports = { getPhrasalVerbs, getPhrasalVerbById, addPhrasalVerb, updatePhrasalVerb, deletePhrasalVerb }