import { Routes, Route } from "react-router-dom";
import Home from "./home/Home";
import Register from "./register/Register";

export default function MatchaRoutes() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/register" element={<Register />} />
		</Routes>
	)
}
