import "./Chat.css"
import { Link } from "react-router-dom";

function ChatsList() {
	const name = "edouard";
	return (
		<div className="chatList">
			<div className="menu">
				<Link to={"/"}>
					<div className="logoMenu">
						<span className="logo"></span>
					</div>
				</Link>
				<div className="myProfile">
					<Link to={"/profile"}><button> <img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /></button></Link>
				</div>
			</div>
			<div className="content">
				<div className="yourProfileInfo">
					<div className="chatListPicture">
						<Link to={`/profile?username=${name}`}><img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /></Link>
					</div>
					<div className="chatListProfile">
						<div className="name">
							<span>John Doe</span>
						</div>
						<p className="username">@johndoe</p>
						<p className="lastMessage">Last message: Hi there!</p>
					</div>
					<div className="chatButton">
						<Link to={"/chat"}>
							<button><span className="material-symbols-outlined">chat</span></button>
						</Link>
					</div>
				</div>
				<div className="yourProfileInfo">
					<div className="chatListPicture">
						<Link to={`/profile?username=${name}`}><img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /></Link>
					</div>
					<div className="chatListProfile">
						<div className="name">
							<span>John Doe</span>
						</div>
						<p className="username">@johndoe</p>
						<p className="lastMessage">Last message: Hi there!</p>
					</div>
					<div className="chatButton">
						<Link to={"/chat"}>
							<button><span className="material-symbols-outlined">chat</span></button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ChatsList;