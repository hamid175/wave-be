const express = require("express");
const router = express.Router();

const post = require("../controllers/post.Controller");

router.get("/radius", post.specificDistance);
router.get("/category/:id", post.getPostsByCategoryId);
router.get("/user/:id", post.getPostsByUserId);
router.get("/all", post.allPosts);
router.get("/:id", post.SpecificPost);
router.post("/create", post.addPost);
router.put("/update/:id", post.updatePost);
router.delete("/delete/:id", post.deletePost);

//router.post("/reply/:id", post.replypost);

module.exports = router;
