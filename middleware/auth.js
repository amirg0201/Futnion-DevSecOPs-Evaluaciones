const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 1. CRÍTICO: Importar el modelo de usuario

// 2. CRÍTICO: La función DEBE ser asíncrona para usar 'await'
module.exports = async function(req, res, next) {
  const authHeader = req.header('Authorization');

  // 1. Verificar si la cabecera existe
  if (!authHeader) {
    return res.status(401).json({ msg: 'Acceso denegado. No hay token de autenticación.' });
  }

  // 2. Extraer solo el Token (maneja el prefijo "Bearer ")
  let token = authHeader.replace('Bearer ', '');
  if (token === authHeader) {
    token = authHeader; 
  }

  try {
    // 3. Verificar y Decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Asumiendo que firmamos el token con { user: { id: userId, ... } }
    const userId = decoded.user.id; 
    
    // 4. CRÍTICO: Buscar el rol del usuario en la base de datos
    const user = await User.findById(userId).select('role');

    if (!user) {
      return res.status(401).json({ msg: 'Token inválido: Usuario no encontrado.' });
    }

    // 5. Adjuntar el ID y el ROL al objeto req
    req.user = {
      id: userId,
      role: user.role // <-- ESTO ES VITAL para que adminAuth.js funcione
    };

    // 6. Permitir que la petición continúe (next() va al final)
    next(); 

  } catch (error) {
    // Captura errores de jwt.verify (token expirado o inválido)
    res.status(401).json({ msg: 'Token no es válido o ha expirado.' });
  }
};