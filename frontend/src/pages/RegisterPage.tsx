
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { register } from "../services/authService";
import "../styles/RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Slaptažodžio reikalavimai
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-ZĄČĘĖĮŠŲŪŽ]/.test(password);
  const hasNumber = /\d/.test(password);

  const isPasswordValid =
    hasMinLength && hasUppercase && hasNumber;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Užpildykite visus laukus.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Slaptažodis neatitinka saugumo reikalavimų."
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Slaptažodžiai nesutampa.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      navigate("/login", {
        state: {
          message:
            "Paskyra sėkmingai sukurta! Dabar prisijunkite.",
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registracija nepavyko. Bandykite dar kartą."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* LEFT SIDE */}
      <section className="register-visual">

        <Link to="/" className="register-logo">
          WEBBUILDER<span>.</span>
        </Link>

        <div className="register-visual-content">

          <p className="register-visual-label">
            AI WEBSITE BUILDER
          </p>

          <h1>
            Tavo idėja.
            <br />
            Tavo skonis.
            <br />
            <em>Tavo svetainė.</em>
          </h1>

          <p className="register-visual-description">
            WebBuilder mokosi iš tavo atsakymų ir vizualinių
            pasirinkimų, kad prieš generuojant svetainę suprastų
            ne tik ko tau reikia, bet ir kas tau patinka.
          </p>

        </div>

        {/* DECORATIVE DESIGN PREVIEW */}
        <div className="register-preview">

          <div className="register-preview-card register-preview-main">

            <div className="register-preview-nav">
              <span>STUDIO</span>
              <span>MENU</span>
            </div>

            <div className="register-preview-body">

              <span className="register-preview-small">
                SELECTED DIRECTION
              </span>

              <h3>
                Your vision,
                <br />
                <em>refined.</em>
              </h3>

              <div className="register-preview-image">
                <div className="register-preview-shape" />
              </div>

            </div>

          </div>

          <div className="register-preview-tag">
            <span>✦</span>
            DESIGN DNA / 82%
          </div>

        </div>

        <div className="register-visual-footer">
          <span>YOUR VISION → AI → WEBSITE</span>
          <span>2026</span>
        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="register-form-side">

        <div className="register-mobile-header">
          <Link to="/" className="register-mobile-logo">
            WEBBUILDER<span>.</span>
          </Link>
        </div>

        <div className="register-form-wrapper">

          <div className="register-form-number">
            01 / REGISTER
          </div>

          <div className="register-form-heading">

            <p>PRADĖKIME</p>

            <h2>
              Sukurk savo
              <br />
              <em>paskyrą.</em>
            </h2>

            <span>
              Susikurk paskyrą ir pradėk formuoti savo
              svetainės viziją kartu su AI.
            </span>

          </div>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* VARDAS */}
            <div className="register-field">

              <label htmlFor="name">
                Vardas
              </label>

              <input
                id="name"
                type="text"
                placeholder="Tavo vardas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

            </div>

            {/* EL. PAŠTAS */}
            <div className="register-field">

              <label htmlFor="email">
                El. paštas
              </label>

              <input
                id="email"
                type="email"
                placeholder="vardas@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

            </div>

            {/* SLAPTAŽODIS */}
            <div className="register-field">

              <label htmlFor="password">
                Slaptažodis
              </label>

              <div className="register-password-wrapper">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sukurk slaptažodį"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Paslėpti slaptažodį"
                      : "Rodyti slaptažodį"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>

              </div>

              {/* SLAPTAŽODŽIO REIKALAVIMAI */}
              <div className="register-password-rules">

                <span className={hasMinLength ? "valid" : ""}>
                  {hasMinLength ? "✓" : "○"} Bent 8 simboliai
                </span>

                <span className={hasUppercase ? "valid" : ""}>
                  {hasUppercase ? "✓" : "○"} Bent viena didžioji raidė
                </span>

                <span className={hasNumber ? "valid" : ""}>
                  {hasNumber ? "✓" : "○"} Bent vienas skaičius
                </span>

              </div>

            </div>

            {/* PAKARTOTI SLAPTAŽODĮ */}
            <div className="register-field">

              <label htmlFor="confirmPassword">
                Pakartok slaptažodį
              </label>

              <div className="register-password-wrapper">

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Pakartok slaptažodį"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Paslėpti slaptažodį"
                      : "Rodyti slaptažodį"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>

              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={
                    passwordsMatch
                      ? "register-password-match valid"
                      : "register-password-match invalid"
                  }
                >
                  {passwordsMatch
                    ? "✓ Slaptažodžiai sutampa"
                    : "Slaptažodžiai nesutampa"}
                </p>
              )}

            </div>

            {/* KLAIDOS PRANEŠIMAS */}
            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            {/* REGISTRACIJOS MYGTUKAS */}
            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Kuriama paskyra..."
                  : "Sukurti paskyrą"}
              </span>

              <span className="register-submit-arrow">
                →
              </span>
            </button>

          </form>

          <div className="register-divider">
            <span />
            <p>JAU TURI PASKYRĄ?</p>
            <span />
          </div>

          <Link
            to="/login"
            className="register-login-link"
          >
            Prisijungti
            <span>↗</span>
          </Link>

        </div>

        <div className="register-side-footer">

          <Link to="/">
            ← Grįžti į pradžią
          </Link>

          <span>WEBBUILDER</span>

        </div>

      </section>

    </div>
  );
}

export default RegisterPage;
