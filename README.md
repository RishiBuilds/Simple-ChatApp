# ChatApp

A modern, real-time instant messaging web application with authentication, private messaging, and message persistence. Built with Node.js, Socket.IO, and MongoDB.

![ChatApp](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## Features

### Authentication & Security
- User registration and login with bcrypt password hashing
- Session-based authentication with express-session
- Secure HTTP-only cookies
- XSS protection with input sanitization
- Rate limiting (500ms between messages)
- User input validation

### Messaging
- Real-time messaging using WebSockets (Socket.IO)
- Private one-on-one conversations
- Public channel (#general)
- Message persistence with MongoDB
- Message history loading
- Clickable links with auto-detection
- Message timestamps

### User Experience
- User presence tracking (online user count)
- Modern messaging app UI with sidebar navigation
- Gradient theme with smooth animations
- Glass-morphism design effects
- Responsive layout for all devices
- Notification badges for new messages
- Smooth transitions and hover effects

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Choose one:
  - Local installation - [Download](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas (Free cloud) - [Sign up](https://www.mongodb.com/cloud/atlas/register)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/RishiBuilds/Simple-ChatApp.git
cd Simple-ChatApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment (Optional)**

Copy `.env.example` to `.env` and customize:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/chatapp
SESSION_SECRET=your-random-secret-key-here
PORT=3000
NODE_ENV=development
```

For MongoDB Atlas, use:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
```

4. **Start the server**
```bash
npm start
```

5. **Open your browser**
```
http://localhost:3000
```

## Usage Guide

### Getting Started

1. **Register**: Create a new account
   - Username: 3-20 alphanumeric characters, hyphens, or underscores
   - Password: Minimum 6 characters

2. **Login**: Sign in with your credentials

3. **Public Chat**: Start chatting in the #general channel

4. **Private Messages**: Click on any online user in the sidebar to start a private conversation

5. **Switch Conversations**: Use the sidebar to navigate between channels and direct messages

6. **Logout**: Click the logout button when done

### Features in Action

- **Online Status**: Green dot indicates online users
- **Notification Badges**: Red dot shows unread messages
- **Message History**: Previous messages load automatically
- **Auto-scroll**: Messages scroll automatically when at bottom
- **Link Detection**: URLs are automatically converted to clickable links

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | bcrypt, express-session, connect-mongo |
| **Real-time** | Socket.IO |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |

## Project Structure

```
Simple-ChatApp/
├── public/
│   ├── app.js          # Client-side JavaScript
│   ├── index.html      # Main HTML file
│   └── style.css       # Styles and animations
├── server.js           # Express server & Socket.IO
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # Documentation
```

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Session-based authentication
- ✅ MongoDB session store
- ✅ HTTP-only secure cookies
- ✅ XSS protection (input sanitization)
- ✅ Rate limiting per socket
- ✅ Username validation
- ✅ Maximum user limits
- ✅ Message length restrictions

## UI Features

- Modern gradient theme (purple/blue)
- Glass-morphism effects
- Smooth animations and transitions
- Hover effects with visual feedback
- Pulsing online status indicators
- Blinking notification badges
- Custom scrollbars
- Responsive design
- Mobile-friendly layout

## Troubleshooting

### MongoDB Connection Issues

**Problem**: `MongooseServerSelectionError`

**Solution**:
- Ensure MongoDB is running: `mongod` or check MongoDB service
- Verify connection string in `.env` or use default
- For Atlas: Check network access and credentials

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Session Issues

**Problem**: Users getting logged out frequently

**Solution**:
- Set a strong `SESSION_SECRET` in `.env`
- Check MongoDB connection stability
- Increase cookie `maxAge` in `server.js`

## Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set MONGO_URI="your-mongodb-atlas-uri"
heroku config:set SESSION_SECRET="your-secret-key"
heroku config:set NODE_ENV="production"
git push heroku main
```

### Environment Variables for Production

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatapp
SESSION_SECRET=use-a-strong-random-secret-key
PORT=3000
NODE_ENV=production
```

## Future Enhancements

- [ ] File and image sharing
- [ ] Emoji picker and reactions
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Group chats and channels
- [ ] Message search functionality
- [ ] User profiles with avatars
- [ ] Voice and video calls
- [ ] Message editing and deletion
- [ ] Push notifications
- [ ] Mobile app versions (React Native)
- [ ] End-to-end encryption

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Rishi**
- GitHub: [@RishiBuilds](https://github.com/RishiBuilds)

## Acknowledgments

- Socket.IO for real-time communication
- MongoDB for database solutions
- Express.js for the web framework
- bcrypt for secure password hashing

---

⭐ Star this repo if you find it helpful!