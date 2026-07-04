"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
}) {
  const router = useRouter();

  return (
    <div className="mb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mb-4 font-medium"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <h1 className="text-4xl font-bold text-slate-800">
        {title}
      </h1>

      <p className="text-gray-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}