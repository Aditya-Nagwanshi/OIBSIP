export default function PageLoader({ label = 'Firing up the oven' }) {
  return (
    <div className="page-loader">
      <div className="page-loader__inner">
        <div className="spinner" />
        <p className="small muted">{label}…</p>
      </div>
    </div>
  );
}
