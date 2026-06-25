import { StyleSheet, Text, View } from "react-native";

interface Props {
  total: number;
  invoices: number;
  proformas: number;
  clients: number;
  totalInvoices: number;
  totalProformas: number;
  mapped: number;
  newHistorical: number;
  unmapped: number;
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ArchiveStats(props: Props) {
  return (
    <View style={styles.row}>
      <Card title="Archives" value={props.total} color="#2563EB" />
      <Card title="Factures" value={props.invoices} color="#2563EB" />
      <Card title="Proformas" value={props.proformas} color="#16A34A" />
      <Card title="Clients" value={props.clients} color="#7C3AED" />
      <Card title="Reliées" value={props.mapped} color="#16A34A" />
      <Card title="À vérifier" value={props.unmapped} color="#DC2626" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },

  card: {
    flexGrow: 1,
    flexBasis: 135,
    maxWidth: 210,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderTopWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  title: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },

  value: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
});