import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ModuleSelector() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>JFKApp</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(traiteur)")}
      >
        <Text style={styles.buttonText}>🍽 Traiteur</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.financeButton]}
        onPress={() => router.replace("/(finance)")}
      >
        <Text style={styles.buttonText}>💰 Finance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 40,
  },
  button: {
    width: 220,
    padding: 15,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  financeButton: {
    backgroundColor: "#16a34a",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});