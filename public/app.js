const socket = io();

const loginScreen   = document.getElementById('login-screen');
const chatScreen    = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn       = document.getElementById('join-btn');
const messagesDiv   = document.getElementById('messages');
const messageInput  = document.getElementById('message-input');
const sendBtn       = document.getElementById('send-btn');
const userCount     = document.getElementById('user-count');

let currentUsername = '';

// Join
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinChat();
});

function joinChat() {
  const username = usernameInput.value.trim();
  if (!username) {
    shakEl(usernameInput);
    return;
  }
  currentUsername = username;
  socket.emit('join', username);
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
}

// Send 
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('message', { text });
  messageInput.value = '';
  messageInput.focus();
}

// Receive 
socket.on('message', (data) => {
  const isMe = data.username === currentUsername;
  const time = formatTime(data.timestamp);

  const el = document.createElement('div');
  el.className = `message ${isMe ? 'message-right' : 'message-left'}`;
  el.innerHTML = `
    <div class="message-bubble">
      <div class="message-header">
        <span class="username">${escapeHtml(data.username)}</span>
        <span class="timestamp">${time}</span>
      </div>
      <div class="message-text">${linkify(escapeHtml(data.text))}</div>
    </div>
  `;

  appendAndScroll(el);
});

// Presence 
socket.on('user-joined', ({ username, userCount: count }) => {
  updateUserCount(count);
  addSystemMessage(`${username} joined`);
});

socket.on('user-left', ({ username, userCount: count }) => {
  updateUserCount(count);
  addSystemMessage(`${username} left`);
});

socket.on('connect_error', () => {
  addSystemMessage('connection lost — retrying…');
});

socket.on('reconnect', () => {
  addSystemMessage('reconnected');
});

// Helpers 
function updateUserCount(count) {
  userCount.textContent = `${count} online`;
}

function addSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  appendAndScroll(el);
}

function appendAndScroll(el) {
  const isAtBottom =
    messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 60;
  messagesDiv.appendChild(el);
  if (isAtBottom) messagesDiv.scrollTop = messagesDiv.scrollHeight;
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

function shakEl(el) {
  el.style.animation = 'none';
  el.offsetHeight; 
  el.style.animation = 'shake 0.35s ease';
  el.addEventListener('animationend', () => (el.style.animation = ''), { once: true });
}

socket.on('error-msg', (msg) => addSystemMessage(`⚠ ${msg}`));