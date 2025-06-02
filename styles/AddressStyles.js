import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { paddingBottom: 60 },
  loading: { marginTop: 40 },
  emptyText: { marginTop: 24, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: "#ddd", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  cardAddress: { color: "#555" },
  addBtn: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#9c27b0", paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default styles;