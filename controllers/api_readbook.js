const MyModel = require("../models/Readbook.model");
const UserModel = require("../models/User.models");
const { format } = require("date-fns-tz");
const moment = require('moment-timezone');
const date = new Date();
exports.getReadbook = async (req, res, next) => {
  try {
    const allPosts = await MyModel.NouvellesModel.find().populate({
      path: 'like.user_id',
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
exports.getComment = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const allPosts = await MyModel.NouvellesModel.findById(postId).populate({
      path: 'like.user_id',
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
  
      let userLike;
  
      // Kiểm tra xem post.like có tồn tại và không rỗng
      if (post.like && post.like.length > 0) {
        userLike = post.like.find(like => like.user_id && like.user_id.toString() === user_id);
  
        if (userLike) {
          // Nếu đã like, loại bỏ like; nếu chưa like, thêm like
          post.like = post.like.filter(like => like.user_id && like.user_id.toString() !== user_id);
        } else {
          post.like.push({ user_id, status: "like" });
        }
      } else {
        // Nếu post.like không tồn tại hoặc rỗng, thêm một phần tử mới
        post.like = [{ user_id, status: "like" }];
      }

      const updatedPost = await post.save();
      // Tìm và cập nhật người dùng để lưu trạng thái likeStatus
      const user = await UserModel.userModel.findById(user_id);
      if (user) {
        user.likeStatus = userLike ? "disliked" : "liked";
        await user.save();
      } else {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }
  
      res.status(200).json({ message: userLike ? "Dislike bài viết thành công" : "Like bài viết thành công", post: updatedPost });
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


  
  
