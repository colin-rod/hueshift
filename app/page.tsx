import { Suspense } from "react";
import ColorParser from "@/components/color-parser";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <ColorParser />
      </Suspense>
    </main>
  );
}
