import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";

import { StudentProvider } from "@/context/StudentContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AUMNEX",
  description: "Student Portal",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen">

        <ThemeProvider>

          <StudentProvider>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
              }}
            />

            {children}

          </StudentProvider>

        </ThemeProvider>

      </body>
    </html>
  );
}