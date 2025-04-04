import { useContext, useRef, useState, useEffect } from "react";
import "./Chat.css"
import { Link, useParams } from "react-router-dom";
import { ChatsContext } from "../../context/ChatsContext";
import { UserContext } from "../../context/UserContext";
import { MessageType } from "../../interface/message.interface";
import { WebSocketContext } from "../../context/WebSocketContext";


function Chat() {
	const [isRecordingAudio, setIsRecordingAudio] = useState(false);
	const [isRecordingVideo, setIsRecordingVideo] = useState(false);
	const [previewAudio, setPreviewAudio] = useState(null);
	const [previewAudioFile, setPreviewAudioFile] = useState<File | null>(null);
	const [previewVideo, setPreviewVideo] = useState(null);
	const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
	const [stream, setStream] = useState(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const videoRef = useRef(null);

	const { chats, sendMessage, sendMediaMessage } = useContext(ChatsContext) ?? {};
	const { user } = useContext(UserContext) ?? {};
	const { id } = useParams();
	const currentChat = chats?.find((chat) => chat.id === Number(id));
	const socket = useContext(WebSocketContext);
	const [messageText, setMessageText] = useState("");
	const prevRoomRef = useRef(null);

	useEffect(() => {
		if (!socket || !id) return;
		const room = `chat_${id}`;

		if (prevRoomRef.current) {
			socket.emit("LeaveRoom", prevRoomRef.current);
		}
		socket.emit("JoinRoom", room);
		prevRoomRef.current = room;
		return () => {
			socket.emit("LeaveRoom", room);
		};
	}, [socket, id]);
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
				setPreviewAudioFile(new File([audioBlob], "audioMessage.webm", { type: "audio/webm" }));
				setPreviewAudio(URL.createObjectURL(audioBlob));
				setIsRecordingAudio(false);
				stream?.getTracks().forEach(track => track.stop());
			};
		}
	};

	const cancelAudio = () => {
		setPreviewAudio(null);
	};

	const sendAudio = () => {
		if (!currentChat || !previewAudioFile) return;
		sendMediaMessage(currentChat.id, previewAudioFile, "audio");
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
				setPreviewVideoFile(new File([videoBlob], "videoMessage.webm", { type: "video/webm" }));
				setPreviewVideo(URL.createObjectURL(videoBlob));
				setIsRecordingVideo(false);
				stream?.getTracks().forEach(track => track.stop());
			};
		}
	};

	const cancelVideo = () => {
		setPreviewVideo(null);
	};

	const sendVideo = () => {
		if (!currentChat || !previewVideoFile) return;
		sendMediaMessage(currentChat.id, previewVideoFile, "video");
		setPreviewVideo(null);
	};

	const sendNewMessage = () => {

		if (!messageText.trim() || !sendMessage || !currentChat || !user) return;

		const newMessage: Message = {
			chatId: currentChat.id,
			userId: user.id,
			type: MessageType.Text,
			content: messageText,
			fileUrl: null,
			createdAt: new Date(),
		};
		sendMessage(newMessage);
		setMessageText("");
	};

	return (
		<div className="chat">
			<div className="content">
				<div className="chatHeader">
					<div className="chatPicture">
						<Link to={`/user/${currentChat?.user.id}`}><img src={`${import.meta.env.VITE_API_URL}/api${currentChat?.user.settings?.pictures?.find((v) => v.isProfile)?.url}` || "https://www.w3schools.com/w3images/avatar2.png"} alt="profile" /></Link>
					</div>
					<div className="chatProfile">
						<div className="name">
							<span>
								{currentChat
								? (currentChat.user.id !== user.id
										? currentChat.user.firstName
										: currentChat.targetUser.firstName)
								: "Utilisateur inconnu"}
							</span>
						</div>
						<p className="username">{currentChat
							? (currentChat.user.id !== user.id
								? `@${currentChat.user.username}`
								: `@${currentChat.targetUser.username}`)
							: "@unknown"}
						</p>
					</div>
					<div className="chatBack">
						<Link to={"/chatlist"}><button><span className="material-symbols-outlined">arrow_back</span></button></Link>
					</div>
				</div>

				<div className="chatContent">
					<div className="chatMessage">
					{currentChat?.messages?.map((message, index) => (
						<div key={index} className={`message ${message.userId === user?.id ? "myMessage" : "yourMessage"}`}>
							{/* 📝 Texte */}
							{message.type === MessageType.Text && <p>{message.content}</p>}

							{/* 🎙 Audio */}
							{message.type === MessageType.Audio && message.fileUrl && (
								<audio controls>
									<source src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`} type="audio/webm" />
								</audio>
							)}

							{/* 🎥 Vidéo */}
							{message.type === MessageType.Video && message.fileUrl && (
								<video controls width="200">
									<source src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`} type="video/webm" />
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
