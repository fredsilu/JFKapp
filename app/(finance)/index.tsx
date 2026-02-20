import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function FinanceHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Module Finance</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(finance)/maison/dashboard")}
      >
        <Text style={styles.buttonText}>🏠 Maison</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(finance)/crepolia/dashboard")}
      >
        <Text style={styles.buttonText}>🏢 Crepolia</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.groupButton]}
        onPress={() => router.push("/(finance)/groupe/dashboard")}
      >
        <Text style={styles.buttonText}>📊 Groupe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 40,
  },
  button: {
    width: 220,
    padding: 15,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  groupButton: {
    backgroundColor: "#9333ea",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});