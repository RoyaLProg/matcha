import { Routes, Route } from "react-router-dom";
import Register from "./register/Register";
import Chat from "./chat/Chat";
import Login from "./login/Login";
import ChatsList from "./chat/ChatsList";
import Verify from "./verify/Verify";
import Forgot from "./forgot/forgot";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import FirstConnection from "./firstconnect/FirstConnection";
import Profile from "./profil/Profile";
import HomeDefault, { Home } from "./home/Home";

export function MatchaRoutes() {
	const user = useContext(UserContext);
	if (!user?.user?.settings)
		return (
			<Routes>
				<Route path="/" element={<FirstConnection />} />
			</Routes>
			)
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/chatlist" element={<ChatsList />} />
			<Route path="/chat" element={<Chat />} />
			<Route path="/verify/:token" element={<Verify />} />
			<Route path="/profile" element={<Profile />} />
		</Routes>
	)
}

export function MatchaRoutesDefault() {
	return (
	<Routes>
		<Route path="/" element={<HomeDefault />} />
		<Route path="/register" element={<Register />} />
		<Route path="/login" element={<Login />} />
		<Route path="/verify/:token" element={<Verify />} />
		<Route path="/forgot" element={<Forgot />} />
		<Route path="/forgot/:token" element={<Forgot />} />
	</Routes>
	);
}

