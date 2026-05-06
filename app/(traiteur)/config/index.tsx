import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ConfigHome() {
  const router = useRouter();

  const items = [
    {
      title: "Clients",
      subtitle: "Créer et gérer les clients",
      icon: "👥",
      route: "/clients",
    },
    {
      title: "Plats",
      subtitle: "Gérer les plats, menus et références",
      icon: "🍽️",
      route: "/dishes",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuration</Text>
      <Text style={styles.subtitle}>Référentiels et paramètres du module traiteur</Text>

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