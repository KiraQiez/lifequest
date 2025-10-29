import Card from "./Card";

function MetricCard({ label, value, highlight = false, className = "" }) {
  return (
    <Card className={`relative p-4 ${className}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </Card>
  );
}

export default MetricCard;