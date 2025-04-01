import Users from "../../interface/users.interface";
import Carrousel from "../components/Carrousel";
import { useParams, Link } from "react-router-dom";
import Picture from "../../interface/picture.interface";
import { useEffect, useState } from "react";
import './User.css'
import ReportModal from "../components/ReportModal";

export default function User() {
	const { id } = useParams();
	const [user, setUser] = useState<Users>();
	const [show, setShow] = useState<boolean>(false);

	function sortImage(a: Picture, b: Picture)
	{
		if (a.isProfile)
			return -1;
		else if (b.isProfile)
			return 1;
		return 0;
	}

	// HACK: works fine to me
	const willLitteralyNeverChange = '';

	function getAge(value: string) {
		let x = new Date(new Date().getTime() - new Date(value).getTime()).getTime() / (31556952000); // time in a year
		return Math.floor(x);
	}

	useEffect(() => {
		fetch(`${import.meta.env.VITE_API_URL}/api/Users/${id}`, {credentials: 'include'})
		.then((r) => {
			if (!r.ok)
				return ;
			return r.json()
		})
		.then((d) => setUser(d as Users)); 
	}, [willLitteralyNeverChange]);

	if (!user)
		return (<p style={{margin: "auto"}}>this user does not exist</p>);

	return (
		<div id="userProfile">
			<div className="content">
				<div className="card">
					<Carrousel pictures={user?.settings?.pictures.sort(sortImage) || []} />
					<div className="yourProfile">
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
				<button onClick={() => setShow(true)}>Report</button>
			</div>
			<ReportModal state={show} onClose={() => setShow(false)} id={(id ?? -1) as number}/>
		</div>
	)
}
