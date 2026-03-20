# ChatApp

A real-time instant messaging web application with authentication, private messaging, and message persistence.

## Features

- User authentication (registration & login with bcrypt password hashing)
- Real-time messaging using WebSockets (Socket.IO)
- Private one-on-one conversations
- Public channel (#general)
- Message persistence with MongoDB
- User presence tracking (online user count)
- Modern messaging app UI with sidebar navigation
- Dark theme with distinct message bubbles
- Session management
- Message timestamps
- XSS protection
- Rate limiting
- Responsive layout

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Install MongoDB locally or use a cloud service (MongoDB Atlas)
   - Default connection: `mongodb://localhost:27017/chatapp`
   - To use a different MongoDB URI, set the `MONGO_URI` environment variable

3. (Optional) Set environment variables:
```bash
export MONGO_URI="your-mongodb-connection-string"
export SESSION_SECRET="your-secret-key"
export NODE_ENV="production"  # for production
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Register a new account with username (3-20 characters) and password (min 6 characters)
2. Login with your credentials
3. Chat in the public #general channel
4. Click on any online user in the sidebar to start a private conversation
5. Switch between channels and direct messages using the sidebar
6. Logout when done

## Technology Stack

- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: bcrypt + express-session
- Real-time: Socket.IO
- Frontend: Vanilla JavaScript, HTML5, CSS3

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- XSS protection (input sanitization)
- Rate limiting (500ms between messages)
- HTTP-only cookies
- User input validation
- Maximum user limits

## Future Enhancements

- File sharing
- Emoji support
- Typing indicators
- Read receipts
- Group chats
- Message search
- User profiles
- Mobile app versions