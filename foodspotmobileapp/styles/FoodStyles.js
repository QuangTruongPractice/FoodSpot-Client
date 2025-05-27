import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container:              { padding:10, backgroundColor:"#fff" },
  mainImage:              { width:"100%", height:200, borderRadius:10 },
  title:                  { fontSize:18, fontWeight:"bold", marginVertical:5 },
  description:            { fontSize:14, color:"#555", marginBottom: 5 },
  buttonContainer:        { flexDirection:"row", justifyContent:"space-between", marginBottom:20 },
  buttonAdd:              { backgroundColor:"#f0a500", padding:10, borderRadius:8, flex:1, marginRight:5 },
  buttonOrder:            { backgroundColor:"#e53935", padding:10, borderRadius:8, flex:1, marginLeft:5 },
  buttonText:             { color:"#fff", textAlign:"center", fontWeight:"bold" },
  menuHeader:             { fontSize:16, fontWeight:"bold", marginVertical:10 },
  menuContainer:          { marginBottom:20 },
  menuTitle:              { fontSize:16, fontWeight:"bold", marginBottom:5 },
  timeServe:              { fontSize:12, color:"#888", marginBottom:10 },
  menuItem:               { flexDirection:"row", marginBottom:15, alignItems:"center" },
  menuImage:              { width:60, height:60, borderRadius:10, marginRight:10 },
  menuInfo:               { flex:1 },
  menuName:               { fontSize:14, fontWeight:"bold" },
  menuDesc:               { fontSize:12, color:"#666" },
  restaurantCard:         { flexDirection:"row", alignItems:"center", backgroundColor:"#f5f5f5", padding:10, borderRadius:10, marginBottom:15 },
  restaurantAvatar:       { width:50, height:50, borderRadius:25 },
  restaurantName:         { fontSize:16, fontWeight:"bold" },
  ratingRow:              { flexDirection:"row", alignItems:"center", marginTop:4, flexWrap:"wrap" },
  star:                   { color:"#2ecc71", marginLeft:10 },
  ratingText:             { color:"#2ecc71", fontWeight:"bold", marginRight:10 },
  customerCount:          { color:"#555", fontSize:12 },
  accessButton:           { backgroundColor:"#eee", paddingVertical:6, paddingHorizontal:12, borderRadius:8 },
  accessButtonText:       { fontWeight:"bold", color:"#333" },
  price:                  { fontWeight:"bold", color:"#f00" },
  rowBetween:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  ratingRow:              { flexDirection: 'row', alignItems: 'center', marginBottom: 5, },
  reviewsContainer:       { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 8, padding: 10, marginBottom: 10, alignItems: "flex-start",},
  reviewsAvatar:          {width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ccc", },
});


export default styles;