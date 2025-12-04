const Match = require('../models/Match');

// CREATE: Crear un nuevo partido
exports.createMatch = async (req, res) => {
    try {
        // Creamos el partido con los datos del body Y el ID del usuario que viene del token
        const newMatch = new Match({
            ...req.body,
            creator: req.user.id // <-- Asignamos el creador gracias al middleware
        });
        
        await newMatch.save();
        res.status(201).json({ msg: 'Partido creado con éxito', matchId: newMatch._id });
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al crear el partido', error: error.message });
    }
};

// READ: Obtener todos los partidos
exports.getMatches = async (req, res) => {
    try {
        // .populate() reemplaza el ID del creador por sus datos
        // ('creator', 'username fullName') <-- solo trae esos campos
        const matches = await Match.find()
            .populate('creator', 'username fullName')
            .sort({ MatchDate: 1 }); // Ordenar por fecha
            
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al obtener los partidos', error: error.message });
    }
};

// READ: Obtener un partido por su ID
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('creator', 'username fullName') // Ya tenías este
            .populate('participants', 'username');     // <-- ¡ASEGÚRATE DE AÑADIR ESTE!
            
        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }
        res.status(200).json(match);
    } catch (error) {
        // ...
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

// DELETE: Eliminar un partido (solo el creador puede hacerlo)
exports.deleteMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        // El ID del usuario actual está garantizado por el middleware 'auth'
        const userId = req.user.id; 

        // 1. Buscar el partido (solo para verificar quién es el creador)
        const matchToDelete = await Match.findById(matchId).select('creator');

        // Check 1: ¿El partido existe?
        if (!matchToDelete) {
            return res.status(404).json({ msg: 'Partido no encontrado.' });
        }

        // Check 2: ¿El ID del creador del partido NO coincide con el ID del usuario actual?
        // Convertimos el ObjectId a string para la comparación
        if (matchToDelete.creator.toString() !== userId) {
            // 403 Forbidden: No tiene el permiso necesario
            return res.status(403).json({ 
                msg: 'Acceso denegado. Solo el creador puede eliminar este partido.' 
            });
        }

        // 3. Si las verificaciones pasaron, ejecutamos la eliminación
        await Match.findByIdAndDelete(matchId);

        res.status(200).json({ msg: 'Partido eliminado.' });

    } catch (error) {
        // Manejar errores de Mongoose o del servidor
        res.status(500).json({ msg: 'Hubo un error al eliminar el partido', error: error.message });
    }
};

exports.joinMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        const userId = req.user.id; // ID del usuario que quiere unirse

        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }

        // 1. Verificar si el usuario ya es el creador
        if (match.creator.toString() === userId) {
            return res.status(400).json({ msg: 'Ya eres el creador de este partido' });
        }
        
        // 2. Verificar si el usuario ya está inscrito
        if (match.participants.includes(userId)) {
            return res.status(400).json({ msg: 'Ya estás inscrito en este partido' });
        }

        // 3. Verificar si hay cupo
        // (Los 'requiredPlayers' menos los que ya se han unido)
        if (match.participants.length >= match.requiredPlayers) {
            return res.status(400).json({ msg: 'El partido ya está lleno' });
        }

        // 4. ¡Todo en orden! Añadimos al usuario
        match.participants.push(userId);
        await match.save();

        res.status(200).json({ msg: 'Te has unido al partido', match });

    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al unirse al partido', error: error.message });
    }
};

exports.deleteAnyMatch = async (req, res) => {
    try {
        const matchId = req.params.id;

        // 1. Opcional: Loguear qué usuario admin está borrando.
        console.log(`[ADMIN DELETE] Usuario ${req.user.id} eliminando partido ID: ${matchId}`);
        
        // 2. CRÍTICO: Ejecutar la eliminación en la base de datos
        // findByIdAndDelete busca el documento y lo elimina
        const match = await Match.findByIdAndDelete(matchId);

        // 3. Verificar si el partido fue encontrado y borrado
        if (!match) {
            return res.status(404).json({ msg: 'Partido no encontrado o ya fue eliminado.' });
        }
        
        // 4. Éxito: Devolver la confirmación.
        res.status(200).json({ msg: `Partido ${matchId} eliminado por el administrador.` });
    } catch (error) {
        // Manejar errores de Mongoose o del servidor
        res.status(500).json({ msg: 'Error interno del servidor al intentar borrar el partido.', error: error.message });
    }
};

exports.getMyMatches = async (req, res) => {
    try {
        const userId = req.user.id; // Obtenido del token

        // Mongoose hace el trabajo sucio: busca donde 'participants' contenga el userId
        const matches = await Match.find({ participants: userId });

        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener tus partidos', error: error.message });
    }
};

exports.leaveMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ msg: 'Partido no encontrado' });

        // 1. VALIDACIÓN DE COOLDOWN (1 HORA)
        const matchTime = new Date(match.MatchDate).getTime();
        const currentTime = Date.now();
        const oneHour = 60 * 60 * 1000; // milisegundos

        // Si falta menos de una hora (o el partido ya pasó), no se puede salir
        if (matchTime - currentTime < oneHour) {
            return res.status(400).json({ 
                msg: 'No puedes salirte. Falta menos de 1 hora para el partido.' 
            });
        }

        // 2. Eliminar al usuario del array
        // Filtramos para dejar a todos MENOS al usuario que hace la petición
        match.participants = match.participants.filter(
            participantId => participantId.toString() !== req.user.id
        );

        await match.save();
        res.json({ msg: 'Has salido del partido exitosamente.' });

    } catch (error) {
        res.status(500).json({ msg: 'Error al salir del partido', error: error.message });
    }
};

// ADMIN: Eliminar a un participante específico
exports.removeParticipant = async (req, res) => {
    try {
        const { id, userId } = req.params; // ID del partido y ID del usuario a borrar
        
        const match = await Match.findById(id);
        if (!match) return res.status(404).json({ msg: 'Partido no encontrado' });

        // Eliminar al participante indicado
        match.participants = match.participants.filter(
            participantId => participantId.toString() !== userId
        );

        await match.save();
        res.json({ msg: 'Participante eliminado por el administrador.' });

    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar participante', error: error.message });
    }
};