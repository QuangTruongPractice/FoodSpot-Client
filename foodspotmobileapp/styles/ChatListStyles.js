import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 30 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 15, color: "#222", paddingHorizontal: 15 },
  chatItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#f9f9f9", borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  chatTitle: { fontSize: 17, color: "#333", fontWeight: "600" },
  separator: { height: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ccc", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarInitial: { fontSize: 20, color: "#fff", fontWeight: "bold" },
});

export default styles;
