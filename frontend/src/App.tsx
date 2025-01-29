import './App.css'
import { BrowserRouter as Router } from "react-router-dom"
import { MatchaRoutesDefault, MatchaRoutes } from "./routes/MatchaRoutes"
import { UserContext } from './context/UserContext';
import { useContext } from 'react';
import { WebSocketContext } from './context/WebSocketContext';

function App() {
	const context = useContext(UserContext);
	const socket = useContext(WebSocketContext);
	if (socket == undefined)
		return (
			<>
				<div>Connecting...</div>
			</>
		)
	if (!context?.user)
		return (
		 	<Router>
		 		<MatchaRoutesDefault />
		 	</Router>
		)
	return (
		<Router>
			<MatchaRoutes />
		</Router>
	)
}

export default App
