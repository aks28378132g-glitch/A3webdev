import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/user/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.removeItem("token");
      localStorage.removeItem("lovely-notes-user");
      navigate("/", { state: { registered: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Link className="brand brand-light" to="/">
          <span className="brand-mark">l</span>
          Lovely Notes
        </Link>
        <div className="showcase-copy">
          <span className="eyebrow">YOUR NEW FAVORITE CORNER</span>
          <h1>Little ideas deserve a lovely home.</h1>
          <p>Start collecting the thoughts you want to keep close.</p>
        </div>
        <div className="showcase-note" aria-hidden="true">
          <span className="note-sparkle">✳</span>
          <p>“Start where you are. Keep what inspires you.”</p>
          <span className="showcase-signature">A note to self</span>
        </div>
        <span className="showcase-decoration decoration-one" aria-hidden="true">✳</span>
        <span className="showcase-decoration decoration-two" aria-hidden="true">✦</span>
      </section>

      <section className="auth-content">
        <div className="auth-form-wrap">
          <div className="mobile-brand">
            <Link className="brand" to="/">
              <span className="brand-mark">l</span>
              Lovely Notes
            </Link>
          </div>
          <span className="eyebrow">A FRESH PAGE</span>
          <h2>Create your account</h2>
          <p className="auth-description">It only takes a moment to make this space yours.</p>

          <form className="auth-form" onSubmit={handleRegister}>
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="What should we call you?"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />

            {error && <p className="form-message form-error" role="alert">{error}</p>}

            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating your space..." : "Create account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
          <p className="auth-footnote">A softer place to land your thoughts.</p>
        </div>
      </section>
    </main>
  );
}

export default Register;
