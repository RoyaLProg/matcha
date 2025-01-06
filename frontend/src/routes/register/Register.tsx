import "./Register.css"
import { useForm } from "react-hook-form";

interface IForm {
	firstName: string
	lastName: string
	username: string
	email: string
	birthday: Date
	password: string
	confirmPassword: string
}


export default function Register() {
	const { handleSubmit, register, formState: {errors} } = useForm<IForm>();

	function onSubmit(values: IForm) {
		if (values.password != values.confirmPassword)
			return ;
		console.log('ok');
	}

	return (
		<div>
			<h1>MATCHA LOGO HERE</h1>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="formGroup">
					<label id="first-name">
						First Name :
					</label>
					<input {...register("firstName", {required: true, maxLength: 255, pattern: /^[A-Za-z]+$/i})} aria-invalid={errors.firstName ? true : false}/>
					<label id="last-name">
						Last Name :
						<input {...register("lastName", {required: true, maxLength: 255, pattern: /^[A-Za-z]+$/i})} aria-invalid={errors.lastName ? true : false}/>
					</label>
				</div>
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
					<input type="date"/>
				</label>
				<label id="password">
					Password :
					<input type="password" {...register("password", {required: true, maxLength: 256, pattern: /^[A-Za-z0-9_\-@!\*]+$/i})} aria-invalid={errors.password ? true : false}/>
				</label>
				<label id="confirm-password">
					Confirm Password :
					<input type="password" {...register("confirmPassword", {required: true, maxLength: 256, pattern: /^[A-Za-z0-9_\-@!\*]+$/i})} aria-invalid={errors.confirmPassword ? true : false}/>
				</label>
				<input type="submit" />
			</form>
		</div>
	)
}
