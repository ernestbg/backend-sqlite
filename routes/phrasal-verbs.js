// Ruta: /api/phrasal-verbs

const { Router } = require('express');
const { getPhrasalVerbs, addPhrasalVerb, getPhrasalVerbById, updatePhrasalVerb, deletePhrasalVerb } = require('../controllers/phrasal-verbs')

const router = Router();

router.get('/', getPhrasalVerbs);
router.get('/:id', getPhrasalVerbById);
router.post('/', addPhrasalVerb);
router.patch('/:id', updatePhrasalVerb);
router.delete('/:id', deletePhrasalVerb);

module.exports = router;