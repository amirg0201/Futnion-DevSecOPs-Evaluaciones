const express = require('express');
const router = express.Router();
const matchController = require('../controllers/MatchController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// --- Rutas del CRUD de Partidos ---

router.delete('/:id/participants/:userId', auth, adminAuth, matchController.removeParticipant);
router.get('/mis-partidos', auth, matchController.getMyMatches);
router.delete('/admin/:id', auth, adminAuth, matchController.deleteAnyMatch);
router.post('/:id/leave', auth, matchController.leaveMatch);
router.post('/', auth, matchController.createMatch);
router.post('/:id/join', auth, matchController.joinMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id', auth, matchController.updateMatch);
router.delete('/:id', auth, matchController.deleteMatch);


module.exports = router;  
