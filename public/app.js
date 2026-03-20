let socket = null;
let currentUsername = '';
let currentChannel = 'general'; // 'general' or username for DM

// DOM elements
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');

const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

const logoutBtn = document.getElementById('logout-btn');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatTitle = document.getElementById('chat-title');
const userCount = document.getElementById('user-count');
const usersList = document.getElementById('users-list');
const channelGeneral = document.getElementById('channel-general');

// Check session on load
checkSession();

async function checkSession() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    
    if (data.authenticated) {
      currentUsername = data.username;
      showChatScreen();
    }
  } catch (error) {
    console.error('Session check failed:', error);
  }
}

// Auth form switching
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  authError.classList.add('hidden');
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  authError.classList.add('hidden');
});

// Login
loginBtn.addEventListener('click', handleLogin);
loginPassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    showAuthError('Please enter username and password');
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      currentUsername = data.username;
      showChatScreen();
    } else {
      showAuthError(data.error || 'Login failed');
    }
  } catch (error) {
    showAuthError('Login failed. Please try again.');
  }
}

// Register
registerBtn.addEventListener('click', handleRegister);
registerPassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleRegister();
});

async function handleRegister() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;

  if (!username || !password) {
    showAuthError('Please enter username and password');
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      currentUsername = data.username;
      showChatScreen();
    } else {
      showAuthError(data.error || 'Registration failed');
    }
  } catch (error) {
    showAuthError('Registration failed. Please try again.');
  }
}

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    currentUsername = '';
    currentChannel = 'general';
    messagesDiv.innerHTML = '';
    usersList.innerHTML = '';
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    loginUsername.value = '';
    loginPassword.value = '';
  } catch (error) {
    console.error('Logout failed:', error);
  }
});

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

function showChatScreen() {
  authScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  connectSocket();
  loadMessages();
}

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('message', (data) => {
    if (currentChannel === 'general') {
      displayMessage(data, false);
    }
  });

  socket.on('private-message', (data) => {
    const otherUser = data.from === currentUsername ? data.to : data.from;
    
    if (currentChannel === otherUser) {
      displayMessage(data, true);
    } else {
      // Show notification badge (simplified)
      highlightUser(otherUser);
    }
  });

  socket.on('users-online', ({ users, count }) => {
    updateUsersList(users);
    userCount.textContent = `${count} online`;
  });

  socket.on('connect_error', () => {
    addSystemMessage('Connection lost — retrying…');
  });

  socket.on('reconnect', () => {
    addSystemMessage('Reconnected');
  });

  socket.on('error-msg', (msg) => {
    addSystemMessage(`⚠ ${msg}`);
  });
}

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !socket) return;

  const payload = {
    text: text,
    to: currentChannel === 'general' ? null : currentChannel
  };

  socket.emit('message', payload);
  messageInput.value = '';
  messageInput.focus();
}

function displayMessage(data, isPrivate) {
  const isMe = data.from === currentUsername;
  const time = formatTime(data.timestamp);

  const el = document.createElement('div');
  el.className = `message ${isMe ? 'message-right' : 'message-left'}`;
  el.innerHTML = `
    <div class="message-bubble">
      <div class="message-header">
        <span class="username">${escapeHtml(data.from)}</span>
        <span class="timestamp">${time}</span>
      </div>
      <div class="message-text">${linkify(escapeHtml(data.text))}</div>
    </div>
  `;

  appendAndScroll(el);
}

async function loadMessages() {
  try {
    let url;
    if (currentChannel === 'general') {
      url = '/api/messages/public';
    } else {
      url = `/api/messages/private/${currentChannel}`;
    }

    const res = await fetch(url);
    const messages = await res.json();

    messagesDiv.innerHTML = '';
    messages.forEach(msg => {
      displayMessage({
        from: msg.from,
        to: msg.to,
        text: msg.text,
        timestamp: msg.timestamp
      }, currentChannel !== 'general');
    });
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

function updateUsersList(users) {
  usersList.innerHTML = '';
  
  users
    .filter(u => u !== currentUsername)
    .sort()
    .forEach(user => {
      const el = document.createElement('div');
      el.className = 'user-item';
      el.dataset.username = user;
      el.innerHTML = `
        <span class="user-status"></span>
        <span class="user-name">${escapeHtml(user)}</span>
      `;
      
      el.addEventListener('click', () => switchToUser(user));
      usersList.appendChild(el);
    });
}

function switchToUser(username) {
  currentChannel = username;
  chatTitle.textContent = `@ ${username}`;
  messageInput.placeholder = `Message @${username}`;
  
  // Update active state
  document.querySelectorAll('.user-item, .channel-item').forEach(el => {
    el.classList.remove('active');
  });
  
  const userEl = document.querySelector(`.user-item[data-username="${username}"]`);
  if (userEl) {
    userEl.classList.add('active');
    userEl.classList.remove('has-notification');
  }
  
  loadMessages();
}

channelGeneral.addEventListener('click', () => {
  currentChannel = 'general';
  chatTitle.textContent = '# general';
  messageInput.placeholder = 'Type a message...';
  
  document.querySelectorAll('.user-item, .channel-item').forEach(el => {
    el.classList.remove('active');
  });
  channelGeneral.classList.add('active');
  
  loadMessages();
});

function highlightUser(username) {
  const userEl = document.querySelector(`.user-item[data-username="${username}"]`);
  if (userEl && !userEl.classList.contains('active')) {
    userEl.classList.add('has-notification');
  }
}

// Helpers
function appendAndScroll(el) {
  const isAtBottom =
    messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 60;
  messagesDiv.appendChild(el);
  if (isAtBottom) messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  appendAndScroll(el);
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}
