"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import {
  Search,
  RefreshCw,
  GraduationCap,
  Shield,
  Users,
  CheckCircle2,
  Clock3,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Filter,
  ChevronDown,
} from "lucide-react";

import toast from "react-hot-toast";

import { db } from "@/lib/firebase";

export default function AccessRequestsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [processingId, setProcessingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [activeSection, setActiveSection] =
    useState("requests");

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        studentSnapshot,
        adminSnapshot,
      ] = await Promise.all([
        getDocs(
          collection(
            db,
            "students"
          )
        ),

        getDocs(
          collection(
            db,
            "admin"
          )
        ),
      ]);

      const loadedStudents =
        studentSnapshot.docs
          .map((studentDoc) => ({
            documentId:
              studentDoc.id,

            uid:
              studentDoc.data()?.uid ||
              studentDoc.id,

            ...studentDoc.data(),

            accountType:
              "Student",
          }))
          .sort((a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
          );

      const loadedAdmins =
        adminSnapshot.docs
          .map((adminDoc) => ({
            documentId:
              adminDoc.id,

            uid:
              adminDoc.data()?.uid ||
              adminDoc.id,

            ...adminDoc.data(),

            accountType:
              "Admin",
          }))
          .sort((a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
          );

      setStudents(
        loadedStudents
      );

      setAdmins(
        loadedAdmins
      );
    } catch (error) {
      console.error(
        "ACCESS MANAGEMENT LOAD ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to load account data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ============================================================
  // COUNTS
  // ============================================================

  const studentCounts =
    useMemo(() => {
      return {
        total:
          students.length,

        active:
          students.filter(
            (item) =>
              item.status === "Active"
          ).length,

        pending:
          students.filter(
            (item) =>
              item.status === "Pending"
          ).length,

        inactive:
          students.filter(
            (item) =>
              item.status === "Inactive"
          ).length,
      };
    }, [students]);

  const adminCounts =
    useMemo(() => {
      return {
        total:
          admins.length,

        active:
          admins.filter(
            (item) =>
              item.status === "Active"
          ).length,

        pending:
          admins.filter(
            (item) =>
              item.status === "Pending"
          ).length,

        inactive:
          admins.filter(
            (item) =>
              item.status === "Inactive"
          ).length,
      };
    }, [admins]);

  const pendingStudents =
    useMemo(
      () =>
        students.filter(
          (item) =>
            item.status === "Pending"
        ),
      [students]
    );

  const pendingAdmins =
    useMemo(
      () =>
        admins.filter(
          (item) =>
            item.status === "Pending"
        ),
      [admins]
    );

  // ============================================================
  // COMBINED DIRECTORY
  // ============================================================

  const directory =
    useMemo(() => {
      return [
        ...students,
        ...admins,
      ].sort((a, b) =>
        String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          )
        )
      );
    }, [students, admins]);

  // ============================================================
  // DIRECTORY FILTER
  // ============================================================

  const filteredDirectory =
    useMemo(() => {
      const text =
        search.trim().toLowerCase();

      return directory.filter(
        (account) => {
          const searchableFields = [
            account.name,
            account.email,
            account.phone,
            account.rollNo,
            account.prn,
            account.department,
            account.semester,
            account.division,
            account.role,
            account.uid,
            account.documentId,
          ];

          const matchesSearch =
            !text ||
            searchableFields.some(
              (field) =>
                String(
                  field || ""
                )
                  .toLowerCase()
                  .includes(text)
            );

          const matchesRole =
            roleFilter === "All" ||
            account.accountType ===
              roleFilter;

          const matchesStatus =
            statusFilter === "All" ||
            account.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        }
      );
    }, [
      directory,
      search,
      roleFilter,
      statusFilter,
    ]);

  // ============================================================
  // STATUS UPDATE
  // ============================================================

  async function updateAccountStatus(
    account,
    nextStatus
  ) {
    const uid =
      account.uid ||
      account.documentId;

    const processingKey =
      `${account.accountType}-${uid}`;

    try {
      setProcessingId(
        processingKey
      );

      const now =
        new Date().toISOString();

      // --------------------------------------------------------
      // STUDENT
      // --------------------------------------------------------

      if (
        account.accountType ===
        "Student"
      ) {
        await setDoc(
          doc(
            db,
            "students",
            account.documentId
          ),
          {
            status:
              nextStatus,

            updatedAt:
              now,
          },
          {
            merge: true,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            uid
          ),
          {
            uid,
            name:
              account.name || "",

            email:
              account.email || "",

            phone:
              account.phone || "",

            role:
              "student",

            status:
              nextStatus,

            updatedAt:
              now,
          },
          {
            merge: true,
          }
        );
      }

      // --------------------------------------------------------
      // ADMIN
      // --------------------------------------------------------

      if (
        account.accountType ===
        "Admin"
      ) {
        await setDoc(
          doc(
            db,
            "admin",
            account.documentId
          ),
          {
            status:
              nextStatus,

            updatedAt:
              now,
          },
          {
            merge: true,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            uid
          ),
          {
            uid,

            name:
              account.name || "",

            email:
              account.email || "",

            phone:
              account.phone || "",

            role:
              "admin",

            status:
              nextStatus,

            updatedAt:
              now,
          },
          {
            merge: true,
          }
        );
      }

      // --------------------------------------------------------
      // MESSAGE
      // --------------------------------------------------------

      if (
        nextStatus ===
        "Active"
      ) {
        toast.success(
          `${account.name || account.accountType} is now active.`
        );
      }

      if (
        nextStatus ===
        "Inactive"
      ) {
        toast.success(
          `${account.name || account.accountType} has been deactivated.`
        );
      }

      await loadUsers(true);
    } catch (error) {
      console.error(
        "ACCOUNT STATUS UPDATE ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to update account status."
      );
    } finally {
      setProcessingId("");
    }
  }

  // ============================================================
  // STATUS BADGE
  // ============================================================

  function StatusBadge({
    status,
  }) {
    if (
      status ===
      "Active"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2
            size={13}
          />
          Active
        </span>
      );
    }

    if (
      status ===
      "Inactive"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <UserX
            size={13}
          />
          Inactive
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock3
          size={13}
        />
        Pending
      </span>
    );
  }

  // ============================================================
  // ACTION BUTTON
  // ============================================================

  function AccountAction({
    account,
  }) {
    const processing =
      processingId ===
      `${account.accountType}-${account.uid}`;

    if (
      account.status ===
      "Pending"
    ) {
      return (
        <div className="flex gap-2">

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              updateAccountStatus(
                account,
                "Active"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <CheckCircle2
              size={15}
            />
            Approve
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              updateAccountStatus(
                account,
                "Inactive"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <UserX
              size={15}
            />
            Reject
          </button>

        </div>
      );
    }

    if (
      account.status ===
      "Active"
    ) {
      return (
        <button
          type="button"
          disabled={processing}
          onClick={() => {
            const confirmed =
              window.confirm(
                `Deactivate ${account.name || account.accountType}?`
              );

            if (!confirmed) {
              return;
            }

            updateAccountStatus(
              account,
              "Inactive"
            );
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserX
            size={15}
          />
          Deactivate
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled={processing}
        onClick={() =>
          updateAccountStatus(
            account,
            "Active"
          )
        }
        className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserCheck
          size={15}
        />
        Reactivate
      </button>
    );
  }

  // ============================================================
  // REQUEST CARD
  // ============================================================

  function RequestCard({
    account,
  }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                account.accountType ===
                "Student"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {account.accountType ===
              "Student" ? (
                <GraduationCap
                  size={22}
                />
              ) : (
                <Shield
                  size={22}
                />
              )}
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="font-bold">
                  {account.name ||
                    "Unnamed account"}
                </h3>

                <StatusBadge
                  status={
                    account.status
                  }
                />

              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">

                <div className="flex items-center gap-2">
                  <Mail
                    size={15}
                  />
                  {account.email ||
                    "No email"}
                </div>

                <div className="flex items-center gap-2">
                  <Phone
                    size={15}
                  />
                  {account.phone ||
                    "No phone"}
                </div>

                {account.accountType ===
                  "Student" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Building2
                        size={15}
                      />
                      {account.department ||
                        "Department not assigned"}
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen
                        size={15}
                      />
                      {account.semester ||
                        "Semester not assigned"}
                    </div>
                  </>
                )}

                {account.accountType ===
                  "Admin" && (
                  <div className="flex items-center gap-2">
                    <Shield
                      size={15}
                    />
                    Requested role:{" "}
                    {account.role ||
                      "Admin"}
                  </div>
                )}

              </div>

            </div>

          </div>

          <AccountAction
            account={account}
          />

        </div>

      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">

        <div className="flex items-center gap-3 text-gray-500">

          <RefreshCw
            size={20}
            className="animate-spin"
          />

          Loading account management...

        </div>

      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-7">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">
              <Users
                size={26}
                className="text-blue-600"
              />
            </div>

            <div>

              <h1 className="text-3xl font-bold">
                Account & Access Management
              </h1>

              <p className="mt-1 text-gray-500">
                Manage student and administrator accounts from one place.
              </p>

            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            loadUsers(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ======================================================= */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL STUDENTS */}

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Students
              </p>

              <p className="mt-2 text-3xl font-bold">
                {studentCounts.total}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {studentCounts.active} active ·{" "}
                {studentCounts.pending} pending ·{" "}
                {studentCounts.inactive} inactive
              </p>

            </div>

            <div className="rounded-xl bg-blue-100 p-3">
              <GraduationCap
                size={23}
                className="text-blue-600"
              />
            </div>

          </div>

        </div>

        {/* TOTAL ADMINS */}

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Administrators
              </p>

              <p className="mt-2 text-3xl font-bold">
                {adminCounts.total}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {adminCounts.active} active ·{" "}
                {adminCounts.pending} pending ·{" "}
                {adminCounts.inactive} inactive
              </p>

            </div>

            <div className="rounded-xl bg-purple-100 p-3">
              <Shield
                size={23}
                className="text-purple-600"
              />
            </div>

          </div>

        </div>

        {/* PENDING */}

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Pending Requests
              </p>

              <p className="mt-2 text-3xl font-bold">
                {pendingStudents.length +
                  pendingAdmins.length}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {pendingStudents.length} student ·{" "}
                {pendingAdmins.length} admin
              </p>

            </div>

            <div className="rounded-xl bg-amber-100 p-3">
              <Clock3
                size={23}
                className="text-amber-600"
              />
            </div>

          </div>

        </div>

        {/* TOTAL ACCOUNTS */}

        <div className="rounded-2xl bg-white p-6 shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Accounts
              </p>

              <p className="mt-2 text-3xl font-bold">
                {studentCounts.total +
                  adminCounts.total}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Students + Administrators
              </p>

            </div>

            <div className="rounded-xl bg-green-100 p-3">
              <Users
                size={23}
                className="text-green-600"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          TABS
      ======================================================= */}

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-md">

        <button
          type="button"
          onClick={() =>
            setActiveSection(
              "requests"
            )
          }
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeSection ===
            "requests"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pending Requests
          {pendingStudents.length +
            pendingAdmins.length >
            0 && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5">
              {pendingStudents.length +
                pendingAdmins.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveSection(
              "directory"
            )
          }
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeSection ===
            "directory"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          User Directory
        </button>

      </div>

      {/* ======================================================
          PENDING REQUESTS
      ======================================================= */}

      {activeSection ===
        "requests" && (
        <div className="space-y-7">

          {/* STUDENTS */}

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="mb-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-blue-100 p-3">
                  <GraduationCap
                    size={22}
                    className="text-blue-600"
                  />
                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Student Requests
                  </h2>

                  <p className="text-sm text-gray-500">
                    New student accounts waiting for approval.
                  </p>

                </div>

              </div>

            </div>

            {pendingStudents.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                No pending student requests.
              </div>
            ) : (
              <div className="space-y-4">

                {pendingStudents.map(
                  (student) => (
                    <RequestCard
                      key={
                        student.documentId
                      }
                      account={
                        student
                      }
                    />
                  )
                )}

              </div>
            )}

          </div>

          {/* ADMINS */}

          <div className="rounded-2xl bg-white p-6 shadow-md">

            <div className="mb-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-purple-100 p-3">
                  <Shield
                    size={22}
                    className="text-purple-600"
                  />
                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Administrator Requests
                  </h2>

                  <p className="text-sm text-gray-500">
                    New administrator accounts waiting for approval.
                  </p>

                </div>

              </div>

            </div>

            {pendingAdmins.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                No pending administrator requests.
              </div>
            ) : (
              <div className="space-y-4">

                {pendingAdmins.map(
                  (admin) => (
                    <RequestCard
                      key={
                        admin.documentId
                      }
                      account={
                        admin
                      }
                    />
                  )
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          DIRECTORY
      ======================================================= */}

      {activeSection ===
        "directory" && (
        <div className="space-y-5">

          {/* FILTER BAR */}

          <div className="rounded-2xl bg-white p-5 shadow-md">

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

              {/* SEARCH */}

              <div className="relative lg:col-span-2">

                <Search
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search name, email, roll no, PRN..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* ROLE */}

              <div className="relative">

                <Filter
                  size={17}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <select
                  value={
                    roleFilter
                  }
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-9"
                >

                  <option value="All">
                    All Roles
                  </option>

                  <option value="Student">
                    Students
                  </option>

                  <option value="Admin">
                    Administrators
                  </option>

                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-3.5 text-gray-400"
                />

              </div>

              {/* STATUS */}

              <div className="relative">

                <Filter
                  size={17}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-9"
                >

                  <option value="All">
                    All Statuses
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-3.5 text-gray-400"
                />

              </div>

            </div>

          </div>

          {/* DIRECTORY TABLE */}

          <div className="rounded-2xl bg-white p-5 shadow-md">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  User Directory
                </h2>

                <p className="text-sm text-gray-500">
                  {filteredDirectory.length} account
                  {filteredDirectory.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  shown
                </p>

              </div>

            </div>

            {filteredDirectory.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No accounts match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-275">

                  <thead className="bg-gray-100">

                    <tr>

                      <th className="p-4 text-left">
                        Account
                      </th>

                      <th className="p-4 text-left">
                        Role
                      </th>

                      <th className="p-4 text-left">
                        Academic / Details
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                      <th className="p-4 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredDirectory.map(
                      (account) => {
                        const processing =
                          processingId ===
                          `${account.accountType}-${account.uid}`;

                        return (
                          <tr
                            key={`${account.accountType}-${account.documentId}`}
                            className="border-b hover:bg-gray-50"
                          >

                            {/* ACCOUNT */}

                            <td className="p-4">

                              <div className="flex items-center gap-3">

                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                    account.accountType ===
                                    "Student"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {account.accountType ===
                                  "Student" ? (
                                    <GraduationCap
                                      size={18}
                                    />
                                  ) : (
                                    <Shield
                                      size={18}
                                    />
                                  )}
                                </div>

                                <div>

                                  <p className="font-semibold">
                                    {account.name ||
                                      "Unnamed"}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {account.email ||
                                      "No email"}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* ROLE */}

                            <td className="p-4">

                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                  account.accountType ===
                                  "Student"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {account.accountType ===
                                "Student" ? (
                                  <GraduationCap
                                    size={13}
                                  />
                                ) : (
                                  <Shield
                                    size={13}
                                  />
                                )}

                                {account.accountType}
                              </span>

                            </td>

                            {/* DETAILS */}

                            <td className="p-4">

                              {account.accountType ===
                              "Student" ? (
                                <div className="space-y-1 text-sm">

                                  <p>
                                    {account.department ||
                                      "Department —"}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {account.semester ||
                                      "Semester —"}
                                    {" · "}
                                    {account.division ||
                                      "Division —"}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    Roll:{" "}
                                    {account.rollNo ||
                                      "—"}
                                  </p>

                                </div>
                              ) : (
                                <div className="space-y-1 text-sm">

                                  <p>
                                    {account.role ||
                                      "Admin"}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {account.phone ||
                                      "No phone"}
                                  </p>

                                </div>
                              )}

                            </td>

                            {/* STATUS */}

                            <td className="p-4">

                              <StatusBadge
                                status={
                                  account.status ||
                                  "Pending"
                                }
                              />

                            </td>

                            {/* ACTION */}

                            <td className="p-4 text-right">

                              <div className="flex justify-end">

                                {processing ? (
                                  <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
                                    <RefreshCw
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Updating...
                                  </span>
                                ) : (
                                  <AccountAction
                                    account={
                                      account
                                    }
                                  />
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          SECURITY NOTE
      ======================================================= */}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">

        <div className="flex items-start gap-3">

          <Shield
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-semibold">
              Account lifecycle
            </p>

            <p className="mt-1 leading-6">
              New accounts start as Pending.
              Approved accounts become Active.
              Deactivated accounts become Inactive
              and can be reactivated later. Permanent
              deletion is intentionally not available
              from this management screen.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}