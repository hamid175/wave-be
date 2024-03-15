const prisma = require("../configs/databaseConfig");
const { postScheema, postUpdate } = require("../validations/post");

const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);
server.listen(6000);

require("dotenv").config();
io.on("connection", (socket) => {
  console.log("A client connected");
});

exports.addPost = async (req, res) => {
  try {
    const { error, value } = postScheema(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const { title, body, address, longitude, latitude, userId, categoryId } =
      value;

    const isUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const isCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!isCategory) {
      return res.status(404).json({ message: "message Category not found" });
    }
    const categoryName = isCategory.name;
    if (!isUser) {
      return res.status(404).json({ message: "message User not found" });
    }

    const poste = await prisma.post.create({
      data: {
        title,
        body,
        address,
        longitude,
        latitude,
        userId,
        categoryId,
        categoryName,
      },
    });

    return res.status(201).json({
      message: "Post created successfully",
      data: poste,
    });
  } catch (error) {
    if (error.code === "P2023") {
      if (error.post.includes("User")) {
        return res.status(404).json({ message: "Invalid User Id format" });
      } else if (error.message.includes("Category")) {
        return res.status(404).json({ message: "Invalid Category Id format" });
      }
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id; // contain post id

    const isPost = await prisma.post.findUnique({
      where: {
        id: postId, // contain post data
      },
    });

    if (!isPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    io.emit("deletePost", postId);

    return res.status(200).json({ message: "Post Deleted Successfully" });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { error, value } = postUpdate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const { title, body, address, longitude, latitude, categoryId } = value;

    const isPost = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });
    if (!isPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    if (categoryId !== undefined) {
      const isCategory = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

      if (!isCategory) {
        return res.status(404).json({ message: "Post Category not found" });
      }

      const updatePost = await prisma.post.update({
        where: {
          id: req.params.id,
        },
        data: {
          title: value?.title,
          body: value?.body,
          address: value?.address,
          longitude: value?.longitude,
          latitude: value?.latitude,
          categoryId: value?.categoryId,
        },
      });

      return res
        .status(201)
        .json({ message: "Post Updated Successfully", data: updatePost });
    }
  } catch (error) {
    if (error.code === "P2023") {
      if (error.message.includes("User")) {
        return res.status(404).json({ message: "Invalid User Id format" });
      } else if (error.message.includes("Category")) {
        return res.status(404).json({ message: "Invalid Category Id format" });
      }
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.SpecificPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const isPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!isPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    return res
      .status(200)
      .json({ message: "Post Fetched Successfully", data: isPost });
  } catch (error) {
    if (error.code === "P2023") {
      return res
        .status(404)
        .json({ message: "User Id or Category Id has not correct format" });
    }
    console.error(error);

    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.allPosts = async (req, res) => {
  try {
    const isPost = await prisma.post.findMany();

    if (!isPost) {
      return res.status(404).json({ message: "Post Not Found" });
    }

    return res
      .status(200)
      .json({ message: "Post Fetched Successfully", data: isPost });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPostsByUserId = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.params.id,
      },
    });
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts found for the specified User" });
    }
    return res
      .status(200)
      .json({ message: "Post Fetched Successfully", data: posts });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPostsByCategoryId = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const posts = await prisma.post.findMany({
      where: {
        categoryId: categoryId,
      },
    });
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts found for the specified category" });
    }
    return res
      .status(200)
      .json({ message: "Post Fetched Successfully", data: posts });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.specificDistance = async (req, res) => {};
