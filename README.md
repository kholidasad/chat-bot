# AI Chatbot - ChatGPT Clone

A full-featured AI chatbot built with AWS Bedrock, featuring a modern ChatGPT-like interface with streaming responses, conversation management, and advanced UI features.

## 🚀 Quick Deploy

### Option 1: Deploy to Vercel (Production)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bedrock-chatbot)

**5-minute setup:** See [QUICK_START_VERCEL.md](./QUICK_START_VERCEL.md)

### Option 2: Run Locally (Development)
```bash
npm install
npm start
# Open http://localhost:3000
```

**Full guide:** Continue reading below

## Features

### Core Chat Features
- **Real-time Streaming Responses** - See AI responses appear word by word
- **Markdown Support** - Full markdown rendering including headers, lists, links, and more
- **Code Syntax Highlighting** - Automatic syntax highlighting for 180+ programming languages
- **Copy Code Blocks** - One-click copy buttons for all code snippets
- **Message Timestamps** - Track when each message was sent

### Conversation Management
- **Multiple Conversations** - Create and switch between different chat sessions
- **Auto-generated Titles** - Conversations are automatically titled based on first message
- **Rename Chats** - Edit chat titles for better organization
- **Delete Chats** - Remove unwanted conversations
- **Search Chats** - Search through all your conversations
- **Export Chats** - Download conversations as Markdown files

### Advanced Controls
- **Stop Generation** - Interrupt AI responses mid-generation (Escape key)
- **Regenerate Response** - Get a new response for the last message
- **Edit & Resend** - Edit previous messages (coming feature)
- **Scroll to Bottom** - Quick navigation button when scrolling up

### UI/UX Features
- **Dark/Light Mode** - Toggle between themes (Ctrl+D)
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Auto-resizing Input** - Text area grows as you type
- **Typing Indicators** - Visual feedback while AI is thinking
- **Message Actions** - Copy, regenerate, and more on hover

### Keyboard Shortcuts
- `Ctrl + K` - Start a new chat
- `Ctrl + D` - Toggle dark/light mode
- `Ctrl + /` - Focus the message input
- `Enter` - Send message
- `Shift + Enter` - New line in message
- `Escape` - Stop AI generation

### Analytics & Monitoring
- **Cost Monitor** - Track token usage and estimated costs
- **Session History** - View all past conversations
- **Usage Statistics** - Total tokens and requests

## Deployment Options

This chatbot can be deployed in two ways:

### 🌐 Cloud Deployment (Vercel)
- **Best for:** Production, public access, auto-scaling
- **Setup time:** 5 minutes
- **Cost:** Free tier available
- **Guide:** [QUICK_START_VERCEL.md](./QUICK_START_VERCEL.md)

```bash
./deploy-vercel.sh
```

### 💻 Local Development
- **Best for:** Development, testing, learning
- **Setup time:** 5 minutes
- **Cost:** Free
- **Guide:** Continue below

**Compare options:** See [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)

---

## Local Installation

### Prerequisites
- Node.js (v16 or higher)
- AWS Account with Bedrock access
- Redis (for session management)

### Setup

1. Clone the repository:
```bash
cd bedrock-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AGENT_ID=your-agent-id
AGENT_ALIAS_ID=your-agent-alias-id
```

4. Start Redis (if not already running):
```bash
redis-server
```

5. Run the application:
```bash
npm start
```

6. Open your browser:
```
http://localhost:3000
```

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **AWS Bedrock** - AI model provider
- **SQLite** - Chat history storage
- **Redis** - Session management

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **Marked.js** - Markdown parsing
- **Highlight.js** - Code syntax highlighting
- **Font Awesome** - Icons
- **Server-Sent Events (SSE)** - Real-time streaming

## API Endpoints

### Chat Operations
- `GET /chat-stream` - Stream AI responses (SSE)
- `POST /reset` - Create a new chat session
- `POST /stop-generation/:streamId` - Stop ongoing generation

### History Management
- `GET /chat-history` - Get all chats or specific session
- `GET /chat-history?search=query` - Search chats
- `PUT /chat-history/:sessionId` - Rename a chat
- `DELETE /chat-history/:sessionId` - Delete a chat

### Analytics
- `GET /cost-monitor` - Get token usage and costs

## Project Structure

```
bedrock-chatbot/
├── public/
│   └── index.html          # Frontend (HTML/CSS/JS)
├── server.js               # Backend server
├── package.json            # Dependencies
├── chat_history.db         # SQLite database
├── .env                    # Environment variables
└── README.md              # Documentation
```

## Features Breakdown

### 1. Streaming Chat
Messages stream in real-time using Server-Sent Events (SSE), providing a smooth user experience similar to ChatGPT.

### 2. Code Highlighting
All code blocks are automatically detected and highlighted with appropriate syntax coloring. Supports 180+ languages including:
- JavaScript/TypeScript
- Python
- Java, C++, C#
- Go, Rust, Swift
- SQL, HTML, CSS
- And many more!

### 3. Session Management
- Each conversation is saved with a unique session ID
- Auto-generates meaningful titles from the first message
- Sessions persist across page refreshes
- Full conversation history stored in SQLite

### 4. Cost Tracking
Monitor your AWS Bedrock usage with detailed analytics:
- Tokens used per request
- Estimated costs
- Total usage statistics
- Per-session breakdown

### 5. Responsive Design
The interface adapts to different screen sizes:
- Desktop: Full sidebar with chat list
- Tablet: Collapsible sidebar
- Mobile: Overlay sidebar menu

## Customization

### Changing the Theme Colors
Edit the CSS variables in `public/index.html`:

```css
:root {
    --primary-color: #10a37f;
    --primary-hover: #0d8a6b;
    /* ... more colors */
}
```

### Adjusting Model Settings
Modify the AWS Bedrock configuration in `server.js`:

```javascript
const AGENT_ID = "your-agent-id";
const AGENT_ALIAS_ID = "your-agent-alias-id";
```

## Troubleshooting

### Redis Connection Error
Make sure Redis is running:
```bash
redis-server
```

### SQLite Database Issues
Delete and recreate the database:
```bash
rm chat_history.db
node server.js
```

### Port Already in Use
Change the port in `server.js`:
```javascript
app.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});
```

## Performance Tips

1. **Large Chat History** - Clear old conversations periodically
2. **Redis Memory** - Monitor Redis memory usage for long-running sessions
3. **Database Size** - Archive old chats if database grows too large

## Future Enhancements

- [ ] User authentication and multi-user support
- [ ] File upload and image analysis
- [ ] Voice input/output
- [ ] Chat folders and tags
- [ ] Advanced search with filters
- [ ] Message editing
- [ ] Code execution playground
- [ ] Export to PDF
- [ ] Share conversations via link

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions, please check:
- AWS Bedrock documentation
- Express.js documentation
- Redis documentation

---

Built with AWS Bedrock and modern web technologies.
