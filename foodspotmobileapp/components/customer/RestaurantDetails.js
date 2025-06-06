import { useEffect, useState, useCallback } from "react";
import { View, Text, Modal, Alert, TouchableOpacity, FlatList, Image, ActivityIndicator, TextInput } from "react-native";
import { authApis,endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon, Button } from "react-native-paper";
import { getCurrentTimeServe, checkToken, loadRestaurantReviews, loadUser, loadRestaurantDetails, 
  loadRestaurantMenu, loadRestaurantFood, loadUserFollow, checkOrdered
 } from "../../configs/Data";
import styles from "../../styles/RestaurantStyles";
import { handleSubmitReview } from "../../configs/Action";

const RestaurantDetails = ({ route }) => {
  const { restaurantId } = route.params;
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurant, setRestaurant] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("Món ăn");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [foodPage, setFoodPage] = useState(1);
  const [followStatus, setFollowStatus] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [star, setStar] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [currentTimeServe, setCurrentTimeServe] = useState(getCurrentTimeServe());
  const nav = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editedComment, setEditedComment] = useState("");

  useEffect(() => {
    const intervalId = setInterval(() => {
        setCurrentTimeServe(getCurrentTimeServe());
    }, 300 * 1000);

    return () => clearInterval(intervalId); // Clear interval khi rời trang
  }, []);

  const loadReviews = async () => {
    if (reviewPage <= 0) {
        return;
    } else {
      const isFirstPage = reviewPage === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
          const res = await loadRestaurantReviews(restaurantId, {reviewPage});
          if (isFirstPage) {
            setReviews(res.results);
          } else {
            setReviews([...reviews, ...res.results]);
          }
          if (res.next === null) {
            setReviewPage(0);
          } 
      } catch (ex) {
          console.error(ex);
      } finally {
          setLoading(false);
          setLoadingMore(false);
      }
    }
  };

  const loadFoods = async () => {
    if (foodPage <= 0) {
        return;
    } else {
      const isFirstPage = foodPage === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      try {
          const res = await loadRestaurantFood(restaurantId, {foodPage});
          const availableFoods = res.results.filter(r => r.is_available === true);
          if (isFirstPage) {
            setFoods(availableFoods);
          } else {
            setFoods([...foods, ...availableFoods]);
          }
          if (res.next === null) {
            setFoodPage(0);
          } 
      } catch (ex) {
          console.error(ex);
      } finally {
          setLoading(false);
          setLoadingMore(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const menuRes = await loadRestaurantMenu(restaurantId);
      setMenus(menuRes);

      const restaurantRes = await loadRestaurantDetails(restaurantId);
      setRestaurant(restaurantRes);
    } catch (error) {
      console.error("Error loading restaurant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthData = async (token) => {
    try {
      setLoading(true);
      const userRes = await loadUser(token);
      setCurrentUser(userRes);
  
      const followRes = await loadUserFollow(token)
      if (followRes) {
        const follow = followRes.find((item) => item.restaurant === restaurantId);
        if (follow) {
          setFollowStatus(follow.status);
        }
      }
    } catch (error) {
      console.error("Error fetching auth data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkTokenAndLoadAuth = async () => {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          setToken(token)
          await fetchAuthData(token);
          await hasUserOrderedAtRestaurant(token);
        }else {
          setToken(null);
        }
      };
      fetchData();
      checkTokenAndLoadAuth();
    }, [restaurantId])
  );

  useEffect(() => {
    loadReviews();
  }, [reviewPage]);

  useEffect(() => {
    loadFoods();
  }, [foodPage]);

  const hasUserOrderedAtRestaurant = async (token) => {
    try {
      const res = await checkOrdered(token, restaurantId);
      if (res.has_ordered) setCanReview(true);
    } catch (error) {
      console.error("Error checking user orders:", error);
      return false;
    }
  };

  const handleFollow = async () => {
    const token = await checkToken(nav);
    if (!token) {
      return;
    }
    if (followStatus === "FOLLOW") {
      // Hủy follow
      await authApis(token).post(endpoints["current-user-follow"], {
        restaurant: restaurantId,
        status: "CANCEL"
      });
        setFollowStatus("CANCEL");
    } else{
      await authApis(token).post(endpoints["current-user-follow"], {
        restaurant: restaurantId,
        status: "FOLLOW"
      });
      setFollowStatus("FOLLOW");
    }
  };

  const handleSubmit = async (token) => {
    await handleSubmitReview({ type: "restaurant", id: restaurantId, token, comment, star, reviews, setComment, setReviews, setStar });
  };

  const handleDelete = async (token, reviewId) => {
    await authApis(token).delete(endpoints["reviews-restaurant-detail"](reviewId));
    console.log("Đang xóa đánh giá", reviewId);
    setReviewPage(1);
    await loadReviews();
  };
  
  const handleEdit = async (token, reviewId, editedComment) => {
    await authApis(token).patch(endpoints["reviews-restaurant-detail"](reviewId), {
      comment: editedComment
    });
    console.log("Cập nhật đánh giá", reviewId, editedComment);
    setModalVisible(false);
    setReviewPage(1);
    await loadReviews();
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {restaurant && (
        <View style={styles.restaurantCard}>
            <Image
            source={{ uri: restaurant.image || "https://picsum.photos/200" }}
            style={styles.restaurantAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
                <Text style={styles.star}>⭐{restaurant.star_rating}</Text>
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
            </View>
            <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Tin nhắn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonColor}
              onPress={handleFollow}
            >
              <Text style={styles.actionButtonTextColor}>
                {followStatus === "FOLLOW" ? "Hủy follow" : "Theo dõi"}
              </Text>
            </TouchableOpacity>
            </View>
        </View>
        )}

      {/* Tab buttons */}
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
        <TouchableOpacity onPress={() => setActiveTab("Menu")}>
          <Text style={{
            fontWeight: activeTab === "Menu" ? "bold" : "normal",
            color: activeTab === "Menu" ? "#e53935" : "#000",
          }}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("Đánh giá")}>
          <Text style={{
            fontWeight: activeTab === "Đánh giá" ? "bold" : "normal",
            color: activeTab === "Đánh giá" ? "#e53935" : "#000",
          }}>Đánh giá</Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1, paddingHorizontal: 10, backgroundColor: "#fff" }}>
        {activeTab === "Món ăn" ? (
          <FlatList
            key={"foods"}
            data={foods}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => {
              const currentPriceObj = item.prices.find(
                (p) => p.time_serve === currentTimeServe
              );
              const currentPrice = currentPriceObj ? currentPriceObj.price : 0;

              if (currentPrice === 0) return null;

              return (
                <TouchableOpacity
                  style={styles.foodCard}
                  onPress={() => nav.navigate("Food", { foodId: item.id })}
                >
                  <Image
                    source={{ uri: item.image || "https://picsum.photos/400" }}
                    style={styles.foodImage}
                  />
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.foodPrice}>
                    {currentPrice.toLocaleString()}đ
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Nhà hàng không hoạt động vào thời gian này</Text>
            )}
            onEndReached={() => {
              if (!loadingMore && foodPage > 0) setFoodPage(foodPage + 1);
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
          />
        ) : activeTab === "Menu" ? (
          <FlatList
            key={"menus"}
            data={menus}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => nav.navigate("MenuDetails", { menuId: item.id })}
              >
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>{item.name}</Text>
                  <Text style={styles.menuCount}>{item.foods?.length || 0} món</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <>
          { token && canReview && (
            <View style={styles.container}>
              <Image
                source={{
                  uri: currentUser.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                style={styles.reviewsAvatar}
              />

              <View style={styles.middleContent}>
                <Text style={styles.username}>{currentUser.username}</Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity key={i} onPress={() => setStar(i)}>
                      <Text style={[styles.star, { color: i <= star ? "#FFD700" : "#CCC" }]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.commentRow}>
                  <TextInput
                    placeholder="Nhận xét..."
                    value={comment}
                    onChangeText={setComment}
                    style={styles.textInput}
                    multiline
                  />
                  <TouchableOpacity onPress={() => handleSubmit(token)} style={styles.sendButton}>
                    <Icon source="send" size={22} color="#e53935" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          <FlatList
            key={"reviews"}
            data={reviews}
            renderItem={({ item }) => (
              <View style={styles.reviewsContainer}>
                <Image
                  source={{
                    uri:
                      item.image ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.reviewsAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>
                    {item.user_name}
                  </Text>
                  <Text>{item.comment}</Text>
                  <Text style={styles.star}>
                    ⭐ {item.star} / 5
                  </Text>
                </View>

                {currentUser && item.user === currentUser.id && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Tùy chọn", null, [
                        {
                          text: "Chỉnh sửa",
                          onPress: () => {
                            setEditingReview(item);
                            setEditedComment(item.comment);
                            setModalVisible(true);
                          },
                        },
                        {
                          text: "Xóa",
                          style: "destructive",
                          onPress: () => handleDelete(token, item.id),
                        },
                        { text: "Hủy", style: "cancel" },
                      ])
                    }
                  >
                    <Icon source="dots-vertical" size={20} color="gray" />
                  </TouchableOpacity>
                  )}
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Chưa có đánh giá nào</Text>
            )}
            onEndReached={() => {
              if (!loadingMore && reviewPage > 0) setReviewPage(reviewPage + 1);
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chỉnh sửa đánh giá</Text>
                <TextInput
                  style={styles.input}
                  value={editedComment}
                  onChangeText={setEditedComment}
                  placeholder="Nhập bình luận mới"
                  multiline
                />
                <View style={styles.modalButtons}>
                  <Button mode="contained"
                    onPress={() => {
                      handleEdit(token, editingReview.id, editedComment);
                      setModalVisible(false);
                    }}
                  >
                    Lưu
                  </Button>
                  <Button mode="text"
                    onPress={() => setModalVisible(false)}
                    style={{ marginLeft: 10 }}
                  >
                    Hủy
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
          </>
        )}
      </View>

    </View>
  );
};

export default RestaurantDetails;
