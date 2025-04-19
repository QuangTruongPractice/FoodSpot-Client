import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  bannerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  bannerImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  bannerText: {
    position: "absolute",
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    top: 60,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wrap: {
    flexWrap: "wrap",
  },
  margin: {
    margin: 10,
  },
  chip: {
    margin: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  productCard: {
    flex: 1,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 5,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  productBrand: {
    fontSize: 12,
    color: "#666",
  },
  productPrice: {
    fontSize: 12,
    color: "#f00",
  },
});