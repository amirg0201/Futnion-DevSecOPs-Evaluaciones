const express = require('express');
const router = express.Router();
const matchController = require('../controllers/MatchController');

// --- Rutas del CRUD de Partidos ---

router.post('/', matchController.createMatch);
router.get('/',matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatch);
router.delete('/;id,', matchController.deleteMatch)

module.exports = router;  
