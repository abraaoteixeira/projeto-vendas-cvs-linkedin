"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaywallRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cvId = searchParams.get("cvId") || "";
    const status = searchParams.get("status") || "";
    if (status === "cancel") {
      router.replace(`/mockup?cvId=${cvId}&status=cancel`);
    } else {
      router.replace(`/mockup?cvId=${cvId}&openPaywall=true`);
    }
  }, [router, searchParams]);

  return (
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function PaywallRedirectPage() {
  return (
    <main className="min-h-screen bg-dark text-white flex items-center justify-center">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}>
        <PaywallRedirectContent />
      </Suspense>
    </main>
  );
}
