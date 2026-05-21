import { Text } from "react-native";

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 px-3.5 text-[8px] font-semibold uppercase tracking-[1.5px] text-[#555555]">
      {children}
    </Text>
  );
}
