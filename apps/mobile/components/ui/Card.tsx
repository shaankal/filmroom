import type { ReactNode } from "react";
import { View } from "react-native";

export function Card({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={`mx-3.5 rounded-2xl border p-4 ${className}`}
      style={{
        backgroundColor: highlight ? "rgba(255,107,53,0.08)" : "#1E1E1E",
        borderColor: highlight ? "rgba(255,107,53,0.25)" : "#2A2A2A",
      }}>
      {children}
    </View>
  );
}
