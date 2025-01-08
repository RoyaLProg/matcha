import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { WebSocketProvider } from './context/WebSocketContext.tsx'
import { ChatsProvider } from './context/ChatsContext.tsx'
import { ChatProvider } from './context/ChatContext.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<UserProvider>
			<WebSocketProvider>
				<ChatsProvider>
					<ChatProvider>
						<App />
					</ChatProvider>
				</ChatsProvider>
			</WebSocketProvider>
		</UserProvider>
	</StrictMode>,
)
