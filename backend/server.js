const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Servir imágenes subidas

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));

// Modelo de datos
const ItemSchema = new mongoose.Schema({
  imageUrl: String,
  presentation: String,
  category: String,
  contact: String,
  timestamp: { type: Date, default: Date.now },
});
const Item = mongoose.model('Item', ItemSchema);

// Configurar Multer para almacenar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Ruta para manejar el envío de datos
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { presentation, category, contact } = req.body;
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    // Validar que los campos requeridos estén presentes
    if (!presentation || !category || !contact || !imageUrl) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Crear un nuevo documento en la base de datos
    const newItem = new Item({
      imageUrl,
      presentation,
      category,
      contact,
    });
    await newItem.save();

    // Respuesta exitosa
    res.status(201).json({ message: 'Datos guardados correctamente.', item: newItem });
  } catch (error) {
    console.error('Error guardando los datos:', error);
    res.status(500).json({ message: 'Error guardando los datos.' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
