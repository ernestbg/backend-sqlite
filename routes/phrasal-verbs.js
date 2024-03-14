// Ruta: /api/phrasal-verbs

const { Router } = require('express');
const { getPhrasalVerbs, addPhrasalVerb } = require('../controllers/phrasal-verbs')

const router = Router();

router.get('/', getPhrasalVerbs);
router.post('/', addPhrasalVerb);

module.exports = router;