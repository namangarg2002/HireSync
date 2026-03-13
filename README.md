# HireSync

HireSync is a real-time collaborative coding interview platform designed to facilitate seamless pair programming and technical interviews. It allows users to connect via video chat, share a live code editor, and solve coding problems together, making it ideal for remote interviews and collaborative learning.

## Features

- **Real-time Collaboration**: Live code editing with syntax highlighting and multi-language support.
- **HD Video Call**: Crystal-clear video and audio communication using Stream Video SDK.
- **Integrated Chat**: Real-time messaging during sessions via Stream Chat.
- **Problem Library**: Curated coding problems with examples, constraints, and difficulty levels.
- **Session Management**: Create, join, and end coding sessions with participant limits.
- **Code Execution**: Run and test code in multiple languages (JavaScript, Python, Java, C++).
- **User Authentication**: Secure login and user management with Clerk.
- **Responsive Design**: Built with Tailwind CSS and DaisyUI for a modern, mobile-friendly UI.

## Tech Stack

### Frontend
- **React**: Component-based UI library.
- **Vite**: Fast build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **DaisyUI**: Component library for Tailwind.
- **Monaco Editor**: Code editor with syntax highlighting.
- **React Router**: Client-side routing.
- **Axios**: HTTP client for API requests.
- **React Query**: Data fetching and caching.
- **Stream Video React SDK**: Video calling and chat integration.
- **Clerk**: Authentication and user management.

### Backend
- **Node.js**: JavaScript runtime.
- **Express**: Web framework for APIs.
- **MongoDB**: NoSQL database with Mongoose ODM.
- **Stream Chat/Node SDK**: Real-time chat and video services.
- **Inngest**: Event-driven functions for user synchronization.
- **Clerk Express**: Server-side authentication middleware.

### Other Tools
- **UUID**: Unique identifier generation.
- **Canvas Confetti**: Celebration animations.
- **Date-fns**: Date formatting utilities.
- **React Hot Toast**: Notification system.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Accounts for Clerk, Stream, and Inngest (for API keys)

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/namangarg2002/HireSync.git
   cd HireSync