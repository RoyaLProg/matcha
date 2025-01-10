import { useState } from "react";
import { useParams } from "react-router-dom";

export default function Forgot() {
	
	const { token } = useParams();
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

	if (token)
		return <ForgotWithToken token={token} />

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

export function ForgotWithToken({ token }: {token: string}) {
	
	const [password, setPassword] = useState<string>('');
	const [confirm, setConfirm] = useState<string>('');
	const [message, setMessage] = useState<string | undefined>();

	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);

		return (i1 && i2 && i3 && i4);
	}

	function validate(): boolean {
		if (!checkPassword(password)) {
			setMessage('password does not comply with requirements');
			return false;
		}

		if (password !== confirm) {
			setMessage('passwords don\'t match');
			return false
		}

		return true;
	}

	async function onSubmit() {
		setMessage('');

		if (!validate())
			return ;	

		let response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot/${token}`, {
			method: "PATCH",
			body: JSON.stringify({password: password}),
			headers: {"Content-Type": "application/json"}
		});

		if (response.ok)
			setMessage('ok');
		else
			setMessage((await response.json()).message);


	}

	return (
		<div style={{flexDirection: "column"}}>
			{ message ?
				<p> {message} </p>
			:
				''
			}
			<label>
				New Password :
				<input type="password" onChange={(e) => setPassword(e.target.value)}/>
			</label>
			<label>
				Confirm Password :
				<input type="password" onChange={(e) => setConfirm(e.target.value)}/>
			</label>
			<button onClick={() => onSubmit()}> Change Password </button>
		</div>
	);
}
