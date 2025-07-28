const fetch = require('node-fetch');
const express = require('express');
const UserDevice = require('../models/UserDevice');
const router = express.Router();

async function sendPushToDevices(messages) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}

// Send personalized push
router.post('/send-push', async (req, res) => {
  const { by = "phone", value, title, body, data } = req.body;
  let users;
  if (by === "email") {
    users = await UserDevice.find({ email: value });
  } else if (by === "deviceID") {
    users = await UserDevice.find({ deviceID: value });
  } else {
    users = await UserDevice.find({ phone: value });
  }

  const messages = users
    .map(user => ({
      to: user.token,
      sound: "default",
      title,
      body,
      data,
    }))
    .filter(msg => msg.to);

  if (messages.length) {
    await sendPushToDevices(messages);
    res.json({ success: true, count: messages.length });
  } else {
    res.json({ success: false, error: 'No users found' });
  }
});

// Send bulk push
router.post('/send-bulk-push', async (req, res) => {
  const { title, body, data } = req.body;
  const users = await UserDevice.find({});
  const messages = users
    .map(user => ({
      to: user.token,
      sound: "default",
      title,
      body,
      data,
    }))
    .filter(msg => msg.to);

  if (messages.length) {
    await sendPushToDevices(messages);
    res.json({ success: true, count: messages.length });
  } else {
    res.json({ success: false, error: 'No users found' });
  }
});

module.exports = router;
