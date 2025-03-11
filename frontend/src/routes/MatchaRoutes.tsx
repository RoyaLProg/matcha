import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./register/Register";
import Chat from "./chat/Chat";
import Login from "./login/Login";
import ChatsList from "./chat/ChatsList";
import Verify from "./verify/Verify";
import Forgot from "./forgot/forgot";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import FirstConnection from "./firstconnect/FirstConnection";
import Profile from "./profile/Profile";
import HomeDefault, { Home } from "./home/Home";
import Settings from "./settings/Settings";
import History from "./history/History";

export function MatchaRoutes() {
	const user = useContext(UserContext);
	if (!user?.user?.settings)
		return (
			<Routes>
				<Route path="/" element={<FirstConnection />} />
				<Route path="*" element={<Navigate to={'/'}/>} />
			</Routes>
			)
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/chatlist" element={<ChatsList />} />
			<Route path="/chat/:id" element={<Chat />} />
			<Route path="/verify/:token" element={<Verify />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/settings" element={<Settings />} />
			<Route path="/history" element={<History />} />
			<Route path="*" element={<Navigate to={'/'}/>} />
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

