import React, { useEffect } from "react";
import { useRouter } from "expo-router";

// Signup is no longer needed with Magic SDK - redirect to signin
export default function SignUpScreen() {
  const router = useRouter();

  // Redirect to signin on mount
  useEffect(() => {
    router.replace("/onboarding/signin" as any);
  }, []);

  return null; // Return null since we're redirecting
}

