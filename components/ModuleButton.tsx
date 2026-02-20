import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function ModuleButton() {
  const router = useRouter();
  const pathname = usePathname();

  // On n'affiche pas le bouton sur la page d'accueil
  if (pathname === "/") return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => router.replace("/modules")}
    >
      <Text style={styles.text}>🏠 Modules</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});