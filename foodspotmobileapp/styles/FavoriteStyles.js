import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: "#fff", marginBottom: 15, borderRadius: 8, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  itemContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#eee" },
  infoContainer: { flex: 1, marginLeft: 10 },
  name: { fontSize: 16, fontWeight: "bold", color: "#333" },
  description: { fontSize: 13, color: "#888", marginTop: 2 },
  priceStarContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  price: { fontSize: 14, color: "#e74c3c", fontWeight: "600" },
  star: { fontSize: 13, color: "#f39c12", marginLeft: 10 },
  favoriteButton: { width: 32, height: 32, backgroundColor: "#ffe6e6", borderRadius: 8, justifyContent: "center", alignItems: "center", marginLeft: 10 },
});

export default styles;