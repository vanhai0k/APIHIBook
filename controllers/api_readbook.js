const MyModel = require("../models/Readbook.model");
const UserModel = require("../models/User.models");
const { format } = require("date-fns-tz");
const moment = require('moment-timezone');
const date = new Date();
exports.getReadbook = async (req, res, next) => {
  try {
    const allPosts = await MyModel.NouvellesModel.find()
    .populate({
      path: 'like.user_id',
      select: 'image username',
    })
    .populate({
      path: 'notification.user_id',
      select: 'image username',
    })
    .populate({
      path: 'userID',
      populate: {
        path: 'despostes.nouvelles_id',
      },
    }).populate({
      path: 'comment.user_id',
      select: 'image username',
    });
    const postsWithLikeCount = allPosts.map(post => {
      const likeCount = post.like.filter(like => like.status === 'like').length;
      const commentCount = post.comment.length;
      return {
        ...post.toObject(),
        likeCount,
        commentCount
      };
    });

    res.json(postsWithLikeCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.getReadbookUser = async (req, res, next) => {
  const user_id = req.params.user_id
  try {
    const allPosts = await MyModel.NouvellesModel.find({'userID': user_id})
    .populate({
      path: 'like.user_id',
      select: 'image username',
    })
    .populate({
      path: 'notification.user_id',
      select: 'image username',
    }).populate({
      path: 'userID',
      populate: {
        path: 'despostes.nouvelles_id',
      },
    }).populate({
      path: 'comment.user_id',
      select: 'image username',
    });
    res.json(allPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

exports.getNotification = async (req, res, next) => {
  const user_id = req.params.user_id
  try {
    const allPosts = await MyModel.NouvellesModel.find({'userID': user_id})
    .populate({
      path: 'like.user_id',
      select: 'image username',
    })
    .populate({
      path: 'notification.user_id',
      select: 'image username',
    }).populate({
      path: 'userID',
      populate: {
        path: 'despostes.nouvelles_id',
      },
    }).populate({
      path: 'comment.user_id',
      select: 'image username',
    });

     // Kiểm tra và đảo ngược mảng notification nếu tồn tại
     if (allPosts && allPosts.notification) {
      allPosts.notification.reverse();
    }

    res.json(allPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
exports.getComment = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const allPosts = await MyModel.NouvellesModel.findById(postId).populate({
      path: 'like.user_id',
      select: 'image username',
    })
    .populate({
      path: 'notification.user_id',
      select: 'image username',
    }).populate({
      path: 'userID',
      populate: {
        path: 'despostes.nouvelles_id',
      },
    }).populate({
      path: 'comment.user_id',
      select: 'image username',
    });

    if (allPosts && allPosts.comment) {
      allPosts.comment.reverse();
    }

    res.json(allPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const formattedDateVN = moment(date).tz('Asia/Ho_Chi_Minh').format('HH:mm DD-MM-YYYY');
exports.postData = async (req, res, next) => {
  try {
    const { title, content, userID, comment, like } = req.body;

    // Kiểm tra xem người tạo sự kiện có tồn tại không
    const user = await UserModel.userModel.findById(userID);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Người tạo Nouvelles không tồn tại" });
    }
    const initialComment = comment && Array.isArray(comment) ? comment : [];
    const initialLike = like && Array.isArray(like) ? like : [];

    const newEvent = new MyModel.NouvellesModel({
      title,
      content,
      image: req.file.filename,
      userID,
      comment: initialComment,
      like: initialLike,
      datepost: formattedDateVN,
    });

    const saveEvent = await newEvent.save();

    // Kiểm tra nếu user.saveEvent không được định nghĩa hoặc không phải là mảng
    if (!user.saveEvent || !Array.isArray(user.saveEvent)) {
      user.saveEvent = []; // Nếu không, khởi tạo một mảng trống
    }
    user.saveEvent.push(saveEvent._id);

    // Kiểm tra xem user.despostes có được định nghĩa và là mảng không
    if (!user.despostes || !Array.isArray(user.despostes)) {
      user.despostes = [];
    }
    // Thêm ID của bài viết mới vào mảng despostes
    user.despostes.push({ nouvelles_id: saveEvent._id });

    await user.save();
    res
      .status(201)
      .json({ message: "Nouvelles đã được thêm thành công", event: saveEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};


exports.updateStatusNols = async (req, res) => {
  try {
    const { statusNols } = req.body;
    const { postId } = req.params;

    // Kiểm tra xem postId có hợp lệ không
    if (!postId) {
      return res
        .status(400)
        .json({ message: "Missing postId in request parameters" });
    }

    // Tìm bài viết theo postId
    const post = await MyModel.NouvellesModel.findById(postId);

    // Kiểm tra xem bài viết có tồn tại không
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Cập nhật chỉ trường status
    post.statusNols = statusNols;

    // Lưu bài viết đã được cập nhật
    const updatedPost = await post.save();

    res.status(200).json({
      message: "Trạng thái của bài viết đã được cập nhật",
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};

exports.deleteNouvelles = async (req, res) => {
  try {
    const { postId } = req.params;

    // Kiểm tra xem postId có hợp lệ không
    if (!postId) {
      return res
        .status(400)
        .json({ message: "Missing postId in request parameters" });
    }

    // Sử dụng findOneAndDelete để tìm và xóa bài viết theo postId
    const deletedPost = await MyModel.NouvellesModel.findOneAndDelete({
      _id: postId,
    });

    // Kiểm tra xem bài viết có tồn tại không
    if (!deletedPost) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Lấy danh sách người dùng có bài viết đã xóa ID từ despostes
    const usersWithDeletedPost = await UserModel.userModel.find({
      "despostes.nouvelles_id": postId,
    });

    // Duyệt qua danh sách người dùng và xóa ID bài viết khỏi despostes
    for (const user of usersWithDeletedPost) {
      user.despostes = user.despostes.filter(
        (item) => item.nouvelles_id.toString() !== postId
      );
      await user.save();
    }

    res.status(200).json({ message: "Bài viết đã được xóa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};


exports.likeNols = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!postId || !user_id) {
      return res.status(400).json({
        message: "Missing postId or userId in request parameters",
      });
    }

    const post = await MyModel.NouvellesModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Kiểm tra xem người dùng đã like bài viết chưa
    const userLikeIndex = post.like.findIndex(
      (like) => like.user_id && like.user_id.toString() === user_id
    );

    const userNotificationIndex = post.notification.findIndex(
      (notification) => notification.user_id && notification.user_id.toString() === user_id
    );

    if (userLikeIndex !== -1) {
      // Nếu đã like, loại bỏ like
      post.like.splice(userLikeIndex, 1);
      // bỏ thông báo
      post.notification.splice(userNotificationIndex, 1);

    } else {
      // Nếu chưa like, thêm like vào bài viết và tạo thông báo
      post.like.push({ user_id, status: "like" });

      const notification = {
        user_id: user_id, // Người viết bài
        datetime: formattedDateVN, // Thời gian hiện tại
        statusSend: "unread", // Trạng thái thông báo chưa đọc
      };

      post.notification.push(notification);
    }

    // Lưu các thay đổi vào cơ sở dữ liệu
    const updatedPost = await post.save();

    // Trả về kết quả
    res.status(200).json({
      message: userLikeIndex !== -1
        ? "Dislike bài viết thành công"
        : "Like bài viết thành công",
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error });
  }
};


  
exports.commentNols = async (req, res) => {
  const { nouvelleId } = req.params;
    const { user_id, content } = req.body; // Assuming you are sending user_id and content in the request body

    try {
        // Find the Nouvelle by ID
        const nouvelle = await MyModel.NouvellesModel.findById(nouvelleId);

        if (!nouvelle) {
            return res.status(404).json({ message: 'Nouvelle not found' });
        }

        // Add the comment to the array
        nouvelle.comment.push({
            user_id: user_id,
            content: content,
        });

        // Save the updated Nouvelle
        await nouvelle.save();

        return res.status(200).json({ message: 'Comment added successfully', nouvelle });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

exports.UpdateNotificationStatus = async (req, res) => {
  let data = {
    status: 1,
    msg: "update",
  };
  if (req.method == "PATCH") {
    try {
      console.log("ID của tài liệu:", req.params.id);
      console.log("ID của thông báo:", req.params.notificationId);

      await MyModel.NouvellesModel.updateOne(
        { _id: req.params.id, 'notification._id': req.params.notificationId },
        { $set: { 'notification.$.statusSend': 'read' } }
      );
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    res.status(400).json({ status: 0, msg: "Invalid request method" });
  }
}
var db = require('../models/db');
const mongoose = require('mongoose');

exports.countNotificationsByUserId = async (req, res) => {
  try {
      const userID = req.params.userID;

      // Kiểm tra xem userID có hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(userID)) {
          return res.status(400).json({ error: 'Invalid userID' });
      }

      // Tìm kiếm bài viết với userID tương ứng
      const posts = await MyModel.NouvellesModel.find({ userID });

      let totalNotifications = 0;

      // Duyệt qua mỗi bài viết và đếm số lượng thông báo
      posts.forEach(post => {
        post.notification.forEach(notification => {
            if (notification.statusSend === 'unread') {
                totalNotifications++;
            }
        });
    });

      res.json({ totalNotifications });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};





  
  
