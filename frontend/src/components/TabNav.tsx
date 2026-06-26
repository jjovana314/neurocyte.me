type Tab = 'patients' | 'add-patient' | 'import-csv' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  role?: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'patients', label: 'Patients' },
  { id: 'add-patient', label: 'Add Patient' },
  { id: 'import-csv', label: 'Import CSV' },
  { id: 'profile', label: 'Profile' },
];

export default function TabNav({ active, onChange, role }: Props) {
  const hiddenForSupport = new Set(['add-patient', 'import-csv']);
  const visibleTabs =
    role === 'Support Engineer'
      ? TABS.filter((tab) => !hiddenForSupport.has(tab.id))
      : TABS;

  return (
    <nav className="tab-nav">
      {visibleTabs.map((tab) => (
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
