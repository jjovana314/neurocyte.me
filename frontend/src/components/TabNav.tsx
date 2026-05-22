type Tab = 'patients' | 'add-patient' | 'import-csv' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'patients', label: 'Patients' },
  { id: 'add-patient', label: 'Add Patient' },
  { id: 'import-csv', label: 'Import CSV' },
  { id: 'profile', label: 'Profile' },
];

export default function TabNav({ active, onChange }: Props) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab${active === tab.id ? ' tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export type { Tab };
