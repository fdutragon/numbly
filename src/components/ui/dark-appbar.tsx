"use client";
import React from "react";

interface DarkAppBarProps {
  title: string;
  backHref?: string;
}

export function DarkAppBar({ title, backHref }: DarkAppBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-neutral-900 border-b border-neutral-800 px-4 py-3 z-50 backdrop-blur-md shadow-none">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          {backHref && (
            <a
              href={backHref}
              className="text-purple-500 hover:text-neutral-100 text-sm font-medium transition-colors"
            >
              Voltar
            </a>
          )}
          <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
