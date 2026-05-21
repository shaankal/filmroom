import { Text, View } from "react-native";

type Variant = "orange" | "green" | "blue" | "dim";

const styles: Record<Variant, { bg: string; text: string; border?: string }> = {
  orange: { bg: "rgba(255,107,53,0.15)", text: "#FF6B35", border: "rgba(255,107,53,0.35)" },
  green: { bg: "rgba(76,175,80,0.12)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
  blue: { bg: "rgba(33,150,243,0.12)", text: "#64B5F6", border: "rgba(33,150,243,0.3)" },
  dim: { bg: "#252525", text: "#888888" },
};

export function Badge({
  label,
  variant = "orange",
}: {
  label: string;
  variant?: Variant;
}) {
  const s = styles[variant];
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{
        backgroundColor: s.bg,
        borderWidth: s.border ? 1 : 0,
        borderColor: s.border,
      }}>
      <Text
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: s.text }}>
        {label}
      </Text>
    </View>
  );
}
