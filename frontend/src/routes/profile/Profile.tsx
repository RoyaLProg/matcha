import { useContext } from "react";
import "./Profile.css"
import { Link } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import Carrousel from "../components/Carrousel";

export default function Profile() {

	const { user } = {...useContext(UserContext)};

	function getAge(value: string) {	
		let x = new Date(new Date().getTime() - new Date(value).getTime()).getTime() / (31556952000); // time in a year
		return Math.floor(x);
	}

	return (
		<div id="profile">
			<div className="content">
				<div className="card">
					<Carrousel pictures={user?.settings?.pictures || []} />	
					<div className="yourProfile">
						<p style={{fontSize: "32px"}}>{user?.firstName}, {getAge(user?.birthDate ?? "")} y/o</p>
						<p style={{fontSize: "20px", color: "#aaa"}}>{user?.settings?.country}, {user?.settings?.city}</p>
						<p style={{fontSize: "15px", textAlign: "justify"}}>{user?.settings?.biography}</p>
					</div>
				</div>
			</div>
			<div id="nav">
				<Link to="/">Back</Link>
				<Link to="settings">Settings</Link>
			</div>
		</div>
	);
}
