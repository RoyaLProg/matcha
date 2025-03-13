import "./FirstConnection.css";
import getTags from "../../assets/tags";
import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import Settings, { UserGender, UserSexualOrientation } from "../../interface/settings.interface";
import Picture from "../../interface/picture.interface";

function FirstConnection() {
	const user = useContext(UserContext);
	const [formData, setFormData] = useState({
		gender: "",
		sexualOrientation: "",
		biography: "",
		country: "",
		city: "",
		geoloc: false,
		latitude: 0,
		longitude: 0,
	});

	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [profilePicture, setProfilePicture] = useState<string>("");
	const [uploadedPictures, setUploadedPictures] = useState<File[]>([]);
	const [rangeAgeMin, setRangeAgeMin] = useState<number>(18);
	const [rangeAgeMax, setRangeAgeMax] = useState<number>(22);
	const [rangeLocalisation, setRangeLocalisation] = useState<number>(10);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const tagss = getTags();

	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				const { latitude, longitude } = position.coords;
				const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
				const data = await response.json();
				if (data) {
					setFormData((prev) => ({
						...prev,
						country: data.countryName || "",
						city: data.city || "",
						latitude,
						longitude,
					}));
				}
			});
		}
	}, []);

	function handleChange(event) {
		const { name, value, type, checked } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	}

	function handleTagClick(tag) {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	}

	function handleFileChange(event) {
		if (event.target.files) {
			const files = Array.from(event.target.files);
			const newFiles = files.filter((file) => !uploadedPictures.some((pic) => pic.name === file.name));
			if (uploadedPictures.length + newFiles.length > 5) {
				console.log("You can upload up to 5 pictures only.");
				return;
			}
			setUploadedPictures([...uploadedPictures, ...newFiles]);
		}
	}
	
	function handleDeleteImage(fileName: string) {
		setUploadedPictures(
			uploadedPictures.filter((x) => x.name != fileName)
		)
	}

	async function onSubmit(event) {
		event.preventDefault();
		if (selectedTags.length < 7) {
			console.log("Please select at least 7 tags");
			return;
		}
		if (uploadedPictures.length < 1) {
			console.log("Please upload at least one picture");
			return;
		}

		try {
			let hasProfilePicture = false;
			const pictures = uploadedPictures.map((file) => {
				const isProfile = profilePicture === file.name;
				if (isProfile) hasProfilePicture = true;
				return { name: file.name, isProfile };
			});
			if (!hasProfilePicture && pictures.length > 0) pictures[0].isProfile = true;

			const formattedTags = selectedTags.map((tag) => {
				const category = Object.keys(tagss).find((category) => tagss[category].includes(tag));
				return { category: category || "unknown", tag };
			});

			const data = {
				...formData,
				userId: user?.user?.id?.toString() || "",
				maxDistance: rangeLocalisation,
				minAgePreference: rangeAgeMin,
				maxAgePreference: rangeAgeMax,
				pictures,
				tags: formattedTags,
			};

			const formDataToSend = new FormData();
			uploadedPictures.forEach((file) => {
				formDataToSend.append("files", file);
			});
			formDataToSend.append("data", JSON.stringify(data));

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings/create`, {
				method: "POST",
				credentials: "include",
				body: formDataToSend,
			});

			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
			const result = await response.json();
			user?.setUserSettings(result);
		} catch (error) {
			console.error("Error during submit:", error);
		}
	}

	return (
		<div className="firstConnection">
			{/* Contenu principal */}
			<div className="content">
				<h2>Complete Your Profile</h2>
				<form onSubmit={onSubmit}>

					{/* Genre */}
					<div className="form-group">
						<label htmlFor="gender">Gender</label>
						<select name="gender" value={formData.gender} onChange={handleChange}>
							<option value="">Select Gender</option>
							<option value={UserGender.Man}>Man</option>
							<option value={UserGender.Woman}>Woman</option>
							<option value={UserGender.Other}>Other</option>
						</select>
					</div>

					{/* Orientation sexuelle */}
					<div className="form-group">
						<label htmlFor="sexualOrientation">Sexual Preferences</label>
						<select name="sexualOrientation" value={formData.sexualOrientation} onChange={handleChange}>
							<option value="">Select Preferences</option>
							<option value={UserSexualOrientation.Heterosexual}>Heterosexual</option>
							<option value={UserSexualOrientation.Bisexual}>Bisexual</option>
							<option value={UserSexualOrientation.Homosexual}>Homosexual</option>
						</select>
					</div>

					{/* Biographie */}
					<div className="form-group">
						<label htmlFor="biography">Biography</label>
						<textarea name="biography" value={formData.biography} onChange={handleChange} />
					</div>

					{/* Pays */}
					<div className="form-group">
						<label htmlFor="country">Country</label>
						<input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Enter your country" />
					</div>

					{/* Ville */}
					<div className="form-group">
						<label htmlFor="city">City</label>
						<input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter your city" />
					</div>

					{/* Géolocalisation */}
					<div className="form-group">
						<label htmlFor="geoloc">Enable Geolocation</label>
						<input type="checkbox" name="geoloc" checked={formData.geoloc} onChange={handleChange} />
					</div>

					{/* Plage d'âge */}
					<div className="form-group">
						<label>Age Range: {rangeAgeMin} - {rangeAgeMax}</label>
						<input type="range" min="18" max="100" value={rangeAgeMin} onChange={(e) => setRangeAgeMin(Number(e.target.value))} />
						<input type="range" min="18" max="100" value={rangeAgeMax} onChange={(e) => setRangeAgeMax(Number(e.target.value))} />
					</div>

					{/* Plage de localisation */}
					<div className="form-group">
						<label>Range Localisation: {rangeLocalisation} km</label>
						<input type="range" min="10" max="100000000000" value={rangeLocalisation} onChange={(e) => setRangeLocalisation(Number(e.target.value))} />
					</div>

					{/* Tags et intérêts */}
					<div className="form-group">
						<label>Interests (Select up to 7)</label>
						{Object.entries(tagss).map(([category, tagList]) => (
							<div key={category}>
								<h4>{category}</h4>
								<div className="tags-container">
									{tagList.map((tag) => (
										<button
											key={tag}
											className={`tag ${selectedTags.includes(tag) ? "selected" : ""}`}
											onClick={() => handleTagClick(tag)}
											type="button"
										>
											{tag}
										</button>
									))}
								</div>
							</div>
						))}
					</div>

					{/* Téléchargement des photos */}
					<div className="form-group">
						<label htmlFor="pictures">Upload Pictures (Max 5)</label>
						<input type="file" name="pictures" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} />

						{/* Aperçu des images uploadées */}
						<div className="uploaded-images">
							{uploadedPictures.map((file, index) => (
								<div key={index} className="image-container">
									{/* Bouton de suppression */}
									<button type="button" className="delete-button" onClick={() => handleDeleteImage(file.name)}>
										<span className="material-icons-outlined">delete</span>
									</button>

									{/* Affichage de l'image */}
									<img
										src={URL.createObjectURL(file)}
										alt={`Uploaded ${index}`}
										className={`uploaded-image ${profilePicture === file.name ? "selected" : ""}`}
										onClick={() => setProfilePicture(file.name)}
									/>

									{/* Définir comme photo de profil */}
									<button type="button" className="set-profile-button" onClick={() => setProfilePicture(file.name)}>
										{profilePicture === file.name ? "Profile Picture" : "Set as Profile"}
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Bouton de soumission */}
					<button type="submit">Save Profile</button>
				</form>
			</div>
		</div>
	);


}

export default FirstConnection;
