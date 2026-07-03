export default function DashboardCard({
  title,
  value,
  color = "text-black",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
      <p className="text-gray-500 text-sm uppercase tracking-wide">
        {title}
      </p>

      <h2 className={`text-4xl font-bold mt-4 ${color}`}>
        {value}
      </h2>
    </div>
  );
}