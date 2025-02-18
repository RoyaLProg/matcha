import { useEffect, useState } from "react";
import Picture from "../../interface/picture.interface";
import "./carrousel.css"

export default function Carrousel({pictures}: {pictures: Picture[]}) {
	const [index, setIndex] = useState<number>(0);

	function updateIndex(x: number) {
		if (x === -1 && index === 0) return;
		if (x === 1 && index === pictures.length -1) return;

		setIndex(index + x);
	}

	useEffect( () => {
		const myDiv = document.getElementById('carrouselImages');
		if (!myDiv) return ;
		console.log('triggered');
		myDiv.style.transform = `translate(${index * 400 * -1}px, 0)`
	}, [index]);

	return (
		<div id="carrousel">
			<span className="material-symbols-outlined" aria-hidden={index === 0} onClick={() => updateIndex(-1)}>arrow_back_ios</span>
			<div id="carrouselImages">
			{ 
				pictures.map( (picture, i) =>
					<img src={`${import.meta.env.VITE_API_URL}/api${picture.url}`} alt={`profile ${i}`} />
				)
			}
			</div>
			<span className="material-symbols-outlined" aria-hidden={index === pictures.length - 1} onClick={() => updateIndex(1)}>arrow_forward_ios</span>
		</div>
	);
}
