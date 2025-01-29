import "./FirstConnection.css";
import getTags from "../../assets/tags";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { cookies, UserContext } from "../../context/UserContext";
import Settings, { UserGender, UserSexualOrientation } from "../../interface/settings.interface";
import Picture from "../../interface/picture.interface";

function FirstConnection() {
	const user = useContext(UserContext);
	const { handleSubmit, register, setValue, formState: { errors } } = useForm<Settings>();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [profilePicture, setProfilePicture] = useState<string>("");
	const [uploadedPictures, setUploadedPictures] = useState<File[]>([]);
	const [rangeAgeMin, setRangeAgeMin] = useState<number>(18);
	const [rangeAgeMax, setRangeAgeMax] = useState<number>(22);
	const [rangeLocalisation, setRangeLocalisation] = useState<number>(0);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const tagss = getTags();

	useEffect(() => {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
		async (position) => {
			const { latitude, longitude } = position.coords;
			const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
			const data = await response.json();
			if (data) {
				setValue("country", data.countryName || "");
				setValue("city", data.city || "");
			}
			setValue("latitude", latitude);
			setValue("longitude", longitude);
		},
		(error) => console.error("Error getting location:", error)
		);
	}
	}, [setValue]);


	useEffect(() => {
		// Obtenir les coordonnées GPS
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					const response = await fetch(
						`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
					);
					const data = await response.json();
					if (data) {
						setValue("country", data.countryName || "");
						setValue("city", data.city || "");
					}
				},
				(error) => console.error("Error getting location:", error)
			);
		}
	}, [setValue]);

	function handleTagClick(tag: string) {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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
		setUploadedPictures(uploadedPictures.filter((file) => file.name !== fileName));
		if (profilePicture === fileName) {
			setProfilePicture("");
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function onSubmit(values: Partial<Settings>) {
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
			if (!hasProfilePicture && pictures.length > 0)
				pictures[0].isProfile = true;

			// Étape 3 : Formater les tags
			const formattedTags = selectedTags.map((tag) => {
				const category = Object.keys(tagss).find((category) =>
					tagss[category as keyof typeof Tags].includes(tag)
				);
				return {
					category: category || "unknown",
					tag,
				};
			});

			const formData = new FormData();

			uploadedPictures.forEach((file) => {
				formData.append("files", file);
			});

			// Étape 4 : Préparer les données
			const data: Settings = {
				userId: user?.user?.id?.toString() || "",
				country: values.country || "",
				city: values.city || "",
				latitude: values.latitude || 0,
				longitude: values.longitude || 0,
				maxDistance: rangeLocalisation,
				geoloc: values.geoloc || false,
				minAgePreference: rangeAgeMin,
				maxAgePreference: rangeAgeMax,
				biography: values.biography || "",
				gender: values.gender || UserGender.Undefined,
				sexualOrientation: values.sexualOrientation || UserSexualOrientation.Undefined,
				pictures: pictures as Picture[],
				tags: formattedTags,
			};

			formData.append("data", JSON.stringify(data));
			// Étape 5 : Envoyer les données au backend
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings/create`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${cookies["Auth"]}`,
				},
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const result = await response.json();
			if (result.error) {
				console.error("Error during submit:", result.error);
				return;
			}
			user?.setUserSettings(result);
		} catch (error) {
			console.error("Error during submit:", error);
		}
	}


	return (
		<div className="firstConnection">
			<div className="menu">
				<div className="logoMenu">
					<span className="logo"></span>
				</div>
				<div className="myProfile">
					<img src="https://www.w3schools.com/w3images/avatar2.png" alt="profile" />
				</div>
			</div>
			<div className="content">
				<h2>Complete Your Profile</h2>
				<form onSubmit={handleSubmit(onSubmit)}>
					{/* Champ pour le genre */}
					<div className="form-group">
						<label htmlFor="gender">Gender</label>
						<select {...register("gender", { required: true })} aria-invalid={errors.gender ? true : false}>
							<option value="">Select Gender</option>
							<option value={UserGender.Man}>Man</option>
							<option value={UserGender.Woman}>Woman</option>
							<option value={UserGender.Other}>Other</option>
						</select>
						{errors.gender && <p className="error">Gender is required</p>}
					</div>

					{/* Champ pour les préférences sexuelles */}
					<div className="form-group">
						<label htmlFor="sexualOrientation">Sexual Preferences</label>
						<select {...register("sexualOrientation", { required: true })} aria-invalid={errors.sexualOrientation ? true : false}>
							<option value="">Select Preferences</option>
							<option value={UserSexualOrientation.Heterosexual}>Heterosexual</option>
							<option value={UserSexualOrientation.Bisexual}>Bisexual</option>
							<option value={UserSexualOrientation.Homosexual}>Homosexual</option>
						</select>
						{errors.sexualOrientation && <p className="error">Sexual preferences are required</p>}
					</div>

					{/* Champ pour la biographie */}
					<div className="form-group">
						<label htmlFor="biography">Biography</label>
						<textarea
							placeholder="Tell us about yourself..."
							{...register("biography", { required: true })}
							aria-invalid={errors.biography ? true : false}
						/>
						{errors.biography && <p className="error">Biography is required</p>}
					</div>

					{/* Champ pour le pays */}
					<div className="form-group">
						<label htmlFor="country">Country</label>
						<input
							type="text"
							placeholder="Enter your country"
							{...register("country", { required: true })}
							aria-invalid={errors.country ? true : false}
						/>
						{errors.country && <p className="error">Country is required</p>}
					</div>

					{/* Champ pour la ville */}
					<div className="form-group">
						<label htmlFor="city">City</label>
						<input
							type="text"
							placeholder="Enter your city"
							{...register("city", { required: true })}
							aria-invalid={errors.city ? true : false}
						/>
						{errors.city && <p className="error">City is required</p>}
					</div>

					{/* Checkbox pour la géolocalisation */}
					<div className="form-group">
						<label htmlFor="geoloc">Enable Geolocation</label>
						<input
							type="checkbox"
							{...register("geoloc")}
						/>
					</div>

					{/* Plages d'âge */}
					<div className="form-group">
						<label htmlFor="rangeAge">Range Age: {rangeAgeMin} - {rangeAgeMax}</label>
						<input
							type="range"
							min="18"
							max="100"
							step="1"
							value={rangeAgeMin}
							onChange={(e) => setRangeAgeMin(Number(e.target.value))}
						/>
						<input
							type="range"
							min="18"
							max="100"
							step="1"
							value={rangeAgeMax}
							onChange={(e) => setRangeAgeMax(Number(e.target.value))}
						/>
					</div>

					{/* Plage de localisation */}
					<div className="form-group">
						<label htmlFor="rangelocalisation">Range Localisation: {rangeLocalisation} km</label>
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={rangeLocalisation}
							onChange={(e) => setRangeLocalisation(Number(e.target.value))}
						/>
					</div>

					{/* Tags et intérêts */}
					<div className="form-group">
						<label>Interests (Select up to 7)</label>
						{Object.entries(tagss).map(([category, tagList]) => (
							<div key={category}>
								<h4>{category}</h4>
								<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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
						<input
							type="file"
							name="pictures"
							accept="image/*"
							multiple
							onChange={handleFileChange}
							ref={fileInputRef}
						/>
						<div className="uploaded-images">
							{uploadedPictures.map((file, index) => (
								<div key={index} className="image-container">
									<button type="button" className="delete-button" onClick={() => handleDeleteImage(file.name)}>
										<span className="material-icons-outlined">delete</span>
									</button>
									<img
										src={URL.createObjectURL(file)}
										alt={`Uploaded ${index}`}
										className={`uploaded-image ${profilePicture === file.name ? "selected" : ""}`}
										onClick={() => setProfilePicture(file.name)}
									/>
									<button type="button" className="set-profile-button" onClick={() => setProfilePicture(file.name)}>
										{profilePicture === file.name ? "Profile Picture" : "Set as Profile"}
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Bouton de soumission */}
					<button type="submit" className="submit-button">
						Save Profile
					</button>
				</form>
			</div>
		</div>
	);

}

export default FirstConnection;
