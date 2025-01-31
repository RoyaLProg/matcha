import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import "./Verify.css"

export default function Verify() {
	let { token } = useParams();
	const [error, setError] = useState<string | undefined>();
	const [success, setSuccess] = useState<string | undefined>();
	const navigate = useNavigate();
	if (!token)
		return <Navigate to="/" />

	useEffect(() => {
		setSuccess(undefined);
		setError(undefined);
		fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify/${token}`, {
				method: "DELETE"
		}).then((rv) => {
			if (!rv.ok) {
				rv.json().then((value) => {
					setError(value['message']);
					new Promise(resolve => setTimeout(resolve, 5000)).then( () => navigate('/') );
				})
			} else {
				rv.json().then((value) => {
					setSuccess(value.message)
					new Promise(resolve => setTimeout(resolve, 5000)).then( () => navigate('/') ); 
				});
			}
		}).catch((e) => console.error('Fetch error:', e));
	})
	return (
		<div id="verify">
			{ error ? 
				<div id="error">
					<p>{error}</p>
				</div>
			  : ""
			}
			{ success ? 
				<div id="success">
					<p>{success}</p>
				</div>
			  : ""
			}
			<Link to="/">Return to home page</Link>
			<p>you will be redirected in 5 secondes</p>
		</div>
	);
}
