const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

app.use(express.static('public'));

const MAX_USERNAME_LEN = 20;
const MAX_MESSAGE_LEN  = 500;
const RATE_LIMIT_MS    = 500;   
const MAX_USERS        = 50;

const users    = new Map();   
const lastSent = new Map();   

function sanitize(str) {
  return String(str).trim().replace(/\s+/g, ' ');
}

function isValidUsername(name) {
  return (
    typeof name === 'string' &&
    name.length >= 1 &&
    name.length <= MAX_USERNAME_LEN &&
    /^[\w\-. ]+$/.test(name)   
  );
}

function broadcast(event, payload) {
  io.emit(event, payload);
}

function log(label, ...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${label}`, ...args);
}

io.on('connection', (socket) => {
  log('connect', socket.id);

  socket.on('join', (rawUsername) => {
    if (users.has(socket.id)) {
      socket.emit('error-msg', 'Already joined.');
      return;
    }

    if (users.size >= MAX_USERS) {
      socket.emit('error-msg', 'Server is full. Try again later.');
      socket.disconnect(true);
      return;
    }

    const username = sanitize(rawUsername);

    if (!isValidUsername(username)) {
      socket.emit('error-msg', 'Invalid username. Use 1–20 alphanumeric characters.');
      return;
    }

    const taken = [...users.values()].some(
      (u) => u.toLowerCase() === username.toLowerCase()
    );
    if (taken) {
      socket.emit('error-msg', 'Username already taken.');
      return;
    }

    users.set(socket.id, username);
    log('join', username, `(${users.size} online)`);

    broadcast('user-joined', { username, userCount: users.size });
  });

  socket.on('message', (data) => {
    const username = users.get(socket.id);
    if (!username) return; 

    const now  = Date.now();
    const last = lastSent.get(socket.id) ?? 0;
    if (now - last < RATE_LIMIT_MS) return;
    lastSent.set(socket.id, now);

    if (!data || typeof data.text !== 'string') return;

    const text = sanitize(data.text).slice(0, MAX_MESSAGE_LEN);
    if (!text) return;

    broadcast('message', {
      username,
      text,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason) => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    lastSent.delete(socket.id);

    if (username) {
      log('disconnect', username, `(reason: ${reason}) (${users.size} online)`);
      broadcast('user-left', { username, userCount: users.size });
    } else {
      log('disconnect', socket.id, '(never joined)');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('server', `running at http://localhost:${PORT}`);
});