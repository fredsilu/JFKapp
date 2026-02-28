import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import {
  getForecastByEntity,
  markForecastExecuted,
  Forecast,
} from "@/src/finance/services/financeForecastService";

export default function MaisonForecast() {
  const [data, setData] = useState<Forecast[]>([]);

  async function load() {
    const result = await getForecastByEntity("maison");
    setData(result);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>
              {item.amount.toLocaleString()} USD
            </Text>

            <Text>{item.category}</Text>
            <Text>
              {item.plannedDate.toLocaleDateString()}
            </Text>

            <Text
              style={{
                color: item.isExecuted
                  ? "#16a34a"
                  : "#f59e0b",
              }}
            >
              {item.isExecuted ? "Exécuté" : "Prévu"}
            </Text>

            {!item.isExecuted && (
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  await markForecastExecuted(
                    item.id!,
                    "manual-link"
                  );
                  load();
                }}
              >
                <Text style={{ color: "white" }}>
                  Marquer exécuté
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  card: {
    backgroundColor: "white",
    padding: 16,
    margin: 10,
    borderRadius: 12,
  },
  amount: {
    fontWeight: "bold",
    fontSize: 18,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
});