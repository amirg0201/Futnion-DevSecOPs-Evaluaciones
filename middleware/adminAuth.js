const adminAuth = (req, res, next) => {
    // 1. Verificar si el objeto req.user existe (lo adjunta auth.js)
    if (!req.user) {
        // Esto solo debería ocurrir si el middleware auth no se ejecutó primero,
        // o si el token era inválido.
        return res.status(401).json({ msg: 'Acceso denegado. Token no proporcionado o inválido.' });
    }

    // 2. Verificar el rol
    // Asegúrate de que el campo 'role' exista en tu token/base de datos
    if (req.user.role !== 'admin') {
        // Si el rol no es 'admin', se rechaza la petición.
        return res.status(403).json({ 
            msg: 'Acceso prohibido. Se requiere rol de Administrador.' 
        });
    }

    // 3. Si es 'admin', pasa al siguiente middleware o controlador.
    next();
};

module.exports = adminAuth;