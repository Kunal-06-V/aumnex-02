export default function ProfileCard({ student }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
          {student?.name?.charAt(0) || "S"}
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {student?.name || "Loading..."}
          </h2>

          <p className="text-gray-500">
            {student?.department}
          </p>

          <p className="text-sm text-gray-400">
            Roll No: {student?.rollNo}
          </p>
        </div>
      </div>
    </div>
  );
}