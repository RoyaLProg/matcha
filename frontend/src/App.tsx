import './App.css'
import { BrowserRouter as Router } from "react-router-dom"
import { MatchaRoutesDefault, MatchaRoutes } from "./routes/MatchaRoutes"
import { UserContext } from './context/UserContext';
import { useContext } from 'react';

function App() {
	// const user = useContext(UserContext);
	// if (!user)
	// 	return (
	// 		<Router>
	// 			<MatchaRoutesDefault />
	// 		</Router>
	// 	)
	return (
		<Router>
			<MatchaRoutes />
		</Router>
	)
}

export default App
