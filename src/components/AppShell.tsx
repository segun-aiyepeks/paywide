"use client";

import React, { useState } from "react";
import { SandboxBanner } from "./SandboxBanner";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { IntegrationInspector } from "./IntegrationInspector";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <SandboxBanner onOpenInspector={() => setIsInspectorOpen(true)} />
      <Header onOpenInspector={() => setIsInspectorOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      <Footer />

      <IntegrationInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
