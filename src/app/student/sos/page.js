"use client";

import PageHeader from "@/components/PageHeader";
import {
  ShieldAlert,
  Ambulance,
  Phone,
  Flame,
  UserRound,
} from "lucide-react";

const contacts = [
  {
    title: "College Security",
    number: "+91 9876543210",
    icon: ShieldAlert,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Ambulance",
    number: "108",
    icon: Ambulance,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Police",
    number: "100",
    icon: ShieldAlert,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Fire Brigade",
    number: "101",
    icon: Flame,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Class Coordinator",
    number: "+91 9876501234",
    icon: UserRound,
    color: "bg-purple-100 text-purple-600",
  },
];

export default function SOSPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <PageHeader
        title="Emergency SOS"
        subtitle="Quick access to emergency contacts"
      />

      <div className="max-w-xl mx-auto">

        <a
          href="tel:+919876543210"
          className="block"
        >
          <div className="bg-red-600 hover:bg-red-700 transition rounded-3xl shadow-xl text-white text-center py-10 mb-10">

            <ShieldAlert
              size={70}
              className="mx-auto mb-4"
            />

            <h2 className="text-3xl font-bold">
              EMERGENCY SOS
            </h2>

            <p className="mt-3 opacity-90">
              Tap to call College Security
            </p>

          </div>
        </a>

        <div className="grid gap-5">

          {contacts.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.title}
                href={`tel:${item.number}`}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">

                  <div
                    className={`p-4 rounded-full ${item.color}`}
                  >
                    <Icon size={28} />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      {item.title}
                    </h3>

                    <p className="text-gray-500">
                      {item.number}
                    </p>
                  </div>

                </div>

                <Phone className="text-green-600" />

              </a>
            );
          })}

        </div>

      </div>

    </div>
  );
}