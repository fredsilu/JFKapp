// app/(traiteur)/documents/index.tsx

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DocumentsHomeScreen() {
  const router = useRouter();

  const items = [
    {
      title: "Historique Factures",
      subtitle: "Factures créées dans l’app et factures historiques importées",
      route: "/(traiteur)/documents/invoices",
      icon: "🧾",
    },
    {
      title: "Historique Proformas",
      subtitle: "Proformas créées dans l’app et proformas historiques importées",
      route: "/(traiteur)/documents/proformas",
      icon: "📄",
    },
    {
      title: "Historique Avoirs",
      subtitle: "Avoirs créés dans l’app et avoirs historiques importés",
      route: "/(traiteur)/documents/credit-notes",
      icon: "↩️",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Documents</Text>
      <Text style={styles.subtitle}>
        Retrouvez les historiques complets des factures, proformas et avoirs.
      </Text>

      {items.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={styles.card}
          onPress={() => router.push(item.route as never)}
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>

          <View style={styles.textBox}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
  },
  textBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
});