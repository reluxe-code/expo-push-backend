const express = require('express');
const router = express.Router();
const UserDevice = require('../models/UserDevice');

router.post('/register-device', async (req, res) => {
  const { token, phone, email, deviceID } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  const doc = await UserDevice.findOneAndUpdate(
    { deviceID },
    { token, phone, email, deviceID },
    { upsert: true, new: true }
  );
  res.json({ success: true });
});

module.exports = router;
