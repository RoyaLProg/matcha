import IHistory from "../../interface/history.interface";
import './HistoryItem.css'
import { useState, useEffect } from "react";

export default function HistoryItem({history, setHistory}: {history: IHistory, setHistory: (h:IHistory) => void}) {

	const [message, setMessage] = useState<any>();

	function onClick() {
		fetch(`${import.meta.env.VITE_API_URL}/api/history/setAsRead/${history.id}`,
			  {
				  credentials: 'include',
				  method: "POST",
				  headers: {"Content-Type": "application/json"}
			  }
		 ).then(r => {
			   if (r.ok){ 
				   history.isReaded = true;
				   setHistory({...history});
			   }
		});
	}

	// function format(username: string){
	// 	return ( <a href={`/user/${history.fromId}`}>{username}</a>
	// }
	
	// HACK: clearly sucks but works for now...
	useEffect(() => {
		fetch(`${import.meta.env.VITE_API_URL}/api/users/${history.fromId}/username`,
			  {
				credentials: 'include'
			  }
		)
		.then(r => {return r.text()})
		.then((d) => {
			const message = <p className="HistoryMessage">{history.message.substring(0, history.message.search("%user%"))} <a href={`/user/${history.fromId}`}>@{d}</a> {history.message.substring(history.message.search("%user%") + 6)}</p>;
			setMessage(message);
		});
	}, []);

	return (
		<div
			className="HistoryItem"
			aria-disabled={history.isReaded ? "true" : "false"}
			onClick={onClick}
		>
			{message}
			<p className="HistoryDate">{new Date(history.createdAt ?? "").toDateString()}</p>
		</div>
	);
}
