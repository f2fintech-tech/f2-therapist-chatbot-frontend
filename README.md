# F2 Financial Therapist Chatbot Frontend

A production-ready React + TypeScript frontend for the F2 Financial Therapy AI Chatbot — your personal financial wellness companion.

## 🚀 Features

- 💬 **Real-time AI Chat** — Conversational interface with the financial therapy AI
- 🔐 **Authentication** — JWT-based login/signup with token refresh
- 🌙 **Dark/Light Mode** — System-aware theme switching
- 📱 **Responsive Design** — Mobile-first layout with Tailwind CSS
- 🗂️ **Conversation History** — Browse and manage past conversations
- ⚙️ **User Settings** — Profile management and preferences
- ⚡ **Code Splitting** — Lazy-loaded pages for fast initial load

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS + ShadcnUI (Radix UI) |
| State Management | Zustand |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Icons | Lucide React |
| Date Handling | date-fns |
| Build Tool | Vite 6 |

## 📁 Project Structure

```
src/
├── components/
│   ├── Chat/          # ChatBox, ChatInput, ChatMessage, ChatHeader, ChatSidebar
│   ├── Common/        # Button, Input, Card, Loader, Avatar
│   └── Layout/        # Navbar, Footer, Sidebar
├── config/            # API and app configuration
├── hooks/             # useChat, useAuth, useFetch, useTheme
├── pages/             # ChatPage, LoginPage, SignupPage, SettingsPage, NotFoundPage
├── services/          # Axios API client, chatService, authService, userService
├── store/             # Zustand stores: chatStore, authStore, userStore
├── styles/            # globals.css, animations.css, tailwind.css
├── types/             # TypeScript interfaces: chat, auth, user, api
└── utils/             # formatters, validators, constants, helpers
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running backend API (see [f2-therapist-chatbot-backend](https://github.com/f2fintech-tech/f2-therapist-chatbot-backend))

### Installation

```bash
# Clone the repository
git clone https://github.com/f2fintech-tech/f2-therapist-chatbot-frontend.git
cd f2-therapist-chatbot-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lint:fix
```

## 🐳 Docker

### Build and run with Docker

```bash
docker build -t f2-chatbot-frontend .
docker run -p 3000:80 f2-chatbot-frontend
```

### Docker Compose (with backend)

```bash
docker-compose up
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `REACT_APP_API_TIMEOUT` | API request timeout (ms) | `30000` |
| `REACT_APP_NAME` | App display name | `F2 Therapist Chatbot` |
| `REACT_APP_ENV` | Environment | `development` |
| `REACT_APP_ENABLE_DARK_MODE` | Enable dark mode feature | `true` |

## 📄 License

© 2024 F2 Financial Therapist. All rights reserved.
