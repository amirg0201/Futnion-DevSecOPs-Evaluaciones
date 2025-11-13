const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// CREAR UN USUARIO
exports.createUser = async (req, res) => {
  try {
        const { fullName, email, username, password, valuePlayer } = req.body;

        // 1. Hashear la contraseña
        const salt = await bcrypt.genSalt(10); // Genera un "salt" para mayor seguridad
        const hashedPassword = await bcrypt.hash(password, salt); // Crea el hash

        // 2. Crear el nuevo usuario con la contraseña hasheada
        const nuevoUsuario = new User({
            fullName,
            email,
            username,
            password: hashedPassword, // ¡Guardamos la contraseña hasheada!
            valuePlayer
        });

        await nuevoUsuario.save();
        res.status(201).json({ msg: 'Usuario creado con éxito', userId: nuevoUsuario._id });
    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error al crear el usuario', error: error.message });
    }
};

// OBTENER TODOS LOS USUARIOS
exports.getUsers = async (req, res) => { // Cambié el nombre a getUsers (plural)
  try {
    const users = await User.find();
    // Código 200 para éxito
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ 
      msg: 'Error al obtener usuarios', 
      error: error.message 
    });
  }
}

// OBTENER USUARIO POR ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    // Faltaba el código de estado
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ 
      msg: 'Error al obtener el usuario', 
      error: error.message 
    });
  }
}

// ACTUALIZAR USUARIO
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { 
      new: true,
      runValidators: true 
    });
    
    if (!updatedUser) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    res.status(200).json({ 
      msg: 'Usuario actualizado con éxito', 
      usuario: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Error al actualizar el usuario', 
      error: error.message 
    });
  }
}

// ELIMINAR USUARIO (CORREGIDO)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    // Mensaje corregido
    res.status(200).json({ 
      msg: 'Usuario eliminado con éxito', 
      usuario: user 
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Error al eliminar el usuario', 
      error: error.message 
    });
  }
}

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar si el usuario existe
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ msg: 'El correo o la contraseña son incorrectos.' });
        }

        // 2. Comparar la contraseña
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) {
            return res.status(400).json({ msg: 'El correo o la contraseña son incorrectos.' });
        }
        
        // 3. Login exitoso
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ msg: 'JWT_SECRET no configurado en el servidor' });
        }

        const payload = {
            user: {
                id: usuario._id,
                email: usuario.email,
                username: usuario.username
            }
        };

        const token = jwt.sign(payload, secret, { expiresIn: '2h' });

        // 4. Responder con el token
        res.status(200).json({ msg: 'Login exitoso', token, userId: usuario._id });

    } catch (error) {
        res.status(500).json({ msg: 'Hubo un error en el servidor', error: error.message });
    }
};