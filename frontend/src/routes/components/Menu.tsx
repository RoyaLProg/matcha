import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import Picture from "../../interface/picture.interface";
import "./Menu.css";

function Menu() {
	
	const context = useContext(UserContext);
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

	return (
		<div id="menu">
			<div id="logoMenu">
				<Link to="/"><span className="logo"></span></Link>
			</div>
			<div className="myProfile">
				<img id="profilePicture" src={`${import.meta.env.VITE_API_URL}${user?.settings?.pictures.sort(sortImage)[0].url}`} alt="profile" onClick={toggleHidden} />
				<div aria-hidden={hidden} id="profileMenu">
					<Link onClick={toggleHidden} to="/profile"> Profile </Link>
					<Link onClick={toggleHidden} to="/profile/history"> History </Link>
					<Link onClick={toggleHidden} to="/profile/settings"> Settings </Link>
				</div>
				<Link to={"/chatlist"}><button className="chatButton"> <span className="material-symbols-outlined">chat</span> </button></Link>
			</div>
		</div>
	)
}

export default Menu
