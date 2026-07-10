"use client";

import {
  HelpCircle,
  Mail,
  Phone,
  GraduationCap,
  Code,
  BadgeInfo,
} from "lucide-react";

export default function AdminHelp() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Help & Support
        </h1>

        <p className="text-gray-500 mt-2">
          Information about the project and support.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="text-blue-600" />
          <h2 className="text-2xl font-semibold">
            Project Information
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="flex items-center gap-3">
            <GraduationCap className="text-green-600" />
            <div>
              <p className="text-gray-500 text-sm">Project</p>
              <p className="font-semibold">
                Smart NFC Student ID ERP System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Code className="text-purple-600" />
            <div>
              <p className="text-gray-500 text-sm">Version</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="text-red-600" />
            <div>
              <p className="text-gray-500 text-sm">Support Email</p>
              <p className="font-semibold">
                admin@aumnex.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="text-blue-600" />
            <div>
              <p className="text-gray-500 text-sm">Support</p>
              <p className="font-semibold">
                Monday - Friday (9 AM - 5 PM)
              </p>
            </div>
          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">

        <div className="flex items-center gap-3 mb-6">
          <BadgeInfo className="text-orange-600" />
          <h2 className="text-2xl font-semibold">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">

          <div className="border rounded-xl p-4">
            <h3 className="font-semibold">
              How do I add a new student?
            </h3>
            <p className="text-gray-600 mt-2">
              Go to Admin → Students and click "Add Student".
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <h3 className="font-semibold">
              How do I update attendance?
            </h3>
            <p className="text-gray-600 mt-2">
              Open the Attendance module, edit the record, and save it.
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <h3 className="font-semibold">
              How are student records updated?
            </h3>
            <p className="text-gray-600 mt-2">
              All changes are stored in Firebase Firestore and are immediately visible to the student portal.
            </p>
          </div>

        </div>

      </div>

      <div className="bg-blue-600 text-white rounded-2xl shadow-md p-6">

        <h2 className="text-2xl font-bold mb-3">
          About This Project
        </h2>

        <p>
          This ERP system provides student management, attendance,
          fees, timetable, results, notifications, reports, and
          administration features using Next.js and Firebase.
        </p>

      </div>

    </div>
  );
}