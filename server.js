// server.js
// NEW
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const registerDeviceRouter = require('./routes/registerDevice');
const pushRouter = require('./routes/push');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/expo-push';

app.use(cors());
app.use(express.json());

// --- Mount all routes at root ---
app.use('/', registerDeviceRouter); // Handles /register-device (and could handle / if needed)
app.use('/', pushRouter);           // Handles /send-push, /send-bulk-push, /logs

mongoose.connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log('Backend listening on', PORT);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
