"use client";

import { useState } from "react";

import {
  Settings,
  Moon,
  Bell,
  Shield,
  Save,
} from "lucide-react";

export default function AdminSettings() {

  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  function handleSave() {
    toast.success("Settings saved successfully.");
  }

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Admin Settings
        </h1>

        <p className="text-gray-500 mt-2">
          Configure your ERP system preferences.
        </p>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex items-center gap-3 mb-6">

          <Settings className="text-blue-600" />

          <h2 className="text-2xl font-semibold">
            System Preferences
          </h2>

        </div>

        <div className="space-y-6">

          <div className="flex justify-between items-center border-b pb-4">

            <div className="flex items-center gap-3">
              <Moon className="text-indigo-600" />
              <div>
                <h3 className="font-semibold">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-500">
                  Enable dark theme for admin panel.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="w-5 h-5"
            />

          </div>

          <div className="flex justify-between items-center border-b pb-4">

            <div className="flex items-center gap-3">
              <Bell className="text-red-600" />
              <div>
                <h3 className="font-semibold">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive important system emails.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() =>
                setEmailNotifications(!emailNotifications)
              }
              className="w-5 h-5"
            />

          </div>

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-3">
              <Shield className="text-green-600" />
              <div>
                <h3 className="font-semibold">
                  Automatic Backup
                </h3>
                <p className="text-sm text-gray-500">
                  Backup Firestore data regularly.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={autoBackup}
              onChange={() =>
                setAutoBackup(!autoBackup)
              }
              className="w-5 h-5"
            />

          </div>

        </div>

      </div>
            <div className="bg-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-semibold mb-6">
          System Information
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <p className="text-gray-500 text-sm">
              Project Name
            </p>
            <p className="font-semibold">
              Smart NFC Student ID ERP
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Version
            </p>
            <p className="font-semibold">
              v1.0.0
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Database
            </p>
            <p className="font-semibold">
              Firebase Firestore
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Framework
            </p>
            <p className="font-semibold">
              Next.js + React
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Authentication
            </p>
            <p className="font-semibold">
              Firebase Authentication
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">
              Status
            </p>
            <p className="font-semibold text-green-600">
              ● System Online
            </p>
          </div>

        </div>

      </div>

      <div className="flex justify-end">

        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
        >
          <Save size={18} />
          Save Settings
        </button>

      </div>

    </div>

  );

}