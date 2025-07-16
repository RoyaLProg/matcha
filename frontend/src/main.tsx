import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import UserProvider from './context/UserContext.tsx'
import WebSocketProvider from './context/WebSocketContext.tsx'
import ChatsProvider from './context/ChatsContext.tsx'

createRoot(document.getElementById('root')!).render(
		<App />
)
