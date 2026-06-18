import { useState } from "react";
import "./login.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    department: "",
    dob: "2077-11-20",
    password: "",
    confirmPassword: "",
    username: ""
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // ✅ Correct payload (with photo)
      const payload = {
        ...formData,
        photo_url: photoPreview
      };

      const res = await fetch("http://127.0.0.1:8000/api/v1/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created! Agent ID: " + data.agent_id);
        window.location.href = "/login";
      } else {
        alert(data.error || "Enrollment failed.");
      }
    } catch (err) {
      alert("Server error.");
    }
  };

  return (
    <div className="dkx-login-page" style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: "40px 0"
}}>   
      <div className="dkx-glass-card" style={{
  width: "950px",
  maxWidth: "95%",
  padding: "30px"
}}>

        <div className="dkx-header">
          <div className="dkx-status-badge">
            🔒 ENCRYPTION ACTIVE - SECURE
          </div>
          <h1 className="dkx-title">Dikoryx</h1>
          <div className="dkx-subtitle">AGENT SIGNUP PROTOCOL</div>
        </div>

        <form onSubmit={handleSignup}>
          <div className="dkx-main-grid" style={{
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "40px",
  alignItems: "start"
}}>

            {/* LEFT */}
            <div className="dkx-left-col">

              <div className="dkx-panel">
                <h3 className="dkx-panel-title">PERSONAL DATA</h3>

                <div className="dkx-form-row">
                  <input className="dkx-raw-input" name="name" placeholder="First Name" onChange={handleChange} required />
                  <input className="dkx-raw-input" name="surname" placeholder="Last Name" onChange={handleChange} required />
                </div>

                <div className="dkx-form-row">
                  <input className="dkx-raw-input" type="email" name="email" placeholder="Email" onChange={handleChange} required />
                  <input className="dkx-raw-input" name="department" placeholder="Department" onChange={handleChange} required />
                </div>

                <input
                  className="dkx-raw-input"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dkx-panel">
                <h3 className="dkx-panel-title">SECURITY</h3>

                <div className="dkx-form-row">
                  <input className="dkx-raw-input" type="password" name="password" placeholder="Password" onChange={handleChange} required />
                  <input className="dkx-raw-input" type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
                </div>

                <input className="dkx-raw-input" name="username" placeholder="Username" onChange={handleChange} required />
              </div>
            </div>

            {/* RIGHT */}
            <div className="dkx-right-col">
              <div className="dkx-panel dkx-biometric-panel">

                <h3 className="dkx-panel-title">BIOMETRIC</h3>

                <div className="dkx-hex-container">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                <input type="file" accept="image/*" onChange={handlePhotoUpload} />

              </div>
            </div>

          </div>

          <button className="dkx-btn-primary" type="submit">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="dkx-footer">
          Already registered? <a href="/login">Login</a>
        </div>

      </div>
    </div>
  );
}