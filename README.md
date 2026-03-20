# Simple ChatApp

A real-time instant messaging web application with a clean and user-friendly interface.

## Features

- Real-time messaging using WebSockets (Socket.IO)
- Modern messaging app UI (messages aligned left/right based on sender)
- User presence tracking (online user count)
- Join/leave notifications
- Dark theme with distinct message bubbles
- Responsive layout
- Message timestamps
- XSS protection

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Enter a username on the login screen
2. Click "Join Chat" or press Enter
3. Start chatting with other users in real-time
4. Type your message and click "Send" or press Enter

## Technology Stack

- Backend: Node.js + Express
- Real-time: Socket.IO
- Frontend: Vanilla JavaScript, HTML5, CSS3

## Future Enhancements

- Private messaging
- Chat rooms
- Message history persistence
- User authentication
- Mobile app versions
- File sharing
- Emoji support