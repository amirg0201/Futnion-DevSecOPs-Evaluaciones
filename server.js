require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // <--- NECESARIO PARA RUTAS DE ARCHIVOS
const app = express();

// 1. CONFIGURACIÓN DE CORS
// Al estar todo en el mismo contenedor en K8s, el origen es el mismo.
// Pero dejamos esto por seguridad y flexibilidad.
app.use(cors()); 

// 2. MIDDLEWARES
app.use(express.json());

// ---> AQUÍ ESTÁ EL CAMBIO CLAVE <---
// Servir archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 3. CONEXIÓN A MONGO & RUTAS
// Nota: Para la entrega, asegura que MONGO_URI sea una URL de Mongo Atlas (Nube)
// ya que 'localhost' en Kubernetes no funcionará igual.
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/FutnionDB')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

const userRoutes = require('./routes/UserRoutes.js'); 
const matchRoutes = require('./routes/MatchRoutes.js');

app.use('/api/usuarios', userRoutes); 
app.use('/api/partidos', matchRoutes);

// ---> RUTAS DE FALLBACK PARA EL FRONTEND <---
// Si alguien entra a la raíz, le damos el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cualquier otra ruta que no sea API, devuelve el index.html (para que React maneje el routing)
app.get('*', (req, res) => {
    // Si la petición pide algo de la API y no existe, damos 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
    // Si no, devolvemos el frontend
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3005; // Mantenemos tu puerto 3005
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});