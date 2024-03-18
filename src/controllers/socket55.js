// Send Message and save it in the the database

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const prisma = require("../configs/databaseConfig");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 7000;
const secretKey = process.env.SECRETKEY; // Change this to your actual secret key

// Mapping of client IDs to socket objects
//let connectedClients = {};
let authenticatedUsers = {};

// JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.headers.authorization;

  if (!token) {
    return next(new Error("Authentication token is required"));
  }

  try {
    // Verify and decode the JWT token

    const decoded = jwt.verify(token, secretKey);

    socket.userID = decoded.id;

    socket.username = decoded.firstName;

    return next();
  } catch (error) {
    if (error.message === "jwt expired") {
      console.log("Token Has Expired");
    }

    return next(new Error("Invalid or expired token"));
  }
});

app.get("/", (req, res) => {
  res.send("Server is running!"); // A simple response to confirm that the server is running
});

io.on("connection", (socket) => {
  console.log("A client is being connected with an id of:", socket.userID);

  // Add the connected client to the mapping
  // authenticatedUsers[socket.id] = socket;

  authenticatedUsers[socket.userID] = socket;

  socket.emit("hello", "Welcome to the app!"); // Emitting "hello" message to the client

  // Listen for private messages from clients
  socket.on("privateMessage", async ({ recipientId, message }) => {
    // Find the recipient's socket and send the message directly to them
    let chatId = "65f2e1cf29d369d3a23565b4";
    const recipientSocket = authenticatedUsers[recipientId];
    if (recipientSocket) {
      recipientSocket.emit("privateMessage", {
        senderId: socket.userID,
        message: message,
      });

      try {
        // Save the chat message to the database
        const newChatMessage = await prisma.chatMessages.create({
          data: {
            body: message,
            sender: { connect: { id: socket.userID } },
            receiver: { connect: { id: recipientId } },
            chat: { connect: { id: chatId } },
          },
        });
        console.log("Chat message saved:", newChatMessage);
      } catch (error) {
        console.error("Error saving chat message:", error);
      }
    } else {
      // Handle case where recipient is not found (e.g., offline)
      socket.emit("errorMessage", "Recipient not found or offline");
    }
  });

  socket.on("disconnect", async () => {
    delete authenticatedUsers[socket.userID];

    console.log("User disconnected:", socket.userID);

    socket.broadcast.emit("userDisconnected", socket.userID);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
