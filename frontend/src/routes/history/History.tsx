import { useEffect, useState } from "react";
import IHistory from "../../interface/history.interface";
import HistoryItem from "../components/HistoryItem";

export default function History() {
	const [history, setHistory] = useState<IHistory[]>([]);
	
	useEffect(() => {
		fetch(`${import.meta.env.VITE_API_URL}/api/history`,
			  {
				  credentials: 'include',
			  }
			 ).then(
			(res) => {
				if (res.ok) {
					res.json().then((data: IHistory[]) => setHistory(data));
				}
		});
	}, []);

	return	(
			history.length ?
				history.map((h) => <HistoryItem history={h} key={h.id}/>)
			:
				<p> no history </p>
	);

}
