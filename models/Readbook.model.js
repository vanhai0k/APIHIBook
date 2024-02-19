var db = require('./db');

const NouvellesSchema = new db.mongoose.Schema({
    like: [
        {
            user_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
            status: {type: String},
        }
    ],
    notification:[
      {
        user_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
        datetime: {type: String},
        statusSend: {type: String}
      }
    ],
    image: { type: String },
    title: { type: String },
    content: { type: String },
    comment: [{
      user_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
      content: {type: String},
  }],
    datepost: { type: String},
    userID: { type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel' },
    statusNols: { type: String},
  });

  let NouvellesModel = db.mongoose.model('NouvellesModel', NouvellesSchema)

  module.exports = {
    NouvellesModel
  }