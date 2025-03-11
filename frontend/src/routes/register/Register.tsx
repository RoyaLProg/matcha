import "./Register.css"
import { Link, useNavigate } from "react-router-dom";
import { notificationFunctions, NotificationType } from "../../context/WebSocketContext";
import { useState } from "react";

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
	const navigate = useNavigate();
	const [errors, setErrors] = useState<any | null>(null);
	const [values, setValues] = useState<IForm>({firstName: '', lastName: '', username: '', email: '', birthDate: new Date(), password: '', confirmPassword: ''});

	async function onSubmit() {
		setErrors(null);

		if (values.password != values.confirmPassword) {
			setErrors({confirmPassword: 'passwords does not match'});
			return ;
		}

		await fetch(import.meta.env.VITE_API_URL + "/api/auth/register",
			  {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			  }
		).then((rv) => {
			if (!rv.ok) {
				rv.json().then((value) => setErrors(value));
			} else {
				rv.json().then((value) => {
					notificationFunctions[NotificationType.Success](value.message);
					navigate('/login');
				});
			}
		})
		.catch(() => {});
	}

	return (
		<div className="register">
			<div className="registerLogo">
				<span className="logo"></span>
			</div>
				{ errors ?
					<div className="error">
						{
							Object.values(errors).map((v) => {
								return (<p className="error-message"> {v as String} </p>);
							})
						}
					</div>
					:
					''
				}
			<div className="registerForm">
				<div id="form">
					<div className="formGroup">
						<label id="first-name">
							First Name :
							<input type="text" onChange={(e) => setValues({...values, firstName: e.target.value})} aria-invalid={errors && errors.firstName ? true : false}/>
						</label>

						<label id="last-name">
							Last Name :
							<input type="text" onChange={(e) => setValues({...values, lastName: e.target.value})} aria-invalid={errors && errors.lastName ? true : false}/>
						</label>
					</div>
					<label id="username">
						Username :
						<input type="text" onChange={(e) => setValues({...values, username: e.target.value})} aria-invalid={errors && errors.username ? true : false}/>
					</label>
					<label id="email">
						Email :
						<input type="email" onChange={(e) => setValues({...values, email: e.target.value})} aria-invalid={errors && errors.email ? true : false}/>
					</label>
					<label id="birthday">
						Birthday :
						<input type="date" onChange={(e) => setValues({...values, birthDate: e.target.valueAsDate as Date})} aria-invalid={errors && errors.birthDate ? true : false}/>
					</label>
					<label id="password">
						Password :
						<input type="password" onChange={(e) => setValues({...values, password: e.target.value})} aria-invalid={errors && errors.password ? true : false}/>
					</label>
					<label id="confirm-password">
						Confirm Password :
						<input type="password" onChange={(e) => setValues({...values, confirmPassword: e.target.value})} aria-invalid={errors && errors.confirmPassword ? true : false}/>
					</label>
					<button id='form-submit' onClick={ () => onSubmit() }>Submit</button>
				</div>
				<div className="registerButtons">
					<Link to={"/"}><button> Back </button></Link>
					<Link to={"/login"}><button> Login </button></Link>
				</div>
			</div>
		</div>
	)
}
