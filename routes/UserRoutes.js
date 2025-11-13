const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// --- Rutas del CRUD de Usuarios ---

// CREATE: Ruta para crear un nuevo usuario (Registrarse)
router.post('/', userController.createUser);

// READ: Ruta para obtener todos los usuarios (en un futuro para administradores)
router.get('/', userController.getUsers);

// READ: Ruta para obtener un usuario específico por su ID
router.get('/:id', userController.getUserById);

// UPDATE: Ruta para actualizar un usuario por su ID
router.put('/:id', userController.updateUser);

// DELETE: Ruta para eliminar un usuario por su ID
router.delete('/:id', userController.deleteUser);

router.post('/login', userController.loginUser);


module.exports = router;