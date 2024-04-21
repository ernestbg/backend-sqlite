// Ruta: /api/phrasal-verbs

const { Router } = require('express');
const { getPhrasalVerbs, addPhrasalVerb, getPhrasalVerbById, updatePhrasalVerb, deletePhrasalVerb } = require('../controllers/phrasal-verbs')

const router = Router();

router.get('/', getPhrasalVerbs);
router.get('/:phrasalVerbId/definition/:definitionId', getPhrasalVerbById);
router.post('/', addPhrasalVerb);
router.patch('/:phrasalVerbId', updatePhrasalVerb);
router.delete('/:phrasalVerbId', deletePhrasalVerb);

module.exports = router;