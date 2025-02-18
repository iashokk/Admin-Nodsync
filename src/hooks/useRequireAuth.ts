import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function useRequireAuth() {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in if not authenticated
      router.push("/signin");
    }
  }, [user, loading, router]);

  return { user, loading, error };
}
