const { connectToDatabase } = require('../database/config');


const getPhrasalVerbs = (req, res) => {
    // Conectar a la base de datos SQLite
    const db = connectToDatabase();

    // Consulta SQL para obtener todos los phrasal verbs, definiciones y ejemplos asociados
    const query = `
        SELECT 
            pv.ID AS PhrasalVerbID,
            pv.HEADWORD AS PhrasalVerbHeadword,
            d.ID AS DefinitionID,
            d.DEFINITION AS DefinitionText,
            e.EXAMPLE AS ExampleText
        FROM 
            PHRASAL_VERBS pv
        LEFT JOIN 
            DEFINITIONS d ON pv.ID = d.PHRASAL_VERB_ID
        LEFT JOIN 
            EXAMPLES e ON d.ID = e.DEFINITION_ID
    `;

    // Realizar la consulta
    db.all(query, [], (err, rows) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: err.message });
        }

        // Mapa para agrupar los resultados por phrasal verb
        const phrasalVerbsMap = {};

        // Procesar cada fila de resultados
        rows.forEach(row => {
            const phrasalVerbID = row.PhrasalVerbID;

            // Si el phrasal verb no está en el mapa, agregarlo
            if (!phrasalVerbsMap[phrasalVerbID]) {
                phrasalVerbsMap[phrasalVerbID] = {
                    id: phrasalVerbID,
                    headword: row.PhrasalVerbHeadword,
                    definitions: []
                };
            }

            // Encontrar o agregar la definición específica
            let definitionEntry = phrasalVerbsMap[phrasalVerbID].definitions.find(
                def => def.definition === row.DefinitionText
            );
            
            if (!definitionEntry) {
                // Si la definición no existe, crear una nueva entrada
                definitionEntry = {
                    id: row.DefinitionID,
                    definition: row.DefinitionText,
                    examples: []
                };
                phrasalVerbsMap[phrasalVerbID].definitions.push(definitionEntry);
            }

            // Agregar el ejemplo a la definición correspondiente
            if (row.ExampleText) {
                definitionEntry.examples.push(row.ExampleText);
            }
        });

        // Convertir el mapa a un array de phrasal verbs
        const phrasalVerbsArray = Object.values(phrasalVerbsMap);

        // Cerrar la conexión a la base de datos
        db.close();

        // Devolver los phrasal verbs junto con sus definiciones y ejemplos asociados
        res.json(phrasalVerbsArray);
    });
};





const getPhrasalVerbById = (req, res) => {
    const phrasalVerbId = req.params.phrasalVerbId; // `id` del phrasal verb
    const definitionId = req.params.definitionId; // `id` de la definición específica

    const db = connectToDatabase();

    // Consulta SQL para obtener los datos del phrasal verb y definición específica
    const query = `
        SELECT
            pv.HEADWORD AS PhrasalVerbHeadword,
            d.DEFINITION AS DefinitionText,
            d.LEVEL AS DefinitionLevel,
            e.EXAMPLE AS ExampleText
        FROM
            PHRASAL_VERBS pv
        JOIN
            DEFINITIONS d ON pv.ID = d.PHRASAL_VERB_ID
        LEFT JOIN
            EXAMPLES e ON d.ID = e.DEFINITION_ID
        WHERE
            pv.ID = ? AND d.ID = ?;
    `;

    db.all(query, [phrasalVerbId, definitionId], (err, rows) => {
        db.close(); // Cierra la conexión a la base de datos

        if (err) {
            console.error('Error al obtener los datos:', err.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Definición no encontrada' });
        }

        // Inicializa un objeto para almacenar el resultado
        const result = {
            headword: rows[0].PhrasalVerbHeadword,
            definition: rows[0].DefinitionText,
            level: rows[0].DefinitionLevel,
            examples: []
        };

        // Agrupar ejemplos asociados a la definición
        rows.forEach(row => {
            if (row.ExampleText) {
                result.examples.push(row.ExampleText);
            }
        });

        // Devuelve la respuesta JSON con los datos deseados
        res.json(result);
    });
};






const addPhrasalVerb = (req, res) => {
    const { headword, definition, example, level } = req.body;
    const db = connectToDatabase();

    try {
        db.serialize(() => {
            // Iniciar la transacción
            db.run("BEGIN TRANSACTION");

            // Verificar si el headword ya existe en la tabla PHRASAL_VERBS
            db.get(`SELECT ID FROM PHRASAL_VERBS WHERE HEADWORD = ?`, [headword], (err, row) => {
                if (err) throw err;

                let phrasalVerbID;

                if (row) {
                    // Si el headword ya existe, reutilizar su ID
                    phrasalVerbID = row.ID;
                } else {
                    // Si el headword no existe, insertarlo en PHRASAL_VERBS
                    db.run(`INSERT INTO PHRASAL_VERBS (HEADWORD, LEVEL) VALUES (?, ?)`, [headword, level], function (err) {
                        if (err) throw err;
                        phrasalVerbID = this.lastID;
                    });
                }

                // Insertar la definición en DEFINITIONS
                db.run(`INSERT INTO DEFINITIONS (PHRASAL_VERB_ID, DEFINITION, LEVEL) VALUES (?, ?, ?)`, [phrasalVerbID, definition, level], function (err) {
                    if (err) throw err;

                    const definitionID = this.lastID;

                    // Insertar el ejemplo en EXAMPLES
                    db.run(`INSERT INTO EXAMPLES (DEFINITION_ID, EXAMPLE) VALUES (?, ?)`, [definitionID, example], function (err) {
                        if (err) throw err;

                        // Confirmar la transacción
                        db.run("COMMIT", err => {
                            if (err) throw err;
                            
                            // Cerrar la conexión a la base de datos
                            db.close();
                            res.status(201).json({ phrasalVerbID, definitionID, exampleID: this.lastID });
                        });
                    });
                });
            });
        });
    } catch (err) {
        // En caso de error, realiza un rollback y cierra la conexión
        db.run("ROLLBACK", () => {
            db.close();
        });
        console.error('Error en la operación de inserción:', err.message);
        res.status(500).json({ error: 'Error en la operación de inserción' });
    }
};




const updatePhrasalVerb = (req, res) => {
    const id = req.params.id; // Este es el ID del phrasal verb
    const { headword, definition, example, level } = req.body;

    // Conectar a la base de datos
    const db = connectToDatabase();

    // Iniciar una transacción
    db.run("BEGIN TRANSACTION", function (err) {
        if (err) {
            console.error('Error al iniciar la transacción:', err.message);
            db.close();
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }

        // Actualizar el phrasal verb en PHRASAL_VERBS
        db.run(`UPDATE PHRASAL_VERBS SET HEADWORD = ? WHERE ID = ?`, [headword, id], function (err) {
            if (err) {
                console.error('Error al actualizar en PHRASAL_VERBS:', err.message);
                db.run("ROLLBACK");
                db.close();
                return res.status(500).json({ error: 'Error al actualizar el phrasal verb' });
            }

            // Actualizar la definición en DEFINITIONS
            db.run(`UPDATE DEFINITIONS SET DEFINITION = ?, LEVEL = ? WHERE PHRASAL_VERB_ID = ?`, [definition, level, id], function (err) {
                if (err) {
                    console.error('Error al actualizar en DEFINITIONS:', err.message);
                    db.run("ROLLBACK");
                    db.close();
                    return res.status(500).json({ error: 'Error al actualizar la definición' });
                }

                // Actualizar el ejemplo en EXAMPLES
                db.run(`UPDATE EXAMPLES SET EXAMPLE = ? WHERE DEFINITION_ID = ?`, [example, id], function (err) {
                    if (err) {
                        console.error('Error al actualizar en EXAMPLES:', err.message);
                        db.run("ROLLBACK");
                        db.close();
                        return res.status(500).json({ error: 'Error al actualizar el ejemplo' });
                    }

                    // Confirmar la transacción
                    db.run("COMMIT", function (err) {
                        if (err) {
                            console.error('Error al confirmar la transacción:', err.message);
                            db.run("ROLLBACK");
                            db.close();
                            return res.status(500).json({ error: 'Error al confirmar la transacción' });
                        }

                        // Cerrar la conexión a la base de datos
                        db.close();
                        res.status(200).json({ id, headword, definition, example, level });
                    });
                });
            });
        });
    });
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