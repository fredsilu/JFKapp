import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SalesHome() {
  const router = useRouter();

  const items = [
    {
      title: "Simulations",
      subtitle: "Créer et consulter les simulations traiteur",
      icon: "🧮",
      route: "/simulations",
    },
    {
      title: "Proformas",
      subtitle: "Gérer les offres clients",
      icon: "📄",
      route: "/proformas",
    },
    {
      title: "Commandes",
      subtitle: "Suivre les prestations confirmées",
      icon: "📦",
      route: "/orders",
    },
    {
      title: "Factures",
      subtitle: "Créer et consulter les factures",
      icon: "🧾",
      route: "/invoices",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ventes</Text>
      <Text style={styles.subtitle}>Cycle commercial traiteur</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F4F6F8",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
});