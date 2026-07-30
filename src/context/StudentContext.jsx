"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const StudentContext = createContext();

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 ADD useEffect HERE

  useEffect(() => {
  let unsubscribeSnapshot = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (!user) {
      setStudent(null);
      setLoading(false);
      return;
    }

    const studentRef = doc(db, "students", user.uid);
    console.log("Firebase User:", user.email, user.uid);

    unsubscribeSnapshot = onSnapshot(
  studentRef,
  (studentSnap) => {

    console.log("Document Exists:", studentSnap.exists());

    if (studentSnap.exists()) {

      console.log("Student Data:", studentSnap.data());

      setStudent({
        uid: user.uid,
        ...studentSnap.data(),
      });

    } else {

      console.log("Student profile not found");

      setStudent(null);
    }

    setLoading(false);
  },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
  });

  return () => {
    unsubscribeAuth();

    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}, []);

  //  // Provider Start here 
  return (
    <StudentContext.Provider
      value={{
        student,
        setStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}