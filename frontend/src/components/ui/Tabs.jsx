export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="app-tabs" aria-label="Sections">
      {tabs.map((tab) => (
        <button type="button" key={tab.key} aria-pressed={active === tab.key} onClick={() => onChange(tab.key)}>
          {tab.label}{tab.count != null && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
