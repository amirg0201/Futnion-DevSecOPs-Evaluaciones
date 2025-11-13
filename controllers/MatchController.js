const Match = require('../models/Match');

// CREATE: Crear un nuevo partido
exports.createMatch = async (req, res) => {
    try {
        const newMatch = new Match(req.body);
        await newMatch.save();
        res.status(201).json({ msg: 'Partido creado con éxito', matchId: newMatch._id });
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al crear el partido', error: error.message });
    }
};

// READ: Obtener todos los partidos
exports.getMatches = async (req, res) => {
    try {
        const matches = await Match.find();
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al obtener los partidos', error: error.message });
    }
};

// READ: Obtener un partido por su ID
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }
        res.status(200).json(match);
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al obtener el partido', error: error.message });
    }
};

// UPDATE: Actualizar un partido
exports.updateMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }
        res.status(200).json({ msg: 'Partido actualizado', match });
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al actualizar el partido', error: error.message });
    }
};

// DELETE: Eliminar un partido
exports.deleteMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }
        res.status(200).json({ msg: 'Partido eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al eliminar el partido', error: error.message });
    }
};