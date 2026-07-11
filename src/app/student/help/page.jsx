"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Phone,
  BookOpen,
  MessageCircle,
} from "lucide-react";

export default function StudentHelp() {
  const router = useRouter();
    return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-4xl mx-auto">

        {/* Header */}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-5"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-4">

            <div className="bg-blue-100 p-4 rounded-full">
              <HelpCircle
                size={40}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Help & Support
              </h1>

              <p className="text-gray-500 mt-2">
                We're here to help you with AUMNex
              </p>
            </div>

          </div>

        </div>

        {/* FAQ */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

          <h2 className="text-2xl font-bold mb-5">
            Frequently Asked Questions
          </h2>

          <div className="space-y-5">

            <div className="border-b pb-4">
              <h3 className="font-semibold">
                How do I mark attendance?
              </h3>
              <p className="text-gray-600 mt-2">
                Attendance is marked by the teacher using the NFC Reader.
                Students only need to tap their NFC ID card.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold">
                How can I check my attendance?
              </h3>
              <p className="text-gray-600 mt-2">
                Open the Attendance page from the sidebar to view your
                attendance percentage and history.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold">
                What should I do if attendance is missing?
              </h3>
              <p className="text-gray-600 mt-2">
                Contact your faculty member or the college administrator.
              </p>
            </div>

          </div>

        </div>

        {/* Contact */}

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-xl font-bold mb-5">
              Contact
            </h2>

            <div className="space-y-5">

              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Email
                  </p>
                  <p className="font-semibold">
                    support@aumnex.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">
                    Phone
                  </p>
                  <p className="font-semibold">
                    +91 98765 43210
                  </p>
                </div>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-xl font-bold mb-5">
              About AUMNex
            </h2>

            <div className="space-y-4">

              <div className="flex items-center gap-3">
                <BookOpen className="text-purple-600" />
                <span>
                  Smart NFC Student Management System
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle className="text-orange-600" />
                <span>
                  Version 1.0
                </span>
              </div>

              <p className="text-gray-600 mt-4">
                AUMNex helps manage attendance, results, fees,
                notifications, and student information through one
                integrated platform.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}