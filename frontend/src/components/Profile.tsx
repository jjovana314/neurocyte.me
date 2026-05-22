import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const expiresAt = new Date(user.exp * 1000).toLocaleString();

  return (
    <div className="form-container">
      <h3>Profile</h3>
      <table className="profile-table">
        <tbody>
          <tr>
            <td className="profile-label">Email</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td className="profile-label">Role</td>
            <td>{user.role.name}</td>
          </tr>
          <tr>
            <td className="profile-label">User ID</td>
            <td>{user.id}</td>
          </tr>
          <tr>
            <td className="profile-label">Session expires</td>
            <td>{expiresAt}</td>
          </tr>
        </tbody>
      </table>
      <button className="btn btn-danger" style={{ marginTop: 24 }} onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
