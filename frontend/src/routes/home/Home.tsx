import { Link } from "react-router-dom"
import { useContext, useEffect, useState } from "react";
import "./Home.css"
import Carrousel from "../components/Carrousel";
import { UserContext } from "../../context/UserContext";

export function Home() {
	const user = useContext(UserContext);
	const [matches, setMatches] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	const fetchMatches = () => {
		setLoading(true);
		fetch("http://localhost:3000/api/action/matches", {
			credentials: 'include',
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error("Erreur lors du chargement des matches");
				}
				return response.json();
			})
			.then((data) => {
				setMatches(data);
				setLoading(false);
			})
			.catch((error) => {
				console.error("Erreur API:", error);
				setError(error.message);
				setLoading(false);
			});
	};

	useEffect(() => {
		fetchMatches();
	}, []);
	
	// bro is using mf chatgpt to do his work
	const sendAction = async (targetUserId, status) => {
		if (!user?.user?.id) {
			console.warn("Action annulée : Aucun utilisateur connecté.");
			return; // ✅ Empêche l'exécution si `user.user.id` est absent
		}

		try {
			const response = await fetch(`http://localhost:3000/api/action/like`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.user.id,
					targetUserId,
					status
				}),
			});

			if (!response.ok) throw new Error(`Erreur lors de l'envoi du ${status}`);
			const data = await response.json();

		} catch (error) {
			console.error(`Erreur lors de l'envoi du ${status} :`, error);
		}
	};

	// Fonction pour gérer un like
	const handleLike = () => {
		if (!user?.user?.id) return;
		if (matches.length > 0) {
			const matchId = matches[currentIndex].user.id;
			sendAction(matchId, "like");
			removeCurrentMatch();
		}
	};

	const handleDislike = () => {
		if (!user?.user?.id) return;
		if (matches.length > 0) {
			const matchId = matches[currentIndex].user.id;
			sendAction(matchId, "dislike");
			removeCurrentMatch();
		}
	};

	const removeCurrentMatch = () => {
		setMatches((prevMatches) => {
			const newMatches = prevMatches.filter((_, index) => index !== currentIndex);
			if (newMatches.length === 0) {
				fetchMatches(); // Recharge si plus de matches
			} else if (currentIndex >= newMatches.length) {
				setCurrentIndex(0); // Revenir au premier si out of bounds
			}
			return newMatches;
		});
		setCurrentImageIndex(0);
	};
	const nextImage = () => {
		if (matches.length > 0 && matches[currentIndex].pictures.length > 1) {
			setCurrentImageIndex((prevIndex) => (prevIndex + 1) % matches[currentIndex].pictures.length);
		}
	};

	const prevImage = () => {
		if (matches.length > 0 && matches[currentIndex].pictures.length > 1) {
			setCurrentImageIndex((prevIndex) => (prevIndex - 1 + matches[currentIndex].pictures.length) % matches[currentIndex].pictures.length);
		}
	};

	if (loading) return <p>Chargement en cours...</p>;
	if (error) return <p>❌ Erreur : {error}</p>;
	if (matches.length === 0) return (<p style={{margin: "auto"}}> We have no one for you D: </p>);

	const currentMatch = matches[currentIndex];
	const pictures = currentMatch.pictures || [];
	const currentPicture = pictures.length > 0 ? (pictures[currentImageIndex]?.url ? pictures[currentImageIndex].url : pictures[0].url) : null;
	return (
		<div className="home alignement">
			<div id="container">
				<button className="dislikeButton" onClick={handleDislike}> <span className="material-symbols-outlined">thumb_down</span> </button>
				<div className="content">
					<div className="card">
					<Carrousel pictures={currentMatch.pictures} />
					<div className="yourProfile">
						<p style={{fontSize: "32px"}}>{currentMatch.user.firstName} {currentMatch.user.lastName}, {currentMatch.age} ans</p>
						<p style={{fontSize: "20px", color: "#aaa"}}>{currentMatch.settings.country}, {currentMatch.settings.city} ({currentMatch.distance.toFixed(1)} km)</p>
						<p style={{fontSize: "15px", textAlign: "justify"}}>{currentMatch.settings.biography || "Aucune description disponible."} </p>

					</div>
						{/* <div>
								{currentMatch.tags.map((tag) => (
									<span key={tag.id} className="tag">
										{tag.tag}
									</span>
								))}
							</div> */}
					</div>
				</div>
				<button className="likeButton" onClick={handleLike}> <span className="material-symbols-outlined">thumb_up</span> </button>
			</div>
		</div>
	);
}

export default function HomeDefault() {
	return (
		<div className="home">
			<div className="homeLogoDefault">
				<span className="logo"></span>
			</div>
			<p>welcome to 42love</p>
			<div className="homeButtons">
				<Link to={"/login"}><button className="loginButton"> Login </button></Link>
				<Link to={"/register"}><button className="registerButton"> Register </button></Link>
			</div>
		</div>
	);
}
