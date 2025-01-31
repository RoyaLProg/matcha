import "./Chat.css"
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
	<div className="chat">
		<div className="menu">
			<Link to={"/"}>
				<div className="logoMenu">
					<span className="logo"></span>
				</div>
			</Link>
			<div className="myProfile">
				<Link to={"/profile"}><button><img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /></button></Link>
			</div>
		</div>
		<div className="content">
			<div className="chatHeader">
				<div className="chatPicture">
					<Link to={"/profile"}><img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" /></Link>
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
				<div className="chatMessage">
					<div className="message yourMessage">
						<p>Hi there!</p>
					</div>
					<div className="message myMessage">
						<p>How are you?</p>
					</div>
					<div className="message yourMessage">
						<p>Are you free tonight?</p>
					</div>
					<div className="message myMessage">
						<p>Yes, let’s meet!</p>
					</div>
					<div className="message myMessage voiceMessage">
						<span className="material-symbols-outlined">mic</span>
						<p>Voice message</p>
					</div>
					<div className="message yourMessage videoMessage">
						<span className="material-symbols-outlined">videocam</span>
						<p>Video message</p>
					</div>
				</div>
			</div>
			<div className="chatInput">
				<button className="microButton"><span className="material-symbols-outlined">mic</span></button>
				<button className="videoButton"><span className="material-symbols-outlined">videocam</span></button>
				<button className="addButton"><span className="material-symbols-outlined">add</span></button>
				<input type="text" placeholder="Type a message" />
				<button className="sendButton"><span className="material-symbols-outlined">send</span></button>
			</div>
		</div>
	</div>

	)

}

export default Chat;
