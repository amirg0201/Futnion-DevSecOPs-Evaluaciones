const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

// Middleware para parsear JSON
app.use(express.json());

app.use(express.static('public'));
// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/FutnionDB')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Importar rutas
const userRoutes = require('./routes/UserRoutes.js'); // Ajusta la ruta según tu estructura
const matchRoutes = require('./routes/MatchRoutes.js');
// Usar rutas - VERIFICA QUE ESTÉ ESTA LÍNEA
app.use('/api/usuarios', userRoutes); // Esto es crucial
app.use('/api/partidos', matchRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Futnion funcionando!' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});