import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/user/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("lovely-notes-user", JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
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
          <span className="eyebrow">A little space for your thoughts</span>
          <h1>Make room for what matters.</h1>
          <p>Keep your ideas, plans, and little reminders all in one lovely place.</p>
        </div>
        <div className="showcase-note" aria-hidden="true">
          <span className="note-sparkle">✳</span>
          <p>“A quiet mind is a creative mind.”</p>
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
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your space</h2>
          <p className="auth-description">Your thoughts are right where you left them.</p>
          {location.state?.registered && (
            <p className="form-message form-success" role="status">
              Your account is ready. Sign in to get started.
            </p>
          )}

          <form className="auth-form" onSubmit={handleLogin}>
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <p className="form-message form-error" role="alert">{error}</p>}

            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing you in..." : "Sign in"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            New to Lovely Notes? <Link to="/register">Create an account</Link>
          </p>
          <p className="auth-footnote">A softer place to land your thoughts.</p>
        </div>
      </section>
    </main>
  );
}

export default Login;
