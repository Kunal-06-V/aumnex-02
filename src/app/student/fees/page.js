"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  IndianRupee,
  CreditCard,
  Wallet,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { db } from "@/lib/firebase";

export default function StudentFees() {
  const router = useRouter();
  const [feeData, setFeeData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    try {
      setLoading(true);

      const feeRef = doc(db, "fees", "student001");
      const feeSnap = await getDoc(feeRef);

      if (!feeSnap.exists()) {
        setFeeData(null);
        setPayments([]);
        return;
      }

     const data = feeSnap.data();

const total = Number(data.totalFees || 0);
const paid = Number(data.paidFees || 0);

data.percentagePaid =
  total > 0 ? Math.round((paid / total) * 100) : 0;

setFeeData(data);

      const paymentsRef = collection(
        db,
        "fees",
        "student001",
        "payments"
      );

      const paymentSnap = await getDocs(paymentsRef);

      const paymentList = paymentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPayments(paymentList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-300 rounded w-60" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map((i)=>(
              <div
                key={i}
                className="bg-white rounded-2xl shadow h-40"
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl h-96 shadow" />
        </div>
      </div>
    );
  }

  if (!feeData) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg">
          <AlertTriangle
            className="mx-auto text-yellow-500 mb-4"
            size={55}
          />

          <h1 className="text-3xl font-bold mb-3">
            Fees Not Available
          </h1>

          <p className="text-gray-600">
            Fee details have not been uploaded by the
            administration.
          </p>
        </div>
      </div>
    );
  }

 return (
  <div className="space-y-8">

    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
    >
      <ArrowLeft size={20} />
      Back
    </button>

    <div className="flex items-center justify-between mb-8">
        
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Student Fees
          </h1>

          <p className="text-gray-500 mt-2">
            Track your fee payments and payment history
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Total Fees
              </p>

              <h2 className="text-3xl font-bold mt-3">
                ₹{feeData.totalFees?.toLocaleString()}
              </h2>

            </div>

            <div className="bg-blue-100 p-4 rounded-xl">
              <IndianRupee
                className="text-blue-600"
                size={30}
              />
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Paid Fees
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-3">
                ₹{feeData.paidFees?.toLocaleString()}
              </h2>

            </div>

            <div className="bg-green-100 p-4 rounded-xl">
              <Wallet
                className="text-green-600"
                size={30}
              />
            </div>

          </div>

        </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Pending Fees
              </p>

              <h2 className="text-3xl font-bold text-red-600 mt-3">
                ₹{feeData.pendingFees?.toLocaleString()}
              </h2>

            </div>

            <div className="bg-red-100 p-4 rounded-xl">
              <CreditCard
                className="text-red-600"
                size={30}
              />
            </div>

          </div>

        </div>

       <div className="bg-white rounded-2xl shadow-lg p-6">
  <div className="flex items-center justify-between">

    <div>
      <p className="text-gray-500">
        Due Date
      </p>

      <h2 className="text-2xl font-bold text-orange-600 mt-3">
        {feeData.dueDate || "15 Aug 2026"}
      </h2>

    </div>

    <div className="bg-orange-100 p-4 rounded-xl">
      <AlertTriangle
        className="text-orange-600"
        size={30}
      />
    </div>

  </div>
</div>

      </div>

      {/* Progress */}

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

  <div className="flex justify-between mb-4">

    <h2 className="text-xl font-semibold">
      Payment Progress
    </h2>

    <span className="font-bold text-blue-600">
      {feeData.percentagePaid}%
    </span>

  </div>

  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

    <div
      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
      style={{
        width: `${feeData.percentagePaid}%`,
      }}
    />

  </div>

  {/* Payment Status */}
  <div className="mt-6 flex items-center justify-between border-t pt-4">

    <span className="text-gray-600 font-medium">
      Payment Status
    </span>

    <span
      className={`px-4 py-2 rounded-full text-sm font-semibold ${
        feeData.status === "Paid"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {feeData.status}
    </span>

  </div>

</div>

      {/* Payment History */}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        <div className="p-6 border-b">

          <h2 className="text-2xl font-semibold">
            Payment History
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-800 text-white">

              <tr>

                <th className="p-4 text-left">
                  Receipt No
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-center">
                  Amount
                </th>

                <th className="p-4 text-center">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {payments.length === 0 ? (

                <tr>

                  <td
                    colSpan={4}
                    className="text-center p-10 text-gray-500"
                  >
                    No Payment History Found
                  </td>

                </tr>

              ) : (

                payments.map((payment) => (

                  <tr
                    key={payment.id}
                    className="border-b hover:bg-gray-50 transition"
                  >

                    <td className="p-4 font-medium">
                      {payment.receiptNo}
                    </td>

                    <td className="p-4">
                      {payment.date}
                    </td>

                    <td className="p-4 text-center font-semibold">
                      ₹{payment.amount?.toLocaleString()}
                    </td>

                    <td className="p-4 text-center">

                      <span className="px-4 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        {payment.status}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}