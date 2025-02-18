import { Link } from "react-router-dom"
import "./Home.css"
import Carrousel from "../components/carrousel";


export function Home() {

	return (
		<div className="home alignement">
			<div className="menu">
				<div className="logoMenu">
					<span className="logo"></span>
				</div>
				<div className="myProfile">
					<img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" />
					<Link to={"/chatlist"}><button className="chatButton"> <span className="material-symbols-outlined">chat</span> </button></Link>
				</div>
			</div>
			<div id="container">
				<button className="dislikeButton"> <span className="material-symbols-outlined">thumb_down</span> </button>
				<div className="content">
					<div className="card">
					<Carrousel pictures={[{url: "https://www.w3schools.com/w3images/avatar2.png"}]} />
					<div className="yourProfile">
							<p style={{fontSize: "32px"}}>Name, Age ans</p>
							<p style={{fontSize: "20px", color: "#aaa"}}>Pays, Ville (distance)</p>
							<p style={{fontSize: "15px", textAlign: "justify"}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ac consequat magna. Nunc lorem ligula, placerat sed molestie sed, faucibus ut magna. Aenean vitae auctor quam. Vivamus in tempor eros. Nunc metus felis, malesuada vitae lorem eu, finibus rutrum nibh. Proin ipsum lectus, accumsan eu lectus auctor, vulputate imperdiet nunc. Morbi viverra, quam at pulvinar eleifend, magna arcu condimentum justo, in condimentum felis dolor vitae diam. Morbi sed gravida sapien, sit amet porttitor nulla. Mauris et ullamcorper lorem. Sed ligula arcu, volutpat ac ex vel, semper tempus lacus. </p>
						</div>
					</div>
				</div>
				<button className="likeButton"> <span className="material-symbols-outlined">thumb_up</span> </button>
			</div>
		</div>
	);
}

export default function HomeDefault() {
	return (
		<div className="home">
			<div className="homeLogoDefault">
				<span className="logo"></span>
			</div>
			<p>welcome to 42love</p>
			<div className="homeButtons">
				<Link to={"/login"}><button className="loginButton"> Login </button></Link>
				<Link to={"/register"}><button className="registerButton"> Register </button></Link>
			</div>
		</div>
	);
}
