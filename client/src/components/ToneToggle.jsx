export default function ToneToggle({ tones, value, onChange, disabled }) {
  return (
    <div className="tone" role="radiogroup" aria-label="Response tone">
      {tones.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          className={value === t.id ? 'tone-opt on' : 'tone-opt'}
          title={t.description}
          disabled={disabled}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
