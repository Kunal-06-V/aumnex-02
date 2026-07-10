"use client";

import { useEffect, useState } from "react";

import {
  User,
  Mail,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function AdminProfile() {
  const admin = {
  name: "Administrator",
  email: "admin@aumnex.com",
  role: "System Administrator",
  department: "Administration",
};
const [lastLogin, setLastLogin] = useState("");

useEffect(() => {
  setLastLogin(new Date().toLocaleString());
}, []);
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Admin Profile
        </h1>

        <p className="text-gray-500 mt-2">
          Manage administrator information
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8">

        <div className="flex flex-col md:flex-row items-center gap-8">

          <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold">
            A
          </div>

          <div className="flex-1 space-y-4">

            <div className="flex items-center gap-3">
              <User className="text-blue-600" />
              <span className="font-medium">
                {admin.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-green-600" />
              <span>{admin.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="text-purple-600" />
              <span>{admin.role}</span>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="text-orange-600" />
              <span>{admin.department}</span>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Last Login
              </p>

              <p className="font-medium">
                {lastLogin}
              </p>
            </div>

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-xl font-bold mb-4">
          Account Status
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-green-100 text-green-700 rounded-xl p-4 text-center">
            <p className="font-semibold">Account</p>
            <p>Active</p>
          </div>

          <div className="bg-blue-100 text-blue-700 rounded-xl p-4 text-center">
            <p className="font-semibold">Role</p>
            <p>Administrator</p>
          </div>

          <div className="bg-purple-100 text-purple-700 rounded-xl p-4 text-center">
            <p className="font-semibold">Access</p>
            <p>Full Access</p>
          </div>

        </div>

      </div>

    </div>
  );
}