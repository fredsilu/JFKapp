import { View, Text, StyleSheet } from "react-native";
import { ArchivedClientMatchStatus } from "@/types/archives";

export default function ArchiveStatusBadge({
  status,
}: {
  status?: ArchivedClientMatchStatus;
}) {
  let background = "#E5E7EB";
  let text = "INCONNU";

  switch (status) {
    case "mapped":
      background = "#DCFCE7";
      text = "RELIÉ";
      break;

    case "new_historical_client":
      background = "#FEF3C7";
      text = "NOUVEAU CLIENT";
      break;

    case "unmapped":
      background = "#FEE2E2";
      text = "À VÉRIFIER";
      break;

    case "manual_alias":
      background = "#DBEAFE";
      text = "ALIAS";
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  text: {
    fontWeight: "700",
    fontSize: 11,
  },
});