import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const ROLES = ['Doctor', 'Support Engineer', 'admin'];

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, firstName, lastName, role);
      setAuth(response.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-info">
        <div className="login-logo">Neurocyte</div>
        <h1>Patient management for neurologists</h1>
        <p>
          Neurocyte is a secure, role-based platform that lets neurologists manage patient
          records, track medical and family histories of neurological conditions, and generate
          reports — all in one place.
        </p>
        <ul className="feature-list">
          <li>Maintain complete patient histories per doctor</li>
          <li>Record neurological disorders, medications, and diagnosis dates</li>
          <li>Track family history of conditions like Alzheimer, Parkinson, and Epilepsy</li>
          <li>Export records to CSV or PDF for reporting</li>
          <li>Import patient data in bulk via CSV</li>
        </ul>
      </div>

      <div className="login-forms">
        <div className="login-card">
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === 'login' ? ' mode-active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign in
            </button>
            <button
              className={`mode-btn${mode === 'register' ? ' mode-active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

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

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {mode === 'login' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
                <Link to="/forgot-password">Forgot password?</Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
