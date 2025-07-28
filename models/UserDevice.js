const mongoose = require('mongoose');
const UserDeviceSchema = new mongoose.Schema({
  token: String,
  phone: String,
  email: String,
  deviceID: String,
});
module.exports = mongoose.model('UserDevice', UserDeviceSchema);
