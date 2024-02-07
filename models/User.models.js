var db = require('./db');
  
  const UsersSchema = new db.mongoose.Schema({
    messages: [{ type: db.mongoose.Schema.Types.ObjectId, ref: 'message' }],
    username: { type: String },
    password: { type: String },
    email : { type: String},
    phone: { type: String},
    dob: { type: String},
    sex: { type: String},
    image: { type: String},
    despostes: [{ 
      // các bài viết
      nouvelles_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'NouvellesModel'} 
    }],
    friends: [{ 
      user_friend: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'}
     }],
     request: [{
      // danh sách người yêu cầu kb
      user_id: {type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel'},
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
     }]
  },{
    collection: 'Users'
  });
  
  let userModel = db.mongoose.model('userModel', UsersSchema)

  module.exports = {
    userModel
  }