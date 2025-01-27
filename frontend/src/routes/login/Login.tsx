import "./Login.css";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { notificationFunctions, NotificationType } from "../../context/WebSocketContext";

interface IForm {
	username: string
	password: string
}

function Login() {
	const { handleSubmit, register, formState: {errors} } = useForm<IForm>();
	const userConext = useContext(UserContext);
	const navigate = useNavigate();

	async function onSubmit(values: IForm) {
		const data = { username: values.username, password: values.password };
		
		if (!checkPassword(values.password))
			return ;

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
					if (userConext && userConext.user === undefined) {
						userConext.updateUserFromCookie();
						notificationFunctions[NotificationType.Success]('Login successful');
						navigate('/');
					}
				}
			})
			.catch((e) => console.error('Fetch error:', e));
	}
	

	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);

		return (i1 && i2 && i3 && i4);
	}

	return (
	<div className="login">
		<div className="loginLogo">
			<span className="logo"></span>
		</div>
		<div className="loginForm">
			<form onSubmit={handleSubmit(onSubmit)}>
				<label id="username">
					Username :
					<input type='text' {...register("username", {required: true, maxLength: 255, pattern: /^[A-Za-z0-9_-]+$/i})} aria-invalid={errors.username ? true : false}/>
				</label>
				<label id="password">
					Password :
					<input type="password" {...register("password", {required: true, maxLength: 256, minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => checkPassword(value)})} aria-invalid={errors.password ? true : false}/>
				</label>
				<input type="submit" value={'login'}/>
			</form>
			<div className="loginButtons">
				<Link to={"/register"}><button> Register </button></Link>
				<Link to={"/forgot"}><button> Forgot Password </button></Link>
			</div>
		</div>


	</div>);
}

export default Login;
