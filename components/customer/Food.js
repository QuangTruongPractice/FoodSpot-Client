import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, Image, TouchableOpacity, View, StyleSheet } from "react-native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { IconButton } from "react-native-paper"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from 'react-native-toast-message';

const Food = ({ route }) => {
  const { foodId } = route.params; // Lấy foodId từ route.params
  const [foodDetails, setFoodDetails] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [currentFoodInMenu, setCurrentFoodInMenu] = useState(null);
  const [favStatus, setFavStatus] = useState(null);
  const [favId, setFavId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Các món khác");
  const nav = useNavigation();

  function getCurrentTimeServe() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 11) {
        return 'MORNING';
    } else if (hour >= 11 && hour < 13) {
        return 'NOON';
    } else if (hour >= 13 && hour < 23) {
        return 'EVENING';
    } else if (hour >= 23 || hour < 5) {
        return 'NIGHT';
    } else {
        return null;
    }
  }

  const loadRestaurantDetails = async (restaurantId) => {
    const res = await Apis.get(endpoints["restaurant-details"](restaurantId));
    setRestaurant(res.data);
  };
  

  const loadFoodDetails = async () => {
    const res = await Apis.get(endpoints["food-details"](foodId));
    setFoodDetails(res.data);
  };

  const loadReviews = async () => {
    const reviewsRes = await Apis.get(endpoints["food-reviews"](foodId));
    setReviews(reviewsRes.data);
    console.info(reviewsRes.data);
  }

  const loadFavorite = async () => {
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
    const currentTimeServe = getCurrentTimeServe();
    let relatedFoodsList = [];
    // Duyệt từng menu để tìm món ăn hiện tại
    for (let menu of allMenus) {
      const food = menu.foods.find(f => f.id === foodId);
      if (food) {
        if (menu.time_serve === currentTimeServe) {
          setCurrentFoodInMenu(food);
          const otherFoods = menu.foods.filter(f => f.id !== foodId);
          relatedFoodsList = [...relatedFoodsList, ...otherFoods];
        }
        break;
      }
    }
    if (relatedFoodsList.length > 0) {
      setRelatedFoods(relatedFoodsList);
    } else {
      setRelatedFoods([]);  // Làm sạch relatedFoods
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkTokenAndLoadFavorite = async () => {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          loadFavorite();
        }
      };
      loadFoodDetails();
      loadReviews();
      checkTokenAndLoadFavorite();
    }, [foodId])
  );

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

  const addToCart = async() => {
    try {
      const token = await AsyncStorage.getItem("token");
      const currentTimeServe = getCurrentTimeServe();
      await authApis(token).post(endpoints["add-to-cart"], {
        food_id: foodId,
        time_serve: currentTimeServe,
      });
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã thêm vào giỏ hàng!",
        position: "bottom",
        visibilityTime: 2000, // 2 giây rồi tự tắt
      });
    } catch (error) {
      console.error("Thêm vào giỏ lỗi:", error);
      console.error("Thêm vào giỏ lỗi:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể thêm vào giỏ hàng!",
        position: "bottom",
      });
    }
  }

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
        <TouchableOpacity style={styles.buttonAdd}
          onPress={addToCart}>
          <Text style={styles.buttonText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>

      {restaurant && (
        <TouchableOpacity 
          onPress={() => nav.navigate("RestaurantDetails", { restaurantId: restaurant.id })} // Chuyển đến RestaurantDetails với restaurantId
        >
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
        </TouchableOpacity>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 10,
          backgroundColor: "#fafafa",
        }}
      >
        <TouchableOpacity onPress={() => setActiveTab("Các món khác")}>
          <Text style={{
            fontWeight: activeTab === "Món ăn" ? "bold" : "normal",
            color: activeTab === "Món ăn" ? "#e53935" : "#000",
          }}>Món ăn</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("Đánh giá")}>
          <Text style={{
            fontWeight: activeTab === "Đánh giá" ? "bold" : "normal",
            color: activeTab === "Đánh giá" ? "#e53935" : "#000",
          }}>Đánh giá</Text>
        </TouchableOpacity>
      </View>

      {/* Menu nhà hàng */}
      {activeTab === "Các món khác" ? (
        <View style={styles.menuContainer}>
          {relatedFoods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.menuItem}
              onPress={() => nav.push("Food", { foodId: food.id })}
            >
              <Image source={{ uri: food.image }} style={styles.menuImage} />
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
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {reviews.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Chưa có đánh giá nào
          </Text>
        ) : (
          reviews.map((item) => (
            <View key={item.id} style={styles.reviewsContainer}>
              <Image
                source={{
                  uri: item.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                style={styles.reviewsAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold" }}>{item.user_name}</Text>
                <Text>{item.comment}</Text>
                <Text style={styles.star}>⭐ {item.star} / 5</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      )}

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
  reviewsContainer:       { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 8, padding: 10, marginBottom: 10, alignItems: "flex-start",},
  reviewsAvatar:          {width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ccc", },
});

export default Food;
