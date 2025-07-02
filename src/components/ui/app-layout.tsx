"use client";
import React from "react";
import { AppBar } from "@/components/ui/appbar";
import { NavBar } from "@/components/ui/navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar title={title} />
      <main className="pb-20 pt-4">{children}</main>
      <NavBar />
    </div>
  );
}
