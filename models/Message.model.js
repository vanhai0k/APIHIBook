var db = require('./db');

const MessageSchema = new db.mongoose.Schema({
    sender: {type: String},
    receiver: {type: String},
    messages: [{
        user_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
        message: {type: String},
        timestamp: { type: String }
    }],
    
});

let MessageesModel = db.mongoose.model('MessageesModel', MessageSchema)

module.exports = {
    MessageesModel
}