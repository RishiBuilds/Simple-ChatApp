require('dotenv').config();

const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const session   = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');

const app    = express();
const server = http.createServer(app);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, default: null }, // null = public channel
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: MONGO_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.static('public'));

// Socket.IO with session sharing
const io = socketIo(server, {
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

const MAX_USERNAME_LEN = 20;
const MAX_MESSAGE_LEN  = 500;
const RATE_LIMIT_MS    = 500;   
const MAX_USERS        = 50;

const onlineUsers = new Map(); // socketId -> username
const userSockets = new Map(); // username -> socketId
const lastSent    = new Map();

function sanitize(str) {
  return String(str).trim().replace(/\s+/g, ' ');
}

function isValidUsername(name) {
  return (
    typeof name === 'string' &&
    name.length >= 3 &&
    name.length <= MAX_USERNAME_LEN &&
    /^[\w\-]+$/.test(name)
  );
}

function log(label, ...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${label}`, ...args);
}

// REST API endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        error: 'Invalid username. Use 3-20 alphanumeric characters, hyphens, or underscores.' 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.toLowerCase(),
      password: hashedPassword
    });

    await user.save();
    req.session.username = user.username;
    
    log('register', user.username);
    res.json({ success: true, username: user.username });
  } catch (error) {
    log('register error', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.username = user.username;
    
    log('login', user.username);
    res.json({ success: true, username: user.username });
  } catch (error) {
    log('login error', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/logout', (req, res) => {
  const username = req.session.username;
  req.session.destroy();
  log('logout', username);
  res.json({ success: true });
});

app.get('/api/session', (req, res) => {
  if (req.session.username) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/api/messages/public', async (req, res) => {
  try {
    if (!req.session.username) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const messages = await Message.find({ to: null })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    log('fetch messages error', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

app.get('/api/messages/private/:otherUser', async (req, res) => {
  try {
    if (!req.session.username) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { otherUser } = req.params;
    const currentUser = req.session.username;

    const messages = await Message.find({
      $or: [
        { from: currentUser, to: otherUser },
        { from: otherUser, to: currentUser }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

    res.json(messages.reverse());
  } catch (error) {
    log('fetch private messages error', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  const username = socket.request.session?.username;
  
  if (!username) {
    socket.emit('error-msg', 'Not authenticated.');
    socket.disconnect(true);
    return;
  }

  log('connect', username, socket.id);

  if (onlineUsers.size >= MAX_USERS) {
    socket.emit('error-msg', 'Server is full. Try again later.');
    socket.disconnect(true);
    return;
  }

  // Handle duplicate connections
  const existingSocketId = userSockets.get(username);
  if (existingSocketId) {
    const existingSocket = io.sockets.sockets.get(existingSocketId);
    if (existingSocket) {
      existingSocket.disconnect(true);
    }
  }

  onlineUsers.set(socket.id, username);
  userSockets.set(username, socket.id);

  // Send online users list
  const onlineUsersList = Array.from(new Set(onlineUsers.values()));
  io.emit('users-online', { users: onlineUsersList, count: onlineUsersList.length });

  socket.on('message', async (data) => {
    const username = onlineUsers.get(socket.id);
    if (!username) return;

    const now  = Date.now();
    const last = lastSent.get(socket.id) ?? 0;
    if (now - last < RATE_LIMIT_MS) return;
    lastSent.set(socket.id, now);

    if (!data || typeof data.text !== 'string') return;

    const text = sanitize(data.text).slice(0, MAX_MESSAGE_LEN);
    if (!text) return;

    const to = data.to || null;

    try {
      const message = new Message({
        from: username,
        to: to,
        text: text,
        timestamp: new Date()
      });

      await message.save();

      const payload = {
        from: username,
        to: to,
        text: text,
        timestamp: message.timestamp.toISOString()
      };

      if (to) {
        // Private message
        const recipientSocketId = userSockets.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('private-message', payload);
        }
        socket.emit('private-message', payload);
      } else {
        // Public message
        io.emit('message', payload);
      }
    } catch (error) {
      log('message save error', error);
    }
  });

  socket.on('disconnect', (reason) => {
    const username = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    lastSent.delete(socket.id);

    if (username) {
      userSockets.delete(username);
      log('disconnect', username, `(reason: ${reason})`);
      
      const onlineUsersList = Array.from(new Set(onlineUsers.values()));
      io.emit('users-online', { users: onlineUsersList, count: onlineUsersList.length });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('server', `running at http://localhost:${PORT}`);
});