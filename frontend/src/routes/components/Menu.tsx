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
	const user = context?.user;
	const [hidden, setHidden] = useState<boolean>(true);

	function sortImage(a: Picture, b: Picture)
	{
		if (a.isProfile)
			return 1;
		else if (b.isProfile)
			return -1;
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
		return () => {
			socket.off("notificationCount");
		}
	}, [socket]);

	return (
		<div id="menu">
			<div id="logoMenu">
				<Link to="/"><span className="logo"></span></Link>
			</div>
			<div className="myProfile">
				<div id="notification-container">
					<span id="notificationBadge">{count}</span>
					<img id="profilePicture" src={`${import.meta.env.VITE_API_URL}${user?.settings?.pictures.sort(sortImage)[0].url}`} alt="profile" onClick={toggleHidden} />
				</div>
				<div aria-hidden={hidden} id="profileMenu">
					<Link onClick={toggleHidden} to="/profile"> Profile </Link>
					<Link onClick={() => { toggleHidden(); setCount(0); }}  to="/history"> History </Link>
					<Link onClick={toggleHidden} to="/profile/settings"> Settings </Link>
				</div>
				<Link to={"/chatlist"}><button className="chatButton"> <span className="material-symbols-outlined">chat</span> </button></Link>
			</div>
		</div>
	)
}

export default Menu
