const express = require('express');
const router = express.Router();
const matchController = require('../controllers/MatchController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// --- Rutas del CRUD de Partidos ---

router.post('/', auth, matchController.createMatch);
router.post('/:id/join', auth, matchController.joinMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', auth, matchController.updateMatch);
router.delete('/;id,', auth, matchController.deleteMatch)
router.delete('/admin/:id', auth, adminAuth, matchController.deleteAnyMatch);

module.exports = router;  
