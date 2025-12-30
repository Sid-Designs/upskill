import type { Metadata } from "next";
import "./globals.css";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";


// Using system fonts to avoid network fetch during build

export const metadata: Metadata = {
  title: "UpSkill | AI Powered Career Assistant",
  description: "Designed & Created By Siddhesh Mhaskar",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
