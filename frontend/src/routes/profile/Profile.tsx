import { useContext } from "react";
import "./Profile.css"
import { Link } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import Carrousel from "../components/Carrousel";
import Picture from "../../interface/picture.interface";

export default function Profile() {

	const { user } = {...useContext(UserContext)};

	function getAge(value: string) {
		let x = new Date(new Date().getTime() - new Date(value).getTime()).getTime() / (31556952000); // time in a year
		return Math.floor(x);
	}

	function sortImage(a: Picture, b: Picture)
	{
		if (a.isProfile)
			return -1;
		else if (b.isProfile)
			return 1;
		return 0;
	}

	return (
		<div id="profile">
			<div className="content">
				<div className="card">
					<div className="carousel-wrapper">
						<Carrousel pictures={user?.settings?.pictures.sort(sortImage) || []} />
						<span className={`status-bubble ${user?.status === "online" ? "online" : "offline"}`}></span>
					</div>

					<div className="yourProfile">
						{user?.status === "offline" && user?.lastconnection && (
							<p style={{fontSize: "13px", color: "#888"}}>
								Last connection: {new Date(user.lastconnection).toLocaleString()}
							</p>
						)}

						<div style={{fontSize: "32px", display: "flex", justifyContent: "space-between", width: "100%"}}>
							<p>
								{user?.firstName},
								{getAge(user?.birthDate ?? "")} y/o
							</p>
							<div id="fameRating">
								<p>{user?.fameRating ?? 0}</p>
								<span className="material-symbols-outlined">local_fire_department</span>
							</div>
						</div>
						<p style={{fontSize: "20px", color: "#aaa"}}>{user?.settings?.country}, {user?.settings?.city}</p>
						<p style={{fontSize: "15px", textAlign: "justify", textWrap: "wrap"}}>{user?.settings?.biography}</p>
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
