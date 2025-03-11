import "./Login.css";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { notificationFunctions, NotificationType } from "../../context/WebSocketContext";

interface IForm {
	username: string
	password: string
}

function Login() {
	const userContext = useContext(UserContext);
	const navigate = useNavigate();
	const [values, setValues] = useState<IForm>({username: '', password: ''});

	async function onSubmit() {
		const data = { username: values.username, password: values.password };

		await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
			.then((rv) => {
				if (!rv.ok) {
					rv.json().then((value) => notificationFunctions[NotificationType.Error](value['message']));
				} else {
					if (userContext && userContext.user === undefined) {
						notificationFunctions[NotificationType.Success]('Login successful');
						userContext.updateUserFromCookie();
						navigate('/');
					}
				}
			})
			.catch((e) => console.error('Fetch error:', e));
	}

	return (
	<div className="login">
		<div className="loginLogo">
			<span className="logo"></span>
		</div>
		<div className="loginForm">
			<div id="form">
				<label id="username">
					Username :
					<input type='text' onChange={(e) => setValues({...values, username: e.target.value})}/>
				</label>
				<label id="password">
					Password :
					<input type="password" onChange={(e) => setValues({...values, password: e.target.value})} />
				</label>
				<input type="submit" value={'login'} onClick={() => onSubmit()}/>
			</div>
			<div className="loginButtons">
				<Link to={"/register"}><button> Register </button></Link>
				<Link to={"/forgot"}><button> Forgot Password </button></Link>
			</div>
		</div>


	</div>);
}

export default Login;
