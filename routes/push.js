const express = require('express');
const fetch = require('node-fetch'); // MUST be node-fetch@2!
const router = express.Router();
const Device = require('../models/device'); // Adjust path if needed

// Send push notification to Expo
async function sendPushToDevices(tokens, title, body, data) {
  const messages = tokens.map(token => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  const result = await response.json();
  return result;
}

// Send push by phone/email/token
router.post('/send-push', async (req, res) => {
  try {
    const { by, value, title, body, data } = req.body;
    let devices;

    if (by === 'phone') {
      devices = await Device.find({ phone: value });
    } else if (by === 'email') {
      devices = await Device.find({ email: value });
    } else if (by === 'token') {
      devices = [{ token: value }];
    } else {
      return res.status(400).json({ error: 'Invalid "by" parameter.' });
    }

    const tokens = devices.map(d => d.token).filter(Boolean);
    if (!tokens.length) {
      return res.status(404).json({ error: 'No device tokens found.' });
    }

    const result = await sendPushToDevices(tokens, title, body, data);
    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// (Example: Register device endpoint)
router.post('/register-device', async (req, res) => {
  try {
    const { token, phone, email, deviceID } = req.body;
    if (!token || !deviceID) return res.status(400).json({ error: 'token and deviceID required' });

    await Device.findOneAndUpdate(
      { deviceID },
      { token, phone, email },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
