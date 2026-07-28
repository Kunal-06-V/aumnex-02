"use client";

import { useState } from "react";

export default function RegisterModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Open Button */}
      <div className="text-center mt-6">
        <button
          onClick={() => setOpen(true)}
          className="text-blue-600 hover:underline"
        >
          Don't have an account? Register
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Student Registration
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="Full Name"
              className="w-full border rounded-xl p-3 mb-4"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-xl p-3 mb-4"
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="w-full border rounded-xl p-3 mb-4"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-xl p-3 mb-6"
            />

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            >
              Register
            </button>

          </div>

        </div>
      )}
    </>
  );
}