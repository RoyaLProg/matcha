import IHistory from "../../interface/history.interface";
import './HistoryItem.css'

export default function HistoryItem({history, setHistory}: {history: IHistory, setHistory: (h:IHistory) => void}) {

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

	return (
		<div
			className="HistoryItem"
			aria-disabled={history.isReaded ? "true" : "false"}
			onClick={onClick}
		>
			<p className="HistoryMessage">{history.message}</p>
			<p className="HistoryDate">{new Date(history.createdAt ?? "").toDateString()}</p>
		</div>
	);
}
