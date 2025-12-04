// server.js - Versión Final para Despliegue (API Pura)

require('dotenv').config(); // 1. Cargar variables de entorno (para MONGO_URI y PORT local)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();


// ======================================
// 1. CONFIGURACIÓN DE CORS (Seguridad en Producción)
// ======================================

// Define los orígenes permitidos. Esto es CRUCIAL para que Vercel pueda hablar con Render.
// Nota: Reemplaza la URL de VERCEL_FRONTEND_URL por la URL real de tu app en Vercel.
const allowedOrigins = [
    // ⚠️ Importante: Reemplaza por tu URL de Vercel.
    'futnion.vercel.app', 
    'http://localhost:3005', // Para desarrollo local
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman)
        if (!origin) return callback(null, true); 
        
        // Si el origen está en nuestra lista blanca, permitir
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Rechazar el acceso si el origen no está en la lista
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
    credentials: true,
};

// ======================================
// 2. MIDDLEWARES
// ======================================

// Aplicar la configuración de CORS
app.use(cors(corsOptions));

// Middleware para parsear JSON (Importante: debe ir antes de las rutas)
app.use(express.json());

// La línea de express.static('public') está correctamente COMENTADA/ELIMINADA.


// ======================================
// 3. CONEXIÓN A MONGO & RUTAS
// ======================================

// Conectar a MongoDB
// Usamos process.env.MONGO_URI (para Render) o el fallback local (para desarrollo)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/FutnionDB')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Importar rutas
const userRoutes = require('./routes/UserRoutes.js'); 
const matchRoutes = require('./routes/MatchRoutes.js');

// Usar rutas
app.use('/api/usuarios', userRoutes); 
app.use('/api/partidos', matchRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Futnion funcionando!' });
});

// ======================================
// 4. INICIO DEL SERVIDOR
// ======================================
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});