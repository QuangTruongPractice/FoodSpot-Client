import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  reviewsContainer: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 8, padding: 10, alignItems: "flex-start",},
  reviewsAvatar: {width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ccc", },
  container: { flexDirection: "row", alignItems: "flex-start", padding: 8, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
  middleContent: { flex: 1 },
  username: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  starsRow: { flexDirection: "row", marginBottom: 4 },
  commentRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  textInput: { flex: 1, fontSize: 14, maxHeight: 60, padding: 0 },
  sendButton: { paddingLeft: 6 },
  star: { color:"#2ecc71", marginLeft:10 },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 8, padding: 20 },
  modalTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, marginBottom: 20, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  foodCard: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  foodImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 10 },
  foodName: { fontSize: 20, fontWeight: "bold", marginBottom: 6, color: "#333" },
  foodText: { fontSize: 14, marginBottom: 4, color: "#555" },
  reviewWrapper: { backgroundColor: "#f0f0f0", borderRadius: 8, padding: 10, marginBottom: 12},
  reviewMain: { flexDirection: "row", alignItems: "flex-start"},
  reviewsAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ccc",},
  replyItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, marginLeft: 10,},
  replyAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, backgroundColor: "#ccc", },
});

export default styles;