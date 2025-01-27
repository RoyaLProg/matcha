import "./Register.css"
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { notificationFunctions, NotificationType } from "../../context/WebSocketContext";

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
	const navigate = useNavigate();

	async function onSubmit(values: IForm) {
		const data = { firstName: values.firstName, lastName: values.lastName, username: values.username, email: values.email, birthDate: values.birthDate, password: values.password }

		if (!checkPassword(values.password))
			return ; 

		if (values.password != values.confirmPassword)
			return ;

		await fetch(import.meta.env.VITE_API_URL + "/api/auth/register",
			  {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			  }
		).then((rv) => {
			if (!rv.ok) {
				rv.json().then((value) => notificationFunctions[NotificationType.Error](value['message']));
			} else {
				rv.json().then((value) => {
					notificationFunctions[NotificationType.Success](value.message);
					navigate('/login');
				});
			}
		})
		.catch((e) => console.log(e));
	}

	function checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);

		return (i1 && i2 && i3 && i4);
	}

	return (
		<div className="register">
			<div className="registerLogo">
				<span className="logo"></span>
			</div>
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
						<input type="password" {...register("password", {required: true, maxLength: 256, minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i })} aria-invalid={errors.password ? true : false}/>
					</label>
					<label id="confirm-password">
						Confirm Password :
						<input type="password" {...register("confirmPassword", {required: true, maxLength: 256,minLength: 8, pattern: /^[A-Za-z0-9_\-@!\*]+$/i, })} aria-invalid={errors.confirmPassword ? true : false}/>
					</label>
					<input type="submit" />
				</form>
				<div className="registerButtons">
					<Link to={"/"}><button> Back </button></Link>
					<Link to={"/login"}><button> Login </button></Link>
				</div>
			</div>
		</div>
	)
}
