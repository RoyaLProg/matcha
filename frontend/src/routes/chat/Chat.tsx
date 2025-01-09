import "./Chat.css"
import { useContext } from "react";
import { WebSocketContext } from "../../context/WebSocketContext";
import { Link } from "react-router-dom";


function Chat() {
	// const socket  = useContext(WebSocketContext);

	return (
		// <>
		// 	{socket ?(
		// 		<div className="chat">

		// 		</div>) :
		// 		(<div>Connecting...</div>)}
		// </>
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
				<div className="chatHeader">
					<div className="chatPicture">
						<Link to={"/profile"}><img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /> </Link>
					</div>
					<div className="chatProfile">
						<div className="name">
							<span>John Doe</span>
						</div>
						<p className="username">@johndoe</p>
					</div>
					<div className="chatBack">
						<Link to={"/chatlist"}><button><span className="material-symbols-outlined">arrow_back</span></button></Link>
					</div>
				</div>
				<div className="chatContent">

				</div>
			</div>
		</div>
	)

}

export default Chat;