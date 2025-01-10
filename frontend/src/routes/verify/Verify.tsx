import { useParams, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';

export default function Verify() {
	let { token } = useParams();
	const [success, setSuccess] = useState<string | undefined>();
	const [error, setError] = useState<string | undefined>();
	
	if (!token)
		return <Navigate to="/" />

	fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify/${token}`, {
			method: "DELETE"
	}).then(value => {
		if (value.ok)
			value.text().then( json => setSuccess(json) );
		else
			value.json().then( json => setError(json["message"]) );
	}).catch( (e) => console.log(e) );

	return (
		<>
			{ success ? 
				<div id="success">
					<p>{success}</p>
				</div>
			  : ""
			}
			{ error ? 
				<div id="error">
					<p>{error}</p>
				</div>
			  : ""
			}
			<Link to="/">Return to home page</Link>
		</>
	);
}
