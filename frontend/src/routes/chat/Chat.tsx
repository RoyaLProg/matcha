import { useContext } from "react";
import { WebSocketContext } from "../../context/WebSocketContext";


function Chat() {
	const socket  = useContext(WebSocketContext);
	
	return (
		<>
			{socket ?(
				<div className="chat">

				</div>) :
				(<div>Connecting...</div>)}
		</>

	)

}

export default Chat;