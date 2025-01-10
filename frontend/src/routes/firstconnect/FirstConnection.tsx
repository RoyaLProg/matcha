import "./FirstConnection.css";
import getTags from "../../assets/tags";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface IForm {
	gender: string;
	sexualPreferences: string;
	biography: string;
	tags: string[];
	pictures: File[];
}

function FirstConnection() {
	const { handleSubmit, register, formState: {errors} } = useForm<IForm>();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [profilePicture, setProfilePicture] = useState<string>("");
	const [uploadedPictures, setUploadedPictures] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const tags = getTags();

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
			if (uploadedPictures.length + files.length > 5) {
				console.log("You can upload up to 5 pictures only.");
				return;
			}
			setUploadedPictures([...uploadedPictures, ...files]);
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


	function onSubmit(values: IForm) {
		if (selectedTags.length < 7) {
			console.log("Please select at least 7 tags");
			return
		}
		if (uploadedPictures.length < 1) {
			console.log("Please upload at least one picture");
			return
		}
		const data = {
			...values,
			tags: selectedTags,
			profilePicture: profilePicture
		}
		console.log(data);
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
					<div className="form-group">
						<label htmlFor="gender">Gender</label>
						<select {...register("gender", {required: true})} aria-invalid={errors.gender ? true : false}>
							<option value="">Select Gender</option>
							<option value="man">Man</option>
							<option value="woman">Woman</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div className="form-group">
						<label htmlFor="sexualPreferences">Sexual Preferences</label>
						<select {...register("sexualPreferences", {required: true})} aria-invalid={errors.sexualPreferences ? true : false}>
							<option value="">Select Preferences</option>
							<option value="heterosexual">Heterosexual</option>
							<option value="bisexual">Bisexual</option>
							<option value="homosexual">Homosexual</option>
						</select>
					</div>
					<div className="form-group">
						<label htmlFor="biography">Biography</label>
						<textarea  placeholder="Tell us aboutn yourself..." {...register("biography", {required: true})} aria-invalid={errors.biography ? true : false}/>
					</div>
					<div className="form-group">
						<label>Interests (Select up to minimun 7)</label>
						{Object.entries(tags).map(([category, tagList]) => (
						<div key={category}>
							<h4>{category}</h4>
							<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
							{tagList.map((tag) => (
								<button key={tag} className={`tag ${selectedTags.includes(tag) ? "selected" : ""}`} onClick={() => handleTagClick(tag)} type="button" >
									{tag}
								</button>
							))}
							</div>
						</div>
						))}
					</div>
					<div className="form-group">
						<label htmlFor="pictures">Upload Pictures (Max 5)</label>
						<input type="file" name="pictures" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef}/>
						<div className="uploaded-images">
							{uploadedPictures.map((file, index) => (
								<div key={index} className="image-container">
									<button type="button" className="delete-button" onClick={() => handleDeleteImage(file.name)} >
										<span className="material-icons-outlined">delete</span>
									</button>
									<img src={URL.createObjectURL(file)} alt={`Uploaded ${index}`} className={`uploaded-image ${profilePicture === file.name ? "selected" : ""}`} onClick={() => setProfilePicture(file.name)} />
									<button type="button" className="set-profile-button" onClick={() => setProfilePicture(file.name)} >
										{profilePicture === file.name ? "Profile Picture" : "Set as Profile"}
									</button>
								</div>
							))}
						</div>
					</div>
					<button type="submit" className="submit-button">
						Save Profile
					</button>
				</form>
			</div>
		</div>
	)
}

export default FirstConnection;