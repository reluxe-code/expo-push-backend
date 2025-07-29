const mongoose = require('mongoose');
const PushLogSchema = new mongoose.Schema({
  by: String,
  value: String,
  title: String,
  body: String,
  image: String,
  data: mongoose.Schema.Types.Mixed,
  status: String,
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PushLog', PushLogSchema);
