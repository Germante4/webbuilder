import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import "../styles/LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login({
        email,
        password,
      });

      // Jei prisijungimas sėkmingas
      navigate("/dashboard");
    } catch (error) {
      setError("Neteisingas el. paštas arba slaptažodis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <section className="login-visual">

        <Link to="/" className="login-logo">
          WEBBUILDER<span>.</span>
        </Link>

        <div className="login-visual-content">

          <p className="login-visual-label">
            AI WEBSITE BUILDER
          </p>

          <h1>
            Tavo idėja.
            <br />
            Tavo skonis.
            <br />
            <em>Tavo svetainė.</em>
          </h1>

          <p className="login-visual-description">
            WebBuilder mokosi iš tavo atsakymų ir vizualinių
            pasirinkimų, kad prieš generuojant svetainę suprastų
            ne tik ko tau reikia, bet ir kas tau patinka.
          </p>

        </div>


        {/* DECORATIVE DESIGN PREVIEW */}
        <div className="login-preview">

          <div className="login-preview-card login-preview-main">

            <div className="login-preview-nav">
              <span>STUDIO</span>
              <span>MENU</span>
            </div>

            <div className="login-preview-body">

              <span className="login-preview-small">
                SELECTED DIRECTION
              </span>

              <h3>
                Your vision,
                <br />
                <em>refined.</em>
              </h3>

              <div className="login-preview-image">
                <div className="login-preview-shape" />
              </div>

            </div>

          </div>

          <div className="login-preview-tag">
            <span>✦</span>
            DESIGN DNA / 82%
          </div>

        </div>


        <div className="login-visual-footer">
          <span>YOUR VISION → AI → WEBSITE</span>
          <span>2026</span>
        </div>

      </section>


      {/* RIGHT SIDE */}
      <section className="login-form-side">

        <div className="login-mobile-header">
          <Link to="/" className="login-mobile-logo">
            WEBBUILDER<span>.</span>
          </Link>
        </div>


        <div className="login-form-wrapper">

          <div className="login-form-number">
            01 / LOGIN
          </div>


          <div className="login-form-heading">

            <p>SVEIKI SUGRĮŽĘ</p>

            <h2>
              Prisijunk prie
              <br />
              savo <em>projektų.</em>
            </h2>

            <span>
              Įvesk savo prisijungimo duomenis ir tęsk
              svetainių kūrimą.
            </span>

          </div>


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="login-field">

              <label htmlFor="email">
                El. paštas
              </label>

              <input
                id="email"
                type="email"
                placeholder="vardas@email.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            <div className="login-field">

              <div className="login-password-label">

                <label htmlFor="password">
                  Slaptažodis
                </label>

              </div>

              <input
                id="password"
                type="password"
                placeholder="Įveskite slaptažodį"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>


            {/* ERROR MESSAGE */}
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Jungiamasi..."
                  : "Prisijungti"}
              </span>

              <span className="login-submit-arrow">
                →
              </span>
            </button>

          </form>


          <div className="login-divider">
            <span />
            <p>NETURI PASKYROS?</p>
            <span />
          </div>


          <Link
            to="/register"
            className="login-register-link"
          >
            Sukurti naują paskyrą
            <span>↗</span>
          </Link>

        </div>


        <div className="login-side-footer">

          <Link to="/">
            ← Grįžti į pradžią
          </Link>

          <span>WEBBUILDER</span>

        </div>

      </section>

    </div>
  );
}

export default LoginPage;