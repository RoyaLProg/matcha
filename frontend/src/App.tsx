import './App.css'
import { BrowserRouter as Router } from "react-router-dom"
import MatchaRoutes from "./routes/MatchaRoutes"

function App() {

  return (
    <>
		<Router>
			<MatchaRoutes />
		</Router>
    </>
  )
}

export default App
