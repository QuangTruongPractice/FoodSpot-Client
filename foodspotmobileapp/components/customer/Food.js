import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, Image, TouchableOpacity, View, StyleSheet, Button } from "react-native";
import Apis, { authApis, endpoints } from "../../configs/Apis"; // Giả sử bạn có API endpoint đã cấu hình
import { useNavigation } from "@react-navigation/native";
import { IconButton } from "react-native-paper"; 
import AsyncStorage from "@react-native-async-storage/async-storage";

const Food = ({ route }) => {
  const { foodId } = route.params; // Lấy foodId từ route.params
  const [foodDetails, setFoodDetails] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [currentFoodInMenu, setCurrentFoodInMenu] = useState(null);
  const [favStatus, setFavStatus] = useState(null);
  const [favId, setFavId] = useState(null);
  const nav = useNavigation();

  const loadRestaurantDetails = async (restaurantId) => {
    const res = await Apis.get(endpoints["restaurant-details"](restaurantId));
    setRestaurant(res.data);
  };
  

  const loadFoodDetails = async () => {
    const res = await Apis.get(endpoints["food-details"](foodId));
    setFoodDetails(res.data);
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      nav.replace("Login");
      return;
    }
    const favRes = await authApis(token).get(endpoints["current-user-favorite"]);
    if (favRes.data) {
    // Nếu tìm thấy dữ liệu fav, kiểm tra status
      const fav = favRes.data.find(
        (item) => item.food === foodId
      );
      if (fav) {
        setFavStatus(fav.status);
        setFavId(fav.id);
      }
    } else {
      setFavStatus("NOT_FAV"); // Người dùng chưa follow nhà hàng này
    }
  };

  const loadRelatedMenuFoods = async () => {
    const res = await Apis.get(endpoints["menus"]);
    const allMenus = res.data;
  
    // Duyệt từng menu để tìm món ăn hiện tại
    for (let menu of allMenus) {
      const found = menu.foods.find(f => f.id === foodId);
      if (found) {
        // Bỏ món hiện tại ra khỏi danh sách trước khi set
        setCurrentFoodInMenu(found); // lưu lại món có giá chính xác
        const otherFoods = menu.foods.filter(f => f.id !== foodId);
        setRelatedFoods(otherFoods);
        break;
      }
    }
  };

  useEffect(() => {
    loadFoodDetails();
  }, [foodId]);

  useEffect(() => {
    let timer = setTimeout(() => {
      if (foodDetails?.restaurant) {
        loadRestaurantDetails(foodDetails.restaurant);
        loadRelatedMenuFoods();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [foodDetails]);

  const handleFavorite = async () => {
    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");
    console.info(favStatus)
    if (favStatus === "FAVORITE") {
      await authApis(token).patch(endpoints["favorite-details"](favId), {
        status: "CANCEL"
      });
        setFavStatus("CANCEL");
    } else if (favStatus === "CANCEL"){
      await authApis(token).patch(endpoints["favorite-details"](favId), {
        status: "FAVORITE"
      });
      setFavStatus("FAVORITE");
    } else {
      await authApis(token).post(endpoints["favorite"], {
        user: userId,
        food: foodId,
        status: "FAVORITE",
      });
      setFavStatus("FAVORITE");
    }
  };

  if (!foodDetails) {
    return <ActivityIndicator size="large" />; // Hiển thị loading khi chưa có dữ liệu
  }

  return (
    <ScrollView style={styles.container}>
      {/* Ảnh món ăn chính */}
      <Image source={{ uri: foodDetails.image }} style={styles.mainImage} />

      <View style={styles.foodInfoContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{foodDetails.name}</Text> 
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleFavorite()}
          >
            <View style={styles.actionsColumn}>
            <IconButton
            icon="heart"
            size={24}
            iconColor={favStatus === "FAVORITE" ? "red" : "gold"}
            containerColor="#ffe6e6"
            style={{
              borderRadius: 8,
            }}
            />
             </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{foodDetails.description}</Text>
        <View style={styles.ratingRow}>
        <Text style={styles.price}>
          {currentFoodInMenu?.price
            ? currentFoodInMenu.price.toLocaleString() + "đ"
            : "Đang cập nhật giá"}
        </Text>
        <Text style={styles.star}>⭐ {foodDetails.star_rating}</Text>
      </View>
      </View>
      
      {/* Nút thêm vào giỏ và đặt hàng */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonAdd}>
          <Text style={styles.buttonText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOrder}>
          <Text style={styles.buttonText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>

      {restaurant && (
        <View style={styles.restaurantCard}>
          <Image
            source={{
              uri: restaurant.avatar || "https://picsum.photos/400/200",
            }}
            style={styles.restaurantAvatar}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>⭐{restaurant.star_rating}</Text>
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.accessButton}
            onPress={() => nav.navigate("RestaurantDetails", { restaurantId: restaurant.id })} // Chuyển đến RestaurantDetails với restaurantId
          >
            <Text style={styles.accessButtonText}>Truy cập</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu nhà hàng */}
      <Text style={styles.menuHeader}>Các món khác</Text>
      <View style={styles.menuContainer}>
      {relatedFoods.map((food) => (
        <TouchableOpacity
          key={food.id}
          style={styles.menuItem}
          onPress={() =>
            nav.push("Food", { foodId: food.id }) // mở food khác
          }
        >
          <Image
            source={{ uri: food.image.replace("image/upload/", "") }}
            style={styles.menuImage}
          />
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{food.name}</Text>
            <Text style={styles.menuDesc}>{food.description}</Text>
          </View>
          <Text style={styles.price}>
            {food.price.toLocaleString()}đ
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    </ScrollView>
  );
};

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
});

export default Food;
