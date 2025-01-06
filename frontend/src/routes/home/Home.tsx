import { Link } from "react-router-dom"
import "./Home.css"

export default function Home() {
	return (
		<div>
			<h1>MATCHA LOGO HERE</h1>
			<p>welcome to 42love</p>

			<button> Login </button>
			<Link to={"/register"}><button> Register </button></Link>
		</div>
	);
}
