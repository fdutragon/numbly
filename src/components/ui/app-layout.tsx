"use client";
import React from "react";
import { DarkAppBar } from "@/components/ui/dark-appbar";
import { NavBar } from "@/components/ui/navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <DarkAppBar title={title} />
      <main className="pb-20 pt-20">{children}</main>
      <NavBar />
    </div>
  );
}
