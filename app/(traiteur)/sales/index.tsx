import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SalesItem = {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
};

export default function SalesHome() {
  const router = useRouter();

  const items: SalesItem[] = [
    {
      title: 'Simulations',
      subtitle: 'Créer et consulter les simulations traiteur',
      icon: '🧮',
      route: '/(traiteur)/simulations',
    },
    {
      title: 'Proformas',
      subtitle: 'Gérer les offres clients',
      icon: '📄',
      route: '/(traiteur)/proformas',
    },
    {
      title: 'Commandes',
      subtitle: 'Suivre les prestations confirmées',
      icon: '📦',
      route: '/(traiteur)/orders',
    },
    {
      title: 'Factures',
      subtitle: 'Créer et consulter les factures',
      icon: '🧾',
      route: '/(traiteur)/invoices',
    },
    {
      title: 'Statistiques',
      subtitle: 'Consulter les statistiques commerciales',
      icon: '📊',
      route: '/(traiteur)/analytics',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Ventes</Text>
      <Text style={styles.subtitle}>Cycle commercial traiteur</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
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
    backgroundColor: '#F4F6F8',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    color: '#0F172A',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },

  grid: {
    gap: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 28,
    marginRight: 14,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    color: '#111827',
  },

  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  chevron: {
    fontSize: 28,
    color: '#94A3B8',
    marginLeft: 8,
  },
  content: {
  paddingBottom: 40, // 🔥 espace pour le tab bar
},
});