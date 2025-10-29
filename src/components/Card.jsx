export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/70 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}