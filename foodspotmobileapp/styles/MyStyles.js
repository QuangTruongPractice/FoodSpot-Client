import { StyleSheet } from "react-native";

const MyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },

  p: {
    padding: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  wrap: {
    flexWrap: "wrap",
  },

  m: {
    height: 40,
    marginRight: 8,
    justifyContent: 'center',
  },

  cate: {
    flexDirection: "row",
    height: 100,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    height: 35,
  },

  optionButton: {
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 4,
    marginTop: -15,
    flexDirection: "row",
  },

  optionText: {
    fontSize: 12,
    marginTop: 4,
    color: "#333",
  },

  banner: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
    marginBottom: 5,
    marginTop: -15,
    width: "100%",
    height: 120,
  },

  bannerImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
    color: "#000",
  },
  
  productCardGrid: {
    backgroundColor: "#f8f8f8",
    width: "48%", // Chiếm khoảng 1 nửa màn hình (trừ margin)
    marginVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  productImage: {
    width: "100%",
    height: 200,
  },

  productName: {
    fontWeight: "bold",
    fontSize: 16,
    paddingHorizontal: 10,
    marginTop: 8,
    color: "#222",
  },

  productBrand: {
    color: "#666",
    fontSize: 13,
    paddingHorizontal: 10,
    marginTop: 2,
  },

  productPrice: {
    color: "#000",
    fontWeight: "bold",
    padding: 10,
    fontSize: 14,
  },

  productEmpty: {
    textAlign: 'center', 
    color: 'gray'
  }, 
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50
  }

});

export default MyStyles;
