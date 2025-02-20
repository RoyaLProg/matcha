import IHistory from "../../interface/history.interface";

export default function HistoryItem({history}: {history: IHistory}) {
	return (
		<div
			className="HistoryItem"
			aria-disabled={history.readed}
			onBlur={() => fetch(`${import.meta.env.VITE_API_URL}/api/history/setAsRead/${history.id}`, {credentials: 'include', method: "POST"})}
		>
			<p className="historyMessage">{history.message}</p>
			<p className="HistoryDate">{new Date(history.createdAt ?? "").toString()}</p>
		</div>
	);
}
