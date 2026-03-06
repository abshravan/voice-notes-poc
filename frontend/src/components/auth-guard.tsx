"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Public pages are always accessible
    if (PUBLIC_PATHS.includes(pathname)) {
      setAuthorized(true);
      return;
    }

    // Check session
    try {
      const session = sessionStorage.getItem("vm_session");
      if (session) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace("/login");
      }
    } catch {
      // sessionStorage unavailable (SSR, etc.) — redirect to login
      setAuthorized(false);
      router.replace("/login");
    }
  }, [pathname, router]);

  // Always render public pages immediately
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // For protected pages, show spinner until session is verified
  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
