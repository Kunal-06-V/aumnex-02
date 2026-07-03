"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 w-full">
      <Search size={20} className="text-gray-500" />

      <input
        type="text"
        placeholder="Search..."
        className="ml-3 bg-transparent outline-none w-full"
      />
    </div>
  );
}