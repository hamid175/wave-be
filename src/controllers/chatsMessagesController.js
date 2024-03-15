const prisma = require("../configs/databaseConfig");

require("dotenv").config();

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, chatId, body } = req.body;

  try {
    const newChatMessage = await prisma.chatMessages.create({
      data: {
        senderId,
        receiverId,
        chatId,
        body,
      },
    });
    res
      .status(201)
      .json({ message: "Chat message created", chatMessage: newChatMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create chat message" });
  }
};

exports.updateChatMessage = async (req, res) => {
  const { id } = req.params;
  const { receiverId, chatId, body } = req.body;

  try {
    const updatedChatMessage = await prisma.chatMessages.update({
      where: { id },
      data: {
        receiverId,
        chatId,
        body,
      },
    });

    res.status(200).json(updatedChatMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update chat message" });
  }
};

exports.getChatMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const chatMessages = await prisma.chatMessages.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    res.status(200).json(chatMessages);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve chat messages" });
  }
};
