import { useContext } from "react";
import "./Chat.css"
import { Link } from "react-router-dom";
import { ChatsContext } from "../../context/ChatsContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { UserContext } from "../../context/UserContext";

function ChatsList() {
	const user = useContext(UserContext);
	const chats = useContext(ChatsContext);
	const socket = useContext(WebSocketContext);

	if (!socket || !chats)
		return <div>Loading...</div>;
	if (!chats.chats || chats.chats.length === 0)
		return <div style={{margin: "auto"}}>No chats found</div>;
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
			{chats.chats.map((chat) => {
					const otherUser = chat.user.id === user?.user?.id ? chat.targetUser : chat.user;
					const otherPictureProfile = otherUser.settings?.pictures?.find((picture) => picture.isProfile);
					return (
						<div className="yourProfileInfo" key={chat.id}>
							<div className="chatListPicture">
								<Link to={`/profile?username=${otherUser.username}`}>
									<img src={otherPictureProfile?.url || "https://www.w3schools.com/w3images/avatar2.png"} alt="profile" />
								</Link>
							</div>
							<div className="chatListProfile">
								<div className="name">
									<span>{otherUser.firstName || "Unknown"}</span>
								</div>
								<p className="username">@{otherUser.username}</p>
								<p className="lastMessage">
									Last message: {chat.messages?.length ? chat.messages[chat.messages.length - 1].content : "No messages yet"}
								</p>
							</div>
							<div className="chatButton">
								<Link to={`/chat/${chat.id}`}>
									<button>
										<span className="material-symbols-outlined">chat</span>
									</button>
								</Link>
							</div>
						</div>
					);
				})}

			</div>
		</div>
	);
}

export default ChatsList;
