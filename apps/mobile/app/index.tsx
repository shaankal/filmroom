import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth";

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated?.() ?? false
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated?.()) {
      setHydrated(true);
    }
    const unsub = useAuthStore.persist.onFinishHydration?.(() =>
      setHydrated(true)
    );
    return unsub;
  }, []);

  if (!hydrated) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
