// app/(traiteur)/config/index.tsx

import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConfigHome() {
  const router = useRouter();

  const items = [
    {
      title: "Clients",
      subtitle: "Créer et gérer les clients",
      icon: "👥",
      route: "/(traiteur)/clients",
    },
    {
      title: "Plats",
      subtitle: "Gérer les plats, menus et références",
      icon: "🍽️",
      route: "/(traiteur)/dishes",
    },
    {
      title: "Ingrédients",
      subtitle: "Gérer les ingrédients",
      icon: "🥦",
      route: "/(traiteur)/ingredients",
    },
    {
      title: "Société & Banque",
      subtitle: "Configurer les informations légales et bancaires",
      icon: "🏦",
      route: "/(traiteur)/config/company-settings",
    },
    {
      title: "Service traiteur",
      subtitle: "Configurer les coûts et ratios du service",
      icon: "🧑‍🍳",
      route: "/(traiteur)/config/service-settings",
    },
    {
      title: "Numérotation",
      subtitle:
        "Gérer les compteurs des factures et proformas",
      icon: "🔢",
      route: "/(traiteur)/config/numbering",
    },
    {
      title: "Documents / Archives",
      subtitle: "Factures, proformas, avoirs et PDF",
      icon: "📁",
      route: "/(traiteur)/documents",
    },
    {
      title: "Aide & règles",
      subtitle: "Comprendre les règles comptables et métier",
      icon: "📘",
      route: "/(traiteur)/config/help",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuration</Text>

      <Text style={styles.subtitle}>
        Référentiels et paramètres du module traiteur
      </Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: item.route as any,
                params: {
                  backTo: "/(traiteur)/config",
                },
              })
            }
          >
            <Text style={styles.icon}>{item.icon}</Text>

            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text style={styles.cardSubtitle}>
              {item.subtitle}
            </Text>
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
    color: "#111827",
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
    color: "#111827",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
});