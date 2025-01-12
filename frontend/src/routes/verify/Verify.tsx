import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { notificationFunctions, NotificationType } from '../../context/WebSocketContext';

export default function Verify() {
	let { token } = useParams();
	const [error, setError] = useState<string | undefined>();
	const navigate = useNavigate();
	if (!token)
		return <Navigate to="/" />

	fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify/${token}`, {
			method: "DELETE"
	}).then((rv) => {
		if (!rv.ok) {
			rv.json().then((value) => setError(value['message']));
		} else {
			rv.json().then((value) => {
				notificationFunctions[NotificationType.Success](value.message);
				navigate('/login');
			});
		}
	}).catch((e) => console.error('Fetch error:', e));

	return (
		<>
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
