var db = require('./db');

const MessageSchema = new db.mongoose.Schema({
    sender: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
    receiver: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
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