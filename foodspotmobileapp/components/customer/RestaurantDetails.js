import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Modal, Alert, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import Apis, { authApis,endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon, Button } from "react-native-paper";

const RestaurantDetails = ({ route }) => {
  const { restaurantId } = route.params;
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurant, setRestaurant] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("Món ăn");
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [followId, setFollowId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [star, setStar] = useState(0);
  const [userId, setUserId] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [currentTimeServe, setCurrentTimeServe] = useState(getCurrentTimeServe());
  const nav = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editedComment, setEditedComment] = useState("");

  function getCurrentTimeServe() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 11) {
        return 'MORNING';
    } else if (hour >= 11 && hour < 17) {
        return 'NOON';
    } else if (hour >= 17 && hour < 23) {
        return 'EVENING';
    } else if (hour >= 23 || hour < 5) {
        return 'NIGHT';
    } else {
        return null;
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
        setCurrentTimeServe(getCurrentTimeServe());
    }, 300 * 1000);

    return () => clearInterval(intervalId); // Clear interval khi rời trang
  }, []);

  const loadReviews = async () => {
    const reviewsRes = await Apis.get(endpoints["restaurant-reviews"](restaurantId));
    setReviews(reviewsRes.data);
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const menuRes = await Apis.get(endpoints["restaurant-menus"](restaurantId));
      setMenus(menuRes.data);

      const foodRes = await Apis.get(endpoints["restaurant-foods"](restaurantId));
      setFoods(foodRes.data);

      const restaurantRes = await Apis.get(endpoints["restaurant-details"](restaurantId));
      setRestaurant(restaurantRes.data);

      const id = await AsyncStorage.getItem("userId");
      setUserId(id)
    } catch (error) {
      console.error("Error loading restaurant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const userRes = await authApis(token).get(endpoints["users_current-user_read"]);
      setCurrentUser(userRes.data);
  
      const followRes = await authApis(token).get(endpoints["current-user-follow"]);
      if (followRes.data) {
        const follow = followRes.data.find((item) => item.restaurant === restaurantId);
        if (follow) {
          setFollowStatus(follow.status);
          setFollowId(follow.id);
        }
      } else {
        setFollowStatus("NOT_FOLLOWED");
      }
    } catch (error) {
      console.error("Error fetching auth data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkTokenAndLoadAuth= async () => {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          setToken(token)
          fetchAuthData();
          hasUserOrderedAtRestaurant();
        }else {
          setToken(null)
        }
      };
      fetchData();
      loadReviews();
      checkTokenAndLoadAuth();
    }, [restaurantId])
  );

  const hasUserOrderedAtRestaurant = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const ordersRes = await authApis(token).get(endpoints["orders"]);
      const userOrders = ordersRes.data;
      console.info(userOrders)
      const hasOrder = userOrders.some((order) => order.restaurant == restaurantId);
      console.info(hasOrder)
      if(hasOrder)
        setCanReview(true)
      
    } catch (error) {
      console.error("Error checking user orders:", error);
      return false;
    }
  };
  
  const handleFollow = async () => {
    const token = await AsyncStorage.getItem("token");
    if (followStatus === "FOLLOW") {
      // Hủy follow
      await authApis(token).patch(endpoints["follow-details"](followId), {
        status: "CANCEL"
      });
        setFollowStatus("CANCEL");
    } else if (followStatus === "CANCEL"){
      await authApis(token).patch(endpoints["follow-details"](followId), {
        status: "FOLLOW"
      });
      setFollowStatus("FOLLOW");
    } else {
      await authApis(token).post(endpoints["follow"], {
        user: userId,
        restaurant: restaurantId,
        status: "FOLLOW",
      });
      setFollowStatus("FOLLOW");
    }
  };

  const handleSubmit = async () => {
    if (!comment || star === 0) {
      alert("Vui lòng nhập đánh giá và chọn số sao.");
      return;
    }
    const token = await AsyncStorage.getItem("token");
    const res = await authApis(token).post(endpoints["reviews-restaurant"], {
      comment: comment,
      star: star,
      restaurant: restaurantId,
      user: parseInt(userId)
    });
    // Thêm đánh giá mới vào đầu danh sách
    setReviews([res.data, ...reviews]);
    setComment("");
    setStar(0);
  };

  const handleDelete = async (reviewId) => {
    const token = await AsyncStorage.getItem("token");
    await authApis(token).delete(endpoints["reviews-restaurant-detail"](reviewId));
    console.log("Đang xóa đánh giá", reviewId);
    await loadReviews();
  };
  
  const handleEdit = async (reviewId, editedComment) => {
    const token = await AsyncStorage.getItem("token");
    await authApis(token).patch(endpoints["reviews-restaurant-detail"](reviewId), {
      comment: editedComment
    });
    console.log("Cập nhật đánh giá", reviewId, editedComment);
    setModalVisible(false);
    await loadReviews();
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {restaurant && (
        <View style={styles.restaurantCard}>
            <Image
            source={{ uri: restaurant.avatar || "https://picsum.photos/200" }}
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
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <Text style={{ fontSize: 16, color: "#666" }}>
                  Nhà hàng không hoạt động vào thời gian này
                </Text>
              </View>
            }
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
                  uri: currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
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
                  <TouchableOpacity onPress={() => handleSubmit()} style={styles.sendButton}>
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
                      item.avatar ||
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
                          onPress: () => handleDelete(item.id),
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
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                Chưa có đánh giá nào
              </Text>
            }
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
                  <Button
                    mode="contained"
                    onPress={() => {
                      handleEdit(editingReview.id, editedComment);
                      setModalVisible(false);
                    }}
                  >
                    Lưu
                  </Button>
                  <Button
                    mode="text"
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

const styles = StyleSheet.create({
  foodCard: { width: "48%", backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 15, overflow: "hidden", elevation: 2 },
  foodImage: { width: "100%", height: 100, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  foodName: { fontSize: 14, fontWeight: "bold", marginTop: 6, marginHorizontal: 8 },
  foodPrice: { fontSize: 13, color: "#e53935", fontWeight: "bold", marginBottom: 8, marginHorizontal: 8 },
  menuItem: { backgroundColor: "#f1f1f1", borderRadius: 8, padding: 12, marginBottom: 12 },
  menuTitle: { fontSize: 16, fontWeight: "bold" },
  menuDesc: { fontSize: 13, color: "#666", marginTop: 4 },
  restaurantCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", padding: 10, borderRadius: 10, margin: 10, elevation: 2 },
  restaurantAvatar: { width: 50, height: 50, borderRadius: 25 },
  restaurantName: { fontSize: 16, fontWeight: "bold" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  star: { color: "#2ecc71", marginRight: 4 },
  ratingText: { color: "#2ecc71", fontWeight: "bold" },
  actionsColumn: { flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" },
  actionButton: { backgroundColor: "#eee", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
  actionButtonColor: { backgroundColor: "#9c27b0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
  actionButtonText: { fontWeight: "bold", color: "#333" },
  actionButtonTextColor: { fontWeight: "bold", color: "white" },
  menuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewsContainer: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 8, padding: 10, marginBottom: 10, alignItems: "flex-start",},
  reviewsAvatar: {width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ccc", },
  container: { flexDirection: "row", alignItems: "flex-start", padding: 8, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
  middleContent: { flex: 1 },
  username: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  starsRow: { flexDirection: "row", marginBottom: 4 },
  commentRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  textInput: { flex: 1, fontSize: 14, maxHeight: 60, padding: 0 },
  sendButton: { paddingLeft: 6 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

export default RestaurantDetails;
