import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", flex: 1 },
  menuTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#e53935" },
  menuDesc: { fontSize: 14, color: "#555", marginBottom: 16 },
  card: { flexDirection: "row", backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 15, overflow: "hidden", elevation: 2 },
  image: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 10, justifyContent: "space-between" },
  foodName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  foodDesc: { fontSize: 13, color: "#666", marginVertical: 4 },
  foodPrice: { fontSize: 14, fontWeight: "bold", color: "#e53935" },
  errorText: { textAlign: "center", marginTop: 20, color: "#888" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#888" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default styles;