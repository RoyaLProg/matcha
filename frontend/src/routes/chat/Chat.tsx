import { useContext, useRef, useState } from "react";
import "./Chat.css"
import { Link, useParams } from "react-router-dom";
import { ChatsContext } from "../../context/ChatsContext";
import { UserContext } from "../../context/UserContext";
import { MessageType } from "../../interface/message.interface";


function Chat() {
	const [messages, setMessages] = useState([
		{ type: "text", content: "Hi there!", sender: "other" },
		{ type: "text", content: "How are you?", sender: "me" },
	]);
	const [isRecordingAudio, setIsRecordingAudio] = useState(false);
	const [isRecordingVideo, setIsRecordingVideo] = useState(false);
	const [previewAudio, setPreviewAudio] = useState(null);
	const [previewVideo, setPreviewVideo] = useState(null);
	const [stream, setStream] = useState(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const videoRef = useRef(null);

	const { chats, sendMessage } = useContext(ChatsContext) ?? {};
const { user } = useContext(UserContext) ?? {};
const { id } = useParams();
const currentChat = chats?.find((chat) => chat.id === Number(id));

const [messageText, setMessageText] = useState("");


	// audio
	const startRecordingAudio = async () => {
		try {
			const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(audioStream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];
			setStream(audioStream);
			setPreviewAudio("recording");
			setIsRecordingAudio(true);

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			mediaRecorder.start();
		} catch (error) {
			console.error("Erreur d'enregistrement audio :", error);
		}
	}

	const stopRecordingAudio = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			mediaRecorderRef.current.onstop = () => {
				const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
				const audioURL = URL.createObjectURL(audioBlob);
				setPreviewAudio(audioURL);
				setIsRecordingAudio(false);
			};
			stream?.getTracks().forEach(track => track.stop());
		}
	}

	const cancelAudio = () => {
		setPreviewAudio(null);
	};

	const sendAudio = () => {
		setMessages(prev => [...prev, { type: "audio", content: previewAudio, sender: "me" }]);
		setPreviewAudio(null);
	};

	// video
	const startRecordingVideo = async () => {
		try {
			const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			setStream(videoStream);
			const mediaRecorder = new MediaRecorder(videoStream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];
			setPreviewVideo("recording");
			setIsRecordingVideo(true);

			if (videoRef.current) {
				videoRef.current.srcObject = videoStream;
			}

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			mediaRecorder.start();
		} catch (error) {
			console.error("Erreur d'enregistrement vidéo :", error);
		}
	}

	const stopRecordingVideo = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			mediaRecorderRef.current.onstop = () => {
				const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
				const videoURL = URL.createObjectURL(videoBlob);
				setPreviewVideo(videoURL);
				setIsRecordingVideo(false);
				stream?.getTracks().forEach(track => track.stop());
			};
		}
	}

	const cancelVideo = () => {
		setPreviewVideo(null);
	};

	const sendVideo = () => {
		setMessages(prev => [...prev, { type: "video", content: previewVideo, sender: "me" }]);
		setPreviewVideo(null);
	};

	const sendNewMessage = () => {
		console.log("DEBUG | Message:", messageText);
console.log("DEBUG | User:", user);
console.log("DEBUG | Current Chat:", currentChat);

		if (!messageText.trim() || !sendMessage || !currentChat || !user) return;

		const newMessage: Message = {
			chatId: currentChat.id,
			userId: user.id,
			// sender: user,
			type: MessageType.Text,
			content: messageText,
			fileUrl: null,
			createdAt: new Date(),
		};

		sendMessage(newMessage);

		// ✅ Ajouter le message immédiatement dans le chat
		currentChat.messages = [...(currentChat.messages ?? []), newMessage];

		setMessageText(""); // Réinitialise l'input après envoi
	};


	return (
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
						{messages.map((message, index) => (
							<div key={index} className={`message ${message.sender === "me" ? "myMessage" : "yourMessage"}`}>
								{message.type === "text" && <p>{message.content}</p>}
								{message.type === "audio" && (
									<audio controls>
										<source src={message.content} type="audio/webm" />
									</audio>
								)}
								{message.type === "video" && (
									<video controls width="200">
										<source src={message.content} type="video/webm" />
									</video>
								)}
							</div>
						))}
					</div>
				</div>
				{previewAudio && (
					<div className="preview-container">
						{previewAudio === "recording" ? (
							<p>🎙 Enregistrement en cours...</p>
						) : (
							<audio controls>
								<source src={previewAudio} type="audio/webm" />
							</audio>
						)}
						<button onClick={cancelAudio}>❌ Annuler</button>
						{previewAudio !== "recording" && <button onClick={sendAudio}>✅ Envoyer</button>}
					</div>
				)}

				{previewVideo && (
					<div className="preview-container">
						{previewVideo === "recording" ? (
							<p>🎥 Enregistrement en cours...</p>
						) : (
							<video controls width="200">
								<source src={previewVideo} type="video/webm" />
							</video>
						)}
						<button onClick={cancelVideo}>❌ Annuler</button>
						{previewVideo !== "recording" && <button onClick={sendVideo}>✅ Envoyer</button>}
					</div>
				)}
				<div className="chatInput">
					{isRecordingAudio ? (
						<button className="stopButton" onClick={stopRecordingAudio}>
							<span className="material-symbols-outlined">stop</span>
						</button>
					) : (
						<button className="microButton" onClick={startRecordingAudio}>
							<span className="material-symbols-outlined">mic</span>
						</button>
					)}

					{isRecordingVideo ? (
						<button className="stopButton" onClick={stopRecordingVideo}>
							<span className="material-symbols-outlined">stop</span>
						</button>
					) : (
						<button className="videoButton" onClick={startRecordingVideo}>
							<span className="material-symbols-outlined">videocam</span>
						</button>
					)}

					<button className="addButton">
						<span className="material-symbols-outlined">add</span>
					</button>
					<input type="text" placeholder="Type a message" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
					<button className="sendButton" onClick={sendNewMessage}>
						<span className="material-symbols-outlined">send</span>
					</button>
				</div>
			</div>
		</div>
	);
}

export default Chat;
