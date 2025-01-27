import { Link } from "react-router-dom"
import "./Home.css"


export function Home() {

	return (
		<div className="home alignement">
			<div className="menu">
				<div className="logoMenu">
					<span className="logo"></span>
				</div>
				<div className="myProfile">
					<img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" />
				</div>
			</div>
			<div className="content">
				<div className="yourListPicture">
					<span className="material-symbols-outlined">arrow_back_ios</span>
					<img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" />
					<span className="material-symbols-outlined">arrow_forward_ios</span>
				</div>
				<div className="yourProfile">
					<p> Localisation : </p>
					<p> Name : </p>
					<p> Age : </p>
					<p> Bio : </p>
					<p> Tags : </p>
				</div>
				<div className="Button">
					<button className="dislikeButton"> <span className="material-symbols-outlined">thumb_down</span> </button>
					<Link to={"/chatlist"}><button className="chatButton"> <span className="material-symbols-outlined">chat</span> </button></Link>
					<button className="likeButton"> <span className="material-symbols-outlined">thumb_up</span> </button>
				</div>
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
