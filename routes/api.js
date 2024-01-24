var express = require('express')
var router = express.Router();
var apiU = require('../controllers/api_users')
var apiRead = require('../controllers/api_readbook')

var multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function name(req, file, cb) {
        cb(null, file.fieldname + "" + Date.now() + "" + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    
}).single('image');

// Người dùng
router.get('/getUsers', apiU.getUser)
router.post('/register', apiU.registerUser);
router.post('/login', apiU.loginUser);
// gửi yêu cầu kb
router.post('/sendfriend/:friendId',apiU.sendfriend)
// đồng ý kb
router.put('/updatefriend/:friendId',apiU.updatefriendrequet)


// Bài đăng
// danh sach ban tin
router.get('/getReadbook',apiRead.getReadbook)

// post bài đăng
router.post('/postReadbook', upload ,apiRead.postData);
// cập nhập trạng thái bài đăng (riêng tư, ẩn, công khai)
router.patch('/updateStatus/:postId', apiRead.updateStatusNols)
// xóa bài viết
router.delete('/deletePost/:postId',apiRead.deleteNouvelles)
// like bài viết và dislike khi click lại
router.post('/likePost/:postId', apiRead.likeNols)


module.exports = router;
