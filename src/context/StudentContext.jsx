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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setStudent(null);
        setLoading(false);
        return;
      }

      try {
        const studentRef = doc(db, "students", user.uid);

const unsubscribeSnapshot = onSnapshot(
  studentRef,
  (studentSnap) => {

    if (studentSnap.exists()) {
      setStudent(studentSnap.data());
    } else {
      setStudent(null);
    }

    setLoading(false);

  },
  (error) => {
    console.error(error);
    setLoading(false);
  }
);

      } catch (error) {
        console.error(error);
      } 

    });

   return () => {
  unsubscribeSnapshot();
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