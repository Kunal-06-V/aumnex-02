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

     <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h1>

     <p className="mt-2 text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}