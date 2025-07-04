"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth as useAuthContext } from "@/lib/contexts/auth-context";
import { useUserStore } from "@/lib/stores/user-store";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const userStore = useUserStore();
  const auth = useAuthContext();

  const useRequireAuth = (redirectTo?: string) => {
    useEffect(() => {
      // Se não está carregando e não está autenticado
      if (!auth.isLoading && !auth.isAuthenticated) {
        // Se não estiver na página inicial, redireciona
        if (pathname !== "/") {
          router.replace("/");
        }
      }
    }, [auth.isAuthenticated, auth.isLoading]);
  };

  return {
    ...auth,
    ...userStore,
    useRequireAuth,
  };
}

export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && pathname === "/") {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router, pathname]);
}
