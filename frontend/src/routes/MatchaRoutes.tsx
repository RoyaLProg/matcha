import { Routes, Route } from "react-router-dom";
import { Home, HomeDefault } from "./home/Home";
import Register from "./register/Register";
import Chat from "./chat/Chat";
import Login from "./login/Login";
import ChatsList from "./chat/ChatsList";

function MatchaRoutes() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/chatlist" element={<ChatsList />} />
			<Route path="/chat" element={<Chat />} />
		</Routes>
	)
}

function MatchaRoutesDefault() {
	return (
	<Routes>
		<Route path="/" element={<HomeDefault />} />
		<Route path="/register" element={<Register />} />
		<Route path="/login" element={<Login />} />
	</Routes>
	);
}

export { MatchaRoutes, MatchaRoutesDefault };