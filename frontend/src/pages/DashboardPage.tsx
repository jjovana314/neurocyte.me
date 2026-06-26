import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabNav, { type Tab } from '../components/TabNav';
import PatientTable from '../components/PatientTable';
import AddPatientForm from '../components/AddPatientForm';
import ImportCsv from '../components/ImportCsv';
import Profile from '../components/Profile';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('patients');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <span className="topbar-title">Neurocyte</span>
        <div className="topbar-right">
          <span className="topbar-user">{user?.email}</span>
          <button className="btn btn-sm" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <TabNav active={activeTab} onChange={setActiveTab} role={user?.role?.name} />

      <main className="content">
        {activeTab === 'patients' && <PatientTable role={user?.role?.name} />}
        {activeTab === 'add-patient' && <AddPatientForm />}
        {activeTab === 'import-csv' && <ImportCsv />}
        {activeTab === 'profile' && <Profile />}
      </main>
    </div>
  );
}
