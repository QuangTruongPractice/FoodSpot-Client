import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: { padding: 15, backgroundColor: "#f9f9f9" },
    loading: { marginTop: 50 },
    orderBox: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    orderTitle: { fontWeight: "bold", fontSize: 20, marginBottom: 5 },
    text: { marginVertical: 4, fontSize: 14, color: "#2d3436" },
    boldText: { fontWeight: "bold" },
    price: { fontWeight: "bold", color: "#e67e22" },
    status: { color: "#27ae60" },
    foodListTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    foodItem: { flexDirection: "row", marginBottom: 15, backgroundColor: "#fff", borderRadius: 10, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    foodImage: { width: 80, height: 80, borderRadius: 8 },
    foodInfo: { marginLeft: 12, flex: 1 },
    foodName: { fontWeight: "bold", fontSize: 16 },
    subTotal: { marginTop: 4, fontWeight: "500", color: "#e67e22" },
});

export default styles;