import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    card: { flex: 1, backgroundColor: "#fff", marginBottom: 15 },
    itemContainer: { flexDirection: "row", padding: 10, borderRadius: 8, backgroundColor: "#f8f8f8" },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    infoContainer: { flex: 1, marginLeft: 10 },
    name: { fontSize: 16, fontWeight: "bold", color: "#333" },
    ratingRow: { flexDirection: "row", alignItems: "center" },
    star: { fontSize: 14, color: "#f39c12" },
    rating: { fontSize: 14, color: "#555", marginLeft: 5 },
    actionsColumn: { flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" },
    actionButton: { backgroundColor: "#eee", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
    actionButtonText: { fontWeight: "bold", color: "#333" },
    unfollowButton: { backgroundColor: "#e74c3c", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
    unfollowText: { color: "#fff", fontWeight: "bold" },
    message: { textAlign: "center", fontSize: 16, color: "#888" },
});

export default styles;