import { Stack } from "expo-router";
import { CrowdnessProvider } from "../context/CrowdnessContext";

export default function RootLayout() {
  return (
    <CrowdnessProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CrowdnessProvider>
  );
}
