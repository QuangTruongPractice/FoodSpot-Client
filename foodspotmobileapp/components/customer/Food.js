import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Text, Image, TouchableOpacity, View, Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { IconButton, Icon } from "react-native-paper"; 
import { getCurrentTimeServe, loadRestaurantDetails, loadFoodDetails,
  loadFoodReviews, loadUserFavorite, loadMenu
 } from "../../configs/Data";
import styles from "../../styles/FoodStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleFavorite, addFoodToCart } from "../../configs/Action";

const Food = ({ route }) => {
  const { foodId } = route.params; // Lấy foodId từ route.params
  const [foodDetails, setFoodDetails] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const [currentFoodInMenu, setCurrentFoodInMenu] = useState(null);
  const [favStatus, setFavStatus] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Món ăn");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const nav = useNavigation();
  
  const loadFoodData = async () => {
    const foodRes = await loadFoodDetails(foodId);
    setFoodDetails(foodRes);

    const token = await AsyncStorage.getItem("access_token");
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

  const handleFavorite = () => {
    toggleFavorite({ nav, foodId, favStatus, setFavStatus });
  };

  // Thêm vào giỏ
  const handleAddToCart = () => {
    addFoodToCart({ nav, foodId });
  };

  const renderHeader = () => (
    (loading || !foodDetails) ? (
      <ActivityIndicator size="large" />
    ) : (
      <View style={styles.container}>
      {/* Ảnh món ăn chính */}
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image source={{ uri: foodDetails?.image }} style={styles.mainImage} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent>
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Image
              source={{ uri: foodDetails?.image }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        </View>
      </Modal>

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
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonAdd} onPress={handleAddToCart}>
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <Icon source="cart" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Thêm vào giỏ</Text>
            </View>
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
          <TouchableOpacity onPress={() => setActiveTab("Món ăn")}>
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
  ));

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