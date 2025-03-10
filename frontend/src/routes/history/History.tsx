import { useEffect, useState } from "react";
import IHistory from "../../interface/history.interface";
import HistoryItem from "../components/HistoryItem";
import './History.css'

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
					res.json().then((data: IHistory[]) => {
						setHistory(data);
						console.log(data);
					});
				}
		});
	}, []);

	return	(
		<div className="HistoryBox">
		{
			history.length ?
				history.map((h, i) => {
					const setHis = (his: IHistory) => {
						history[i] = his;
						setHistory([...history]);
					}

					return (<HistoryItem history={h} setHistory={setHis} key={h.id}/>);
				})
			:
				<p style={{margin: 'auto'}}> no history </p>
		}
		</div>
	);

}
