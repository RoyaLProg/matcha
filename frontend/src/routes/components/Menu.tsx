import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import Picture from "../../interface/picture.interface";
import "./Menu.css";
import { WebSocketContext } from "../../context/WebSocketContext";

function Menu() {

	const context = useContext(UserContext);
	const socket = useContext(WebSocketContext);
	const [count, setCount] = useState<number>(0);
	const [countchat, setCountChat] = useState<number>(0);
	const user = context?.user;
	const [hidden, setHidden] = useState<boolean>(true);

	function sortImage(a: Picture, b: Picture)
	{
		if (a.isProfile)
			return -1;
		else if (b.isProfile)
			return 1;
		return 0;
	}

	function toggleHidden() {
		setHidden(!hidden);
	}

	useEffect(() => {
		if (!user) return;
		fetch(`${import.meta.env.VITE_API_URL}/api/history/count/`,
			{
				credentials: 'include',
				method: "GET",
				headers: {"Content-Type": "application/json"}
			}
		).then(r => {
			if (r.ok) {
				r.json().then((data) => {
					setCount(data);
				});
			}
		});
	}, []);

	useEffect(() => {
		if (!socket) return;
		socket.on("notificationCount", (count: number) => {
			setCount(count);
		});
		socket.on("chat1", () => {
			setCountChat(countchat + 1);
		});
		return () => {
			socket.off("notificationCount");
		}
	}, [socket]);

	const disconnect = () => {
		if (!user) return;
		socket?.disconnect();
		document.cookie = "Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		context.setUser(undefined);
	};

	return (
		<div id="menu">
			<div id="logoMenu">
				<Link to="/"><span className="logo"></span></Link>
			</div>
			<div className="myProfile">
				<div id="notification-container">
					{count > 0 && <span id="notificationBadge">{count}</span>}
					<img id="profilePicture" src={`${import.meta.env.VITE_API_URL}${user?.settings?.pictures.sort(sortImage)[0].url}`} alt="profile" onClick={toggleHidden} height="100%" width="100%"/>
				</div>
				<div aria-hidden={hidden} id="profileMenu">
					<Link onClick={toggleHidden} to="/profile"> Profile </Link>
					<Link onClick={() => { toggleHidden(); setCount(0); }}  to="/history"> History </Link>
					<Link onClick={toggleHidden} to="/settings"> Settings </Link>
					<Link onClick={() => {toggleHidden(); disconnect();}} to="/"> deconnection </Link>
				</div>
				<div id="notification-container">
					{countchat > 0 && <span id="notificationBadge">{countchat}</span>}

					<Link onClick={() => { setCountChat(0); }} to={"/chatlist"}><button className="chatButton"> <span className="material-symbols-outlined">chat</span> </button></Link>
				</div>
			</div>
		</div>
	)
}

export default Menu
