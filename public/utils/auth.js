
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Obtener el token de la cabecera 'Authorization'
    // El formato esperado es: Authorization: Bearer [TOKEN]
    const authHeader = req.header('Authorization');

    // 2. Verificar si la cabecera existe
    if (!authHeader) {
        // 401 Unauthorized: El cliente no proporcionó credenciales
        return res.status(401).json({ msg: 'Acceso denegado. No hay token de autenticación.' });
    }

    // 3. Extraer solo el Token (quitar "Bearer ")
    let token = authHeader.replace('Bearer ', '');
    
    // Si la cabecera no tenía el prefijo 'Bearer', revisamos si el token existe
    if (token === authHeader) {
        token = authHeader; // Usamos el token tal cual si no tiene prefijo
    }

    // 4. Verificar el Token
    try {
        // jwt.verify() decodifica el token usando la clave secreta de .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. El token es válido. Adjuntamos la info del usuario a la petición.
        // req.user contendrá el payload que firmamos en el login (id, email, username)
        req.user = decoded.user;
        
        next(); // Permite que la petición continúe a la función del controlador
        
    } catch (error) {
        // 401 Unauthorized: El token es inválido (venció, fue modificado, etc.)
        res.status(401).json({ msg: 'Token no es válido o ha expirado.' });
    }
};