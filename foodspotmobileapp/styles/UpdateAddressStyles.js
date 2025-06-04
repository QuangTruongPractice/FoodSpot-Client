import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  mapContainer: { width: "100%", height: 300, marginVertical: 20 },
  confirmBtn: { backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  saveBtn: { backgroundColor: "#9c27b0", paddingVertical: 14, alignItems: "center", margin: 5 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 12, borderRadius: 8, marginHorizontal: 5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 5 },
});

export default styles;