import { Link } from "react-router-dom"
import "./Home.css"

function Home() {


	return (
		<div>

		</div>
	);
}

function HomeDefault() {
	return (
		<div >
			<h1>MATCHA LOGO HERE</h1>
			<p>welcome to 42love</p>
			<Link to={"/login"}><button> Login </button></Link>
			<Link to={"/register"}><button> Register </button></Link>
		</div>
	);
}

export { Home, HomeDefault };