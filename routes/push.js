const express = require('express');
const fetch = require('node-fetch'); // MUST be node-fetch@2!
const router = express.Router();
const Device = require('../models/UserDevice');
const PushLog = require('../models/PushLog'); // NEW

// Send push notification to Expo
async function sendPushToDevices(tokens, title, body, data, image) {
  const messages = tokens.map(token => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
    ...(image ? { image } : {}) // Add image if provided
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  const result = await response.json();
  return result;
}

// Send push by phone/email/token/deviceID
router.post('/send-push', async (req, res) => {
  try {
    const { by, value, title, body, data, image } = req.body;
    let devices = [];

    if (by === 'phone') {
      devices = await Device.find({ phone: value });
    } else if (by === 'email') {
      devices = await Device.find({ email: value });
    } else if (by === 'deviceID') {
      devices = await Device.find({ deviceID: value });
    } else if (by === 'token') {
      devices = [{ token: value }];
    } else {
      return res.status(400).json({ error: 'Invalid "by" parameter.' });
    }

    const tokens = devices.map(d => d.token).filter(Boolean);
    if (!tokens.length) {
      // Save a log for attempted but not sent
      await PushLog.create({
        by, value, title, body, image, data, status: "error",
        result: { error: "No device tokens found" }
      });
      return res.status(404).json({ error: 'No device tokens found.' });
    }

    const result = await sendPushToDevices(tokens, title, body, data, image);

    // Save push log
    await PushLog.create({
      by, value, title, body, image, data, status: "ok", result
    });

    res.json({ success: true, result });
  } catch (error) {
    // Save error to log
    await PushLog.create({
      by: req.body.by, value: req.body.value, title: req.body.title,
      body: req.body.body, image: req.body.image, data: req.body.data,
      status: "error", result: { error: error.message }
    });
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Register device endpoint
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

// Bulk push: send to all devices
router.post('/send-bulk-push', async (req, res) => {
  try {
    const { title, body, data, image } = req.body;
    const devices = await Device.find({});
    const tokens = devices.map(d => d.token).filter(Boolean);
    if (!tokens.length) {
      await PushLog.create({
        by: "bulk", value: null, title, body, image, data,
        status: "error", result: { error: "No device tokens found" }
      });
      return res.status(404).json({ error: 'No device tokens found.' });
    }
    const result = await sendPushToDevices(tokens, title, body, data, image);

    await PushLog.create({
      by: "bulk", value: null, title, body, image, data, status: "ok", result
    });

    res.json({ success: true, result });
  } catch (error) {
    await PushLog.create({
      by: "bulk", value: null, title: req.body.title, body: req.body.body,
      image: req.body.image, data: req.body.data,
      status: "error", result: { error: error.message }
    });
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /logs - Push history
router.get('/logs', async (req, res) => {
  try {
    const logs = await PushLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
