import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      className="mx-3.5 items-center rounded-xl py-3.5 active:opacity-85"
      style={{ backgroundColor: "#FF6B35", opacity: disabled ? 0.5 : 1 }}
      disabled={disabled || loading}
      onPress={onPress}>
      {loading ? (
        <ActivityIndicator color="#0D0D0D" />
      ) : (
        <Text className="text-sm font-extrabold tracking-wide text-[#0D0D0D]">
          {icon ? `${icon} ` : ""}
          {label}
        </Text>
      )}
    </Pressable>
  );
}
