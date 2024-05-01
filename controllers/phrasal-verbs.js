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

    if (!headword) {
        // Si el headword es nulo, devuelve un error
        return res.status(400).json({ error: 'El headword no puede ser nulo' });
    }

    // Utiliza transacciones para asegurar la consistencia
    db.serialize(() => {
        // Iniciar la transacción
        db.run("BEGIN TRANSACTION");

        // Verificar si existe la combinación de headword y definition en la base de datos
        db.get(`SELECT pv.ID, d.ID AS DefinitionID FROM PHRASAL_VERBS pv
                JOIN DEFINITIONS d ON pv.ID = d.PHRASAL_VERB_ID
                WHERE pv.HEADWORD = ? AND d.DEFINITION = ?`, [headword, definition], (err, row) => {
            if (err) {
                // En caso de error, realiza un rollback y cierra la conexión
                db.run("ROLLBACK", () => {
                    db.close();
                });
                console.error('Error al verificar unicidad:', err.message);
                return res.status(500).json({ error: 'Error al verificar unicidad' });
            }

            if (row) {
                // Si la combinación de headword y definition ya existe, realiza rollback
                db.run("ROLLBACK", () => {
                    db.close();
                });
                return res.status(409).json({ error: 'Ya existe un phrasal verb con la combinación de headword y definition' });
            } else {
                // Si la combinación de headword y definition no existe, inserta el phrasal verb
                let phrasalVerbID;
                let definitionID;

                // Verifica si el headword ya existe en PHRASAL_VERBS
                db.get(`SELECT ID FROM PHRASAL_VERBS WHERE HEADWORD = ?`, [headword], (err, row) => {
                    if (err) {
                        // En caso de error, realiza un rollback y cierra la conexión
                        db.run("ROLLBACK", () => {
                            db.close();
                        });
                        console.error('Error al verificar headword:', err.message);
                        return res.status(500).json({ error: 'Error al verificar headword' });
                    }

                    if (row) {
                        // Si el headword ya existe, reutilizar su ID
                        phrasalVerbID = row.ID;
                        insertDefinition();
                    } else {
                        // Si el headword no existe, insertarlo en PHRASAL_VERBS
                        db.run(`INSERT INTO PHRASAL_VERBS (HEADWORD) VALUES (?)`, [headword], function (err) {
                            if (err) {
                                // En caso de error, realiza un rollback y cierra la conexión
                                db.run("ROLLBACK", () => {
                                    db.close();
                                });
                                console.error('Error al insertar en PHRASAL_VERBS:', err.message);
                                return res.status(500).json({ error: 'Error al insertar headword' });
                            }
                            phrasalVerbID = this.lastID;
                            console.log('phrasalVerbID:', phrasalVerbID);
                            insertDefinition();
                        });
                    }
                });

                // Función para insertar la definición y manejar el ejemplo
                function insertDefinition() {
                    // Insertar la definición en DEFINITIONS
                    db.run(`INSERT INTO DEFINITIONS (PHRASAL_VERB_ID, DEFINITION, LEVEL) VALUES (?, ?, ?)`, [phrasalVerbID, definition, level], function (err) {
                        if (err) {
                            // En caso de error, realiza un rollback y cierra la conexión
                            db.run("ROLLBACK", () => {
                                db.close();
                            });
                            console.error('Error al insertar en DEFINITIONS:', err.message);
                            return res.status(500).json({ error: 'Error al insertar definición' });
                        }

                        definitionID = this.lastID;

                        // Insertar el ejemplo en EXAMPLES si se proporciona
                        if (example) {
                            db.run(`INSERT INTO EXAMPLES (DEFINITION_ID, EXAMPLE) VALUES (?, ?)`, [definitionID, example], function (err) {
                                if (err) {
                                    // En caso de error, realiza un rollback y cierra la conexión
                                    db.run("ROLLBACK", () => {
                                        db.close();
                                    });
                                    console.error('Error al insertar en EXAMPLES:', err.message);
                                    return res.status(500).json({ error: 'Error al insertar ejemplo' });
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
                                    res.status(201).json({ phrasalVerbID, definitionID, exampleID: this.lastID });
                                });
                            });
                        } else {
                            // Si no se proporciona ejemplo, confirmamos la transacción directamente
                            db.run("COMMIT", function (err) {
                                if (err) {
                                    console.error('Error al confirmar la transacción:', err.message);
                                    db.run("ROLLBACK");
                                    db.close();
                                    return res.status(500).json({ error: 'Error al confirmar la transacción' });
                                }

                                // Cerrar la conexión a la base de datos
                                db.close();
                                res.status(201).json({ phrasalVerbID, definitionID });
                            });
                        }
                    });
                }
            }
        });
    });
};






const updatePhrasalVerb = (req, res) => {
    const { phrasalVerbId, definitionId } = req.params; // Recupera los IDs de la ruta
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

        // Actualizar el headword en PHRASAL_VERBS solo si se proporciona
        if (headword) {
            db.run(`UPDATE PHRASAL_VERBS SET HEADWORD = ? WHERE ID = ?`, [headword, phrasalVerbId], function (err) {
                if (err) {
                    console.error('Error al actualizar en PHRASAL_VERBS:', err.message);
                    db.run("ROLLBACK");
                    db.close();
                    return res.status(500).json({ error: 'Error al actualizar el headword' });
                }
            });
        }

        // Actualizar la definición y nivel en DEFINITIONS solo si se proporcionan
        if (definition || level) {
            db.run(`UPDATE DEFINITIONS SET DEFINITION = COALESCE(?, DEFINITION), LEVEL = COALESCE(?, LEVEL) WHERE ID = ?`, [definition, level, definitionId], function (err) {
                if (err) {
                    console.error('Error al actualizar en DEFINITIONS:', err.message);
                    db.run("ROLLBACK");
                    db.close();
                    return res.status(500).json({ error: 'Error al actualizar la definición' });
                }
            });
        }

        // Actualizar el ejemplo en EXAMPLES solo si se proporciona
        if (example !== undefined) {
            db.run(`UPDATE EXAMPLES SET EXAMPLE = ? WHERE DEFINITION_ID = ?`, [example, definitionId], function (err) {
                if (err) {
                    console.error('Error al actualizar en EXAMPLES:', err.message);
                    db.run("ROLLBACK");
                    db.close();
                    return res.status(500).json({ error: 'Error al actualizar el ejemplo' });
                }
            });
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
            res.status(200).json({ phrasalVerbId, definitionId, headword, definition, example, level });
        });
    });
};


const deletePhrasalVerb = (req, res) => {
    const { phrasalVerbId, definitionId } = req.params;
    const db = connectToDatabase();

    // Iniciar transacción
    db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
            console.error('Error al iniciar la transacción:', err.message);
            db.close();
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }
        // Verificar cuántas definiciones están asociadas con `phrasalVerbId`
        db.get('SELECT COUNT(*) as count FROM DEFINITIONS WHERE PHRASAL_VERB_ID = ?', [phrasalVerbId], (err, row) => {
            if (err) {
                db.run("ROLLBACK", () => db.close());
                console.error('Error al verificar definiciones asociadas:', err.message);
                return res.status(500).json({ error: 'Error al verificar definiciones asociadas' });
            }

            // Si solo hay una definición asociada con `phrasalVerbId`, eliminar tanto la definición como el phrasal verb
            if (row.count === 1) {
                db.run(`DELETE FROM DEFINITIONS WHERE ID = ?`, [definitionId], (err) => {
                    if (err) {
                        db.run("ROLLBACK", () => db.close());
                        console.error('Error al eliminar la definición:', err.message);
                        return res.status(500).json({ error: 'Error al eliminar la definición' });
                    }

                    db.run(`DELETE FROM PHRASAL_VERBS WHERE ID = ?`, [phrasalVerbId], (err) => {
                        if (err) {
                            db.run("ROLLBACK", () => db.close());
                            console.error('Error al eliminar el phrasal verb:', err.message);
                            return res.status(500).json({ error: 'Error al eliminar el phrasal verb' });
                        }

                        // Confirmar la transacción
                        db.run("COMMIT", (err) => {
                            if (err) {
                                db.run("ROLLBACK", () => db.close());
                                console.error('Error al confirmar la transacción:', err.message);
                                return res.status(500).json({ error: 'Error al confirmar la transacción' });
                            }

                            // Cerrar conexión y responder con éxito
                            db.close();
                            res.status(200).json({ message: `Phrasal verb con ID ${phrasalVerbId} y definition ID ${definitionId} eliminados correctamente` });
                        });
                    });
                });
            } else {
                // Si hay más de una definición asociada, eliminar solo la definición
                db.run('DELETE FROM DEFINITIONS WHERE ID = ?', [definitionId], (err) => {
                    if (err) {
                        db.run("ROLLBACK", () => db.close());
                        console.error('Error al eliminar la definición:', err.message);
                        return res.status(500).json({ error: 'Error al eliminar la definición' });
                    }

                    // Confirmar la transacción
                    db.run("COMMIT", (err) => {
                        if (err) {
                            db.run("ROLLBACK", () => db.close());
                            console.error('Error al confirmar la transacción:', err.message);
                            return res.status(500).json({ error: 'Error al confirmar la transacción' });
                        }

                        // Cerrar conexión y responder con éxito
                        db.close();
                        res.status(200).json({ message: `Definition con ID ${definitionId} eliminada correctamente.` });
                    });
                });
            }
        });
    });
};






module.exports = { getPhrasalVerbs, getPhrasalVerbById, addPhrasalVerb, updatePhrasalVerb, deletePhrasalVerb }