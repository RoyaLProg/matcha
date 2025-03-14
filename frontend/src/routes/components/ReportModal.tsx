import "./ReportModal.css"
import { useState } from "react";

export default function ReportModal({state, onClose, id}: {state: boolean, onClose: () => void, id: number}) {

	const [selected, setSelected] = useState<string>();
	const [moreInfo, setMoreInfo] = useState<string>();

	function handleClick() {
		if (!selected || !setSelected) return ;

		fetch(`${import.meta.env.VITE_API_URL}/api/report/${id}`, 
			{
			  body: JSON.stringify({type: selected, moreInfo: moreInfo}),
			  credentials: 'include',
			  method: "POST",
			  headers: {"Content-Type": "application/json"}
		})
		.then(() => onClose());
	}

	return (
		<div id="ReportModal" aria-hidden={!state}>
			<div id="ReportModalContent">
				<h1 style={{justifySelf: "start"}}>REPORT</h1>
				<div id="reasons">
					<label className="reportCheckbox">
						<input type="checkbox" onClick={() => setSelected("bully")} checked={selected === "bully"}/>
						bully
					</label>
					<label className="reportCheckbox">
						<input type="checkbox" onClick={() => setSelected("fake")} checked={selected === "fake"}/>
						fake person
					</label>
					<label className="reportCheckbox">
						<input type="checkbox" onClick={() => setSelected("offensive")} checked={selected === "offensive"}/>
						offensive
					</label>
				</div>
				<div>
					<label>
						More Info:
						<textarea onChange={(e) => setMoreInfo(e.target.value)}/>
					</label>
				</div>
				<div style={{display: 'flex', placeContent: "space-around", width: "100%"}}>
					<button onClick={handleClick} className="ReportExit">send</button>
					<button onClick={onClose} className="ReportExit">exit</button>
				</div>
			</div>
		</div>
	);
}
