import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', padding: 12, margin: 10, borderRadius: 8 },
  itemContainer: { backgroundColor: '#f9f9f9', padding: 10, marginHorizontal: 10, marginBottom: 10, borderRadius: 6 },
  storeName: { fontWeight: 'bold', marginBottom: 5 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  productName: { flex: 1 },
  productQuantity: { width: 50, textAlign: 'center' },
  productPrice: { width: 80, textAlign: 'right' },
  paymentBox: { marginTop: 10, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: '#fff' },
  totalText: { fontWeight: 'bold', fontSize: 16 },
  orderButton: { backgroundColor: '#ff3b30', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  orderButtonText: { color: '#fff', fontWeight: 'bold' },
  addressInfo: { marginLeft: 10, flex: 1 },
  addressPlaceholder: { marginLeft: 10, color: '#888' },
  addressDetails: { color: '#444' },
  rightIcon: { marginLeft: 'auto' }
});

export default styles;