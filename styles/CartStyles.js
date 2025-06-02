import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  subCartContainer: { backgroundColor: "#fff", marginVertical: 8, padding: 10, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  storeName: { fontSize: 16, fontWeight: "bold", marginBottom: 8, marginLeft: 30 },
  itemContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, position: "relative" },
  checkboxSubCart: { position: "absolute", top: 10, left: 10, zIndex: 10 },
  checkboxItem: { marginRight: 5 },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },
  itemInfo: { flex: 1, justifyContent: "center" },
  foodName: { fontSize: 14, fontWeight: "600" },
  price: { fontSize: 14, color: "red" },
  quantityControls: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
  quantity: { marginHorizontal: 8, fontSize: 16, fontWeight: "bold" },
  button: { backgroundColor: "#eee", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  buttonText: { fontSize: 16, fontWeight: "bold" },
  totalPriceText: { textAlign: "right", fontSize: 16, fontWeight: "bold", marginTop: 10, color: "green" },
  checkoutButton: { backgroundColor: "#FF424E", flex: 1, marginLeft: 5, padding: 15, borderRadius: 10, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  buttonGroup: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  deleteButton: { backgroundColor: "#aaa", flex: 1, marginRight: 5, padding: 15, borderRadius: 10, alignItems: "center" },
  buttonTextWhite: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});

export default styles;