import { useState } from "react";

export default function Forgot() {
	
	const [message, setMessage] = useState<string | undefined>();	
	const [username, setUsername] = useState<string>('');
	
	async function onSubmit() {
		setMessage('');
		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},	
			body: JSON.stringify({username: username})}
		);
		if (response.ok)
			setMessage((await response.text()));
		else
			setMessage((await response.json())['message']);
	}

	return (
		<div style={{flexDirection: "column"}}>
			<h1> MATCHA LOGO HERE </h1>
			<h3> Forgot your password ? </h3>
			{ message ? 
				<p> {message} </p>
			:
				''
			}
			<label>
				Username :
				<input defaultValue={username} onChange={(e) => setUsername(e.target.value)}/>
			</label>
			<button onClick={() => onSubmit()}>Send Email</button>
		</div>
	);

}
