"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";

import {
  Bell,
  Calendar,
  AlertCircle,
  BookOpen,
  IndianRupee,
  PartyPopper,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const q = query(
        collection(db, "notifications"),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function priorityColor(priority) {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-green-100 text-green-700";
    }
  }

  function typeIcon(type) {
    switch (type) {
      case "Exam":
        return <BookOpen size={18} />;
      case "Fees":
        return <IndianRupee size={18} />;
      case "Holiday":
        return <PartyPopper size={18} />;
      default:
        return <Bell size={18} />;
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

      <PageHeader
        title="Notifications"
        subtitle="Latest announcements from the college"
      />

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((item)=>(
            <div
              key={item}
              className="animate-pulse h-28 rounded-xl bg-gray-200"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow">
          <Bell
            size={48}
            className="mx-auto text-gray-400 mb-4"
          />
          <h2 className="text-xl font-semibold">
            No Notifications
          </h2>
          <p className="text-gray-500 mt-2">
            You're all caught up.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition"
            >
              <div className="flex justify-between flex-wrap gap-3">

                <div className="flex items-center gap-3">

                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    {typeIcon(item.type)}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {item.title}
                    </h2>

                    <div className="flex gap-2 mt-2 flex-wrap">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColor(item.priority)}`}
                      >
                        {item.priority}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        {item.type}
                      </span>

                    </div>
                  </div>

                </div>

                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={18}/>
                  {item.date}
                </div>

              </div>

              <p className="mt-5 text-gray-700 leading-relaxed">
                {item.message}
              </p>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}