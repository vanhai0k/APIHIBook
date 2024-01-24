const MyModel = require('../models/User.models')
const bcrypt = require('bcrypt');
const router = require('../routes/api');


exports.getUser = async (req, res, next) => {
  try {
    const allPosts = await MyModel.userModel.find().populate({
      path: 'friends.user_friend',
      select: 'image username',
    }).populate('despostes.nouvelles_id')
    res.json(allPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.registerUser = async (req, res, next) =>{

    const { username, email ,password, dob, phone, tokenNotify} = req.body;
    const existingUser = await MyModel.userModel.findOne({ username });
    const existingEmail = await MyModel.userModel.findOne({ email });
    const existingPhone = await MyModel.userModel.findOne({ phone });
    const image = 'https://i.pinimg.com/564x/16/3e/39/163e39beaa36d1f9a061b0f0c5669750.jpg'
    const sex = 'Khác'
    
    if (existingUser) {
      return res.status(409).json({ message: 'Tên người dùng đã tồn tại' });
    }
    if (existingEmail) {
      return res.status(401).json({ message: 'Email người dùng đã tồn tại' });
    }
    if (existingPhone) {
      return res.status(403).json({ message: 'Phone người dùng đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPerson = new MyModel.userModel({ username , email, password: hashedPassword, image, dob, sex, phone, tokenNotify });
  
    newPerson
      .save()
      .then(() => {
        res.status(201).json({ message: "Đăng ký thành công" });
      })
      .catch((error) => {
        console.error("Lưu thất bại:", error);
        res.status(500).json({ error: "Lỗi server" });
      });
}
exports.loginUser = async (req, res, next) =>{  
    try {
      const { username, password } = req.body;
  
      const user = await MyModel.userModel.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Tên người dùng không tồn tại' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(403).json({ message: 'Mật khẩu không chính xác' });
      }
    //   const token = jwt.sign({ userId: user._id }, 'secretKey');
  
    //   res.json({ token });
      res.status(201).json({ message: 'Đăng nhập thành công',password: user.password,
      _id: user._id,email: user.email, username: user.username,phone: user.phone, 
      image: user.image,phone: user.phone,dob: user.dob,sex: user.sex, despostes:user.despostes});
    } catch (error) {
      console.error('Đăng nhập thất bại:', error);
      res.status(500).json({ message: 'Đăng nhập thất bại' });
    }
}

exports.sendfriend = async (req, res) => {
  try {
    const { user_id } = req.body;
    const { friendId } = req.params;

    // Check if the users exist
    const user = await MyModel.userModel.findById(user_id);
    const friend = await MyModel.userModel.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    // Check if the friend request already exists
    const existingRequest = user.request.find(req => req.user_id.equals(friendId));

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request to the user's request array
    user.request.push({ user_id: friendId, status: 'pending' });
    await user.save();

    res.json({ success: true, message: 'Friend request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.updatefriendrequet = async (req, res) => {
  try {
    const { friendId } = req.params;

    // Assuming userId is obtained from authentication or another source
    const { user_id } = req.body; // Replace with the actual way you get the user ID

    // Check if the users exist
    const user = await MyModel.userModel.findById(user_id);
    const friend = await MyModel.userModel.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    // Check if the friend request exists
    const existingRequestIndex = user.request.findIndex(req => req.user_id.equals(friendId));

    if (existingRequestIndex !== -1) {
      // If the friend request exists, update the status (e.g., 'accepted' or 'rejected')
      const { status } = req.body; // Assuming the status is sent in the request body
      if (['accepted', 'rejected'].includes(status)) {
        const existingRequest = user.request[existingRequestIndex];

        // Update the status
        existingRequest.status = status;

        // If accepted, add friend to the user's friends array and remove the request
        if (status === 'accepted') {
          user.friends.push( {user_friend : friendId} );
          user.request.splice(existingRequestIndex, 1);
        } else {
          // If rejected, simply remove the request
          user.request.splice(existingRequestIndex, 1);
        }

        await user.save();

        res.json({ success: true, message: `Friend request ${status} successfully` });
      } else {
        res.status(400).json({ error: 'Invalid status value' });
      }
    } else {
      // If the friend request does not exist, return an error
      res.status(404).json({ error: 'Friend request not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}