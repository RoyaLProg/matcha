import "./Login.css";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface IForm {
	username: string
	password: string
}

function Login() {
	const { handleSubmit, register, formState: {errors} } = useForm<IForm>();
	const [password, setPassword] = useState<string>("");
	const [ error, setError ] = useState<string | null>(null);

	function onSubmit(values: IForm) {
		const data = { username: values.username, password: password }
		fetch(import.meta.env.VITE_API_URL + "/api/auth/login",
			  {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			  }
		).then((rv) => rv.json().then(value => setError(value['message'])))
		.catch((e) => console.log(e));
	}

	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);
		setPassword(value);

		return (i1 && i2 && i3 && i4);
	}

	return (
	<div>
		<h1>MATCHA LOGO HERE</h1>
			{ error ?? <p id="error">{error}</p> }
			<form onSubmit={handleSubmit(onSubmit)}>
				<label id="username">
					Username :
					<input {...register("username", {required: true, maxLength: 255, pattern: /^[A-Za-z0-9_-]+$/i})} aria-invalid={errors.username ? true : false}/>
				</label>
				<label id="password">
					Password :
					<input type="password" defaultValue={password} {...register("password", {required: true, maxLength: 256, minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => checkPassword(value)})} aria-invalid={errors.password ? true : false}/>
				</label>
				<input type="submit" />
			</form>
	</div>);
}

export default Login;