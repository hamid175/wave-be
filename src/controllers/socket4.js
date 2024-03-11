const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 7000;
const secretKey = process.env.SECRETKEY; // Change this to your actual secret key

// Mapping of client IDs to socket objects
let connectedClients = {};

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
    console.error(error);
    return next(new Error("Invalid or expired token"));
  }
});

app.get("/", (req, res) => {
  res.send("Server is running!"); // A simple response to confirm that the server is running
});

io.on("connection", (socket) => {
  console.log("A client is being connected with an id of:", socket.id);

  // Add the connected client to the mapping
  // connectedClients[socket.id] = socket;

  connectedClients[socket.userID] = socket;

  socket.emit("hello", "Welcome to the app!"); // Emitting "hello" message to the client

  // Listen for private messages from clients
  socket.on("privateMessage", ({ recipientId, message }) => {
    // Find the recipient's socket and send the message directly to them
    const recipientSocket = connectedClients[recipientId];
    if (recipientSocket) {
      recipientSocket.emit("privateMessage", {
        senderId: socket.id,
        message: message,
      });
    } else {
      // Handle case where recipient is not found (e.g., offline)
      socket.emit("errorMessage", "Recipient not found or offline");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});