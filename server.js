// server.js
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

// Routes
app.use(registerDeviceRouter); // POST /register-device
app.use(pushRouter);           // POST /send-push, POST /send-bulk-push

mongoose.connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log('Backend listening on', PORT);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
