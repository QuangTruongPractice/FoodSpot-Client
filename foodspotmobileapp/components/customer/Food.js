import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Text, Image, TouchableOpacity, View } from "react-native";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { IconButton } from "react-native-paper"; 
import Toast from 'react-native-toast-message';
import { checkToken, getCurrentTimeServe, loadRestaurantDetails, loadFoodDetails,
  loadFoodReviews, loadUserFavorite, loadMenu
 } from "../../configs/Data";
import styles from "../../styles/FoodStyles";

const Food = ({ route }) => {
  const { foodId } = route.params; // Lấy foodId từ route.params
  const [foodDetails, setFoodDetails] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [currentFoodInMenu, setCurrentFoodInMenu] = useState(null);
  const [favStatus, setFavStatus] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Các món khác");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const nav = useNavigation();
  
  const loadFoodData = async () => {
    const foodRes = await loadFoodDetails(foodId);
    setFoodDetails(foodRes);

    const token = await checkToken(nav);
    if (token) {
      const favList = await loadUserFavorite(token);
      const foundFav = favList?.find((item) => item.food === foodId);
      if (foundFav) {
        setFavStatus(foundFav.status);
      }
    }
  };

  const loadReviews = async () => {
    if (page <= 0) {
        return;
    } else {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
          const res = await loadFoodReviews(foodId, {page});
          if (isFirstPage) {
            setReviews(res.results);
          } else {
            setReviews([...reviews, ...res.results]);
          }
          if (res.next === null) {
            setPage(0);
          } 
      } catch (ex) {
          console.error(ex);
      } finally {
          setLoading(false);
          setLoadingMore(false);
      }
    }
  };

  const loadRestaurantAndRelatedFoods = async () => {
    if (!foodDetails?.restaurant) return;

    const res = await loadRestaurantDetails(foodDetails.restaurant);
    setRestaurant(res);

    const allMenus = await loadMenu();
    const currentTimeServe = getCurrentTimeServe();

    for (let menu of allMenus) {
      if (menu.time_serve !== currentTimeServe) continue;

      // 🔥 Chỉ lấy món còn available
      const availableFoods = menu.foods.filter(f => f.is_available === true);

      const matchedFood = availableFoods.find((f) => f.id === foodId);
      if (matchedFood) {
        setCurrentFoodInMenu(matchedFood);
        const others = availableFoods.filter((f) => f.id !== foodId);
        setRelatedFoods(others);
        break;
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFoodData();
    }, [foodId])
  );

  useEffect(() => {
    loadReviews(); // load reviews mỗi khi `page` thay đổi
  }, [page]);

  useEffect(() => {
    let timer = setTimeout(() => {
      loadRestaurantAndRelatedFoods();
    }, 500);

    return () => clearTimeout(timer);
  }, [foodDetails]);

  const handleFavorite = async () => {
    const token = await checkToken(nav);
    if (favStatus === "FAVORITE") {
      await authApis(token).post(endpoints["current-user-favorite"], {
        food: foodId,
        status: "CANCEL"
      });
        setFavStatus("CANCEL");
    } else {
      await authApis(token).post(endpoints["current-user-favorite"], {
        food: foodId,
        status: "FAVORITE"
      });
      setFavStatus("FAVORITE");
    } 
  };

  const addToCart = async() => {
    try {
      const token = await checkToken(nav);
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

  if (loading) {
    return <ActivityIndicator size="large" />; // Hiển thị loading khi chưa có dữ liệu
  }

  const renderHeader = () => (
    <View style={styles.container}>
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
          <View style={styles.restaurantCard}>
            <TouchableOpacity
              onPress={() => nav.navigate("RestaurantDetails", { restaurantId: restaurant.id })}
              style={{ flexDirection: "row", flex: 1 }}
            >
              <Image
                source={{ uri: restaurant.avatar || "https://picsum.photos/400/200" }}
                style={styles.restaurantAvatar}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>⭐{restaurant.star_rating}</Text>
                  <Text style={styles.ratingText}>{restaurant.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accessButton}
              onPress={() => nav.navigate("RestaurantDetails", { restaurantId: restaurant.id })}
            >
              <Text style={styles.accessButtonText}>Truy cập</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Tab chuyển giữa Món ăn và Đánh giá */}
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
    </View>
  );

  return (
    <>
      {activeTab === 'Đánh giá' ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 5 }}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.reviewsContainer}>
              <Image
                source={{
                  uri: item.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                }}
                style={styles.reviewsAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold' }}>{item.user_name}</Text>
                <Text>{item.comment}</Text>
                <Text style={styles.star}>⭐ {item.star} / 5</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Chưa có đánh giá nào</Text>
          )}
          onEndReached={() => {
            if (!loadingMore && page > 0) setPage(page + 1);
          }}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
        />
      ) : (
        <FlatList
          data={relatedFoods}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 5 }}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => nav.push("Food", { foodId: item.id })}
            >
              <Image source={{ uri: item.image }} style={styles.menuImage} />
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              <Text style={styles.price}>
                {item.price.toLocaleString()}đ
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Không có món ăn liên quan</Text>
          )}
        />
      )}
    </>
  );
};

export default Food;