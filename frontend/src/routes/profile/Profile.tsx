import "./Profile.css"
import { Link } from "react-router-dom";

export default function Profile() {
	return (
		<div id="profile">
			<div className="content">
				<div className="card">
					<div className="yourListPicture">
						<span className="material-symbols-outlined">arrow_back_ios</span>
						<img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" />
						<span className="material-symbols-outlined">arrow_forward_ios</span>
					</div>
					<div className="yourProfile">
						<p style={{fontSize: "32px"}}>Name, Age ans</p>
						<p style={{fontSize: "20px", color: "#aaa"}}>Pays, Ville (distance)</p>
						<p style={{fontSize: "15px", textAlign: "justify"}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ac consequat magna. Nunc lorem ligula, placerat sed molestie sed, faucibus ut magna. Aenean vitae auctor quam. Vivamus in tempor eros. Nunc metus felis, malesuada vitae lorem eu, finibus rutrum nibh. Proin ipsum lectus, accumsan eu lectus auctor, vulputate imperdiet nunc. Morbi viverra, quam at pulvinar eleifend, magna arcu condimentum justo, in condimentum felis dolor vitae diam. Morbi sed gravida sapien, sit amet porttitor nulla. Mauris et ullamcorper lorem. Sed ligula arcu, volutpat ac ex vel, semper tempus lacus. </p>
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
