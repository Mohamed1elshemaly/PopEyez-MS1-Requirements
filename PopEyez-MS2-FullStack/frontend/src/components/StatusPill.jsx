export default function StatusPill({ value }) {
  const normalized = String(value || '').toLowerCase().replaceAll(' ', '-');
  return <span className={`pill ${normalized}`}>{value}</span>;
}
