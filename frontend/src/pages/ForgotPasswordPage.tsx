import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-info">
        <div className="login-logo">Neurocyte</div>
        <h1>Patient management for neurologists</h1>
      </div>

      <div className="login-forms">
        <div className="login-card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Reset your password</h2>

          {submitted ? (
            <p style={{ marginBottom: '1rem' }}>
              If that email is registered, you will receive a reset link shortly. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? '…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
