const prisma = require("../configs/databaseConfig");

// const {  validatechat } = require("../validations/chat ");

require("dotenv").config();

exports.getMessages = async function getChatMessagesByChatId(req, res) {
  try {
    const chatId = req.params.id;

    const chatMessages = await prisma.chatMessages.findMany({
      where: {
        chatId: chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!chatMessages || chatMessages.length === 0) {
      return res.status(404).json({ error: "Chat Id does not exist" });
    }

    return res.status(200).json({ message: chatMessages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};

exports.updateChatMessage = async function getChatMessagesByChatId(req, res) {
  try {
    const messageId = req.params.id;
    const newBody = req.body.newBody;

    const isMessage = await prisma.chatMessages.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!isMessage) {
      return res.status(404).json({ error: "Chat Message Not Found" });
    }

    const newMessage = await prisma.chatMessages.update({
      where: {
        id: messageId,
      },
      data: {
        body: newBody,
      },
    });

    return res.status(200).json({ updatedMessage: newMessage });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

exports.deleteChatMessage = async function getChatMessagesByChatId(req, res) {
  try {
    const messageId = req.params.id;

    const isMessage = await prisma.chatMessages.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!isMessage) {
      return res.status(404).json({ error: "Chat Message Not Found" });
    }

    const newMessage = await prisma.chatMessages.delete({
      where: {
        id: messageId,
      },
    });

    return res.status(200).json({ message: "Message Deleted Successfully" });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
