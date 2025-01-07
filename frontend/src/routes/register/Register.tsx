import "./Register.css"
import { useForm } from "react-hook-form";
import { useState } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
=======
>>>>>>> 453f520 (feat(frontend): adding api call)

interface IForm {
	firstName: string
	lastName: string
	username: string
	email: string
	birthDate: Date
	password: string
	confirmPassword: string
}

export default function Register() {
	const { handleSubmit, register, formState: {errors} } = useForm<IForm>();
	const [ password, setPassword ] = useState<string>("");
	const [ error, setError ] = useState<string | null>(null);

	function onSubmit(values: IForm) {
<<<<<<< HEAD
		setError(null);
=======
>>>>>>> 453f520 (feat(frontend): adding api call)
		const data = { firstName: values.firstName, lastName: values.lastName, username: values.username, email: values.email, birthDate: values.birthDate, password: password }
		fetch(import.meta.env.VITE_API_URL + "/api/auth/register",
			  {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			  }
		).then((rv) => rv.json().then(value => setError(value['message'])))
		.catch((e) => console.log(e));
	}
<<<<<<< HEAD

	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);
=======
	
	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);	
		const i4 = new RegExp(/[A-Z]/).test(value);	
>>>>>>> 453f520 (feat(frontend): adding api call)
		setPassword(value);

		return (i1 && i2 && i3 && i4);
	}

	return (
<<<<<<< HEAD
		<div className="register">
			<div className="registerLogo">
				<span className="logo"></span>
			</div>
			{ error ?? <p id="error">{error}</p> }
			<div className="registerForm">
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="formGroup">
						<label id="first-name">
							First Name :
							<input type="text" {...register("firstName", {required: true, maxLength: 255, pattern: /^[A-Za-z]+$/i})} aria-invalid={errors.firstName ? true : false}/>
						</label>

						<label id="last-name">
							Last Name :
							<input type="text" {...register("lastName", {required: true, maxLength: 255, pattern: /^[A-Za-z]+$/i})} aria-invalid={errors.lastName ? true : false}/>
						</label>
					</div>
					<label id="username">
						Username :
						<input type="text" {...register("username", {required: true, maxLength: 255, pattern: /^[A-Za-z0-9_-]+$/i})} aria-invalid={errors.username ? true : false}/>
=======
		<div>
			<h1>MATCHA LOGO HERE</h1>
			{ error ?? <p id="error">{error}</p> }
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="formGroup">
					<label id="first-name">
						First Name :
>>>>>>> 453f520 (feat(frontend): adding api call)
					</label>
					<label id="email">
						Email :
						<input type="email" {...register("email", {required: true, maxLength: 255, pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i})} aria-invalid={errors.email ? true : false}/>
					</label>
					<label id="birthday">
						Birthday :
						<input type="date" {...register("birthDate", {required: true, valueAsDate: true, validate: value => {let x = new Date().getFullYear() - value.getFullYear(); return x > 17 && x < 80}})} aria-invalid={errors.birthDate ? true : false}/>
					</label>
					<label id="password">
						Password :
						<input type="password" defaultValue={password} {...register("password", {required: true, maxLength: 256, minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => checkPassword(value)})} aria-invalid={errors.password ? true : false}/>
					</label>
					<label id="confirm-password">
						Confirm Password :
						<input type="password" {...register("confirmPassword", {required: true, maxLength: 256,minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => {return (value == password)}})} aria-invalid={errors.confirmPassword ? true : false}/>
					</label>
					<input type="submit" />
				</form>
				<div className="registerButtons">
					<Link to={"/"}><button> Back </button></Link>
					<Link to={"/login"}><button> Login </button></Link>
				</div>
<<<<<<< HEAD
			</div>
=======
				<label id="username">
					Username :
					<input {...register("username", {required: true, maxLength: 255, pattern: /^[A-Za-z0-9_-]+$/i})} aria-invalid={errors.username ? true : false}/>
				</label>
				<label id="email">
					Email :
					<input {...register("email", {required: true, maxLength: 255, pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i})} aria-invalid={errors.email ? true : false}/>
				</label>
				<label id="birthday">
					Birthday :
					<input type="date" {...register("birthDate", {required: true, valueAsDate: true, validate: value => {let x = new Date().getFullYear() - value.getFullYear(); return x > 17 && x < 80}})} aria-invalid={errors.birthDate ? true : false}/>
				</label>
				<label id="password">
					Password :
					<input type="password" defaultValue={password} {...register("password", {required: true, maxLength: 256, minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => checkPassword(value)})} aria-invalid={errors.password ? true : false}/>
				</label>
				<label id="confirm-password">
					Confirm Password :
					<input type="password" {...register("confirmPassword", {required: true, maxLength: 256,minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, validate: value => {return (value == password)}})} aria-invalid={errors.confirmPassword ? true : false}/>
				</label>
				<input type="submit" />
			</form>
>>>>>>> 453f520 (feat(frontend): adding api call)
		</div>
	)
}
