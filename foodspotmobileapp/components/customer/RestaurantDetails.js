import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Apis, { authApis,endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RestaurantDetails = ({ route }) => {
  const { restaurantId } = route.params;
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurant, setRestaurant] = useState([]);
  const [activeTab, setActiveTab] = useState("Món ăn");
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [followId, setFollowId] = useState(null);
  const [currentTimeServe, setCurrentTimeServe] = useState(getCurrentTimeServe());
  const nav = useNavigation();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const menuRes = await Apis.get(endpoints["restaurant-menus"](restaurantId));
        setMenus(menuRes.data);

        const foodRes = await Apis.get(endpoints["restaurant-foods"](restaurantId));
        setFoods(foodRes.data);

        const res = await Apis.get(endpoints["restaurant-details"](restaurantId));
        setRestaurant(res.data);

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          nav.replace("Login");
          return;
        }
        const followRes = await authApis(token).get(endpoints["current-user-follow"]);
        if (followRes.data) {
          // Nếu tìm thấy dữ liệu follow, kiểm tra status
          const follow = followRes.data.find(
            (item) => item.restaurant === restaurantId
          );
          if (follow) {
            setFollowStatus(follow.status); // Lưu trạng thái FOLLOW hoặc CANCEL
            setFollowId(follow.id);
          }
        } else {
          setFollowStatus("NOT_FOLLOWED"); // Người dùng chưa follow nhà hàng này
        }
      } catch (error) {
        console.error("Error loading restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const handleFollow = async () => {
    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");
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
          <Text
            style={{
              fontWeight: activeTab === "Món ăn" ? "bold" : "normal",
              color: activeTab === "Món ăn" ? "#e53935" : "#000",
            }}
          >
            Món ăn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("Menu")}>
          <Text
            style={{
              fontWeight: activeTab === "Menu" ? "bold" : "normal",
              color: activeTab === "Menu" ? "#e53935" : "#000",
            }}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1, paddingHorizontal: 10, backgroundColor: "#fff" }}>
        {activeTab === "Món ăn" ? (
            <FlatList
            key={"foods"} // Buộc render lại khi tab đổi
            data={foods}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => {
              // Lấy giá tại time_serve hiện tại
              const currentTimeServe = getCurrentTimeServe(); // Hàm giả định để lấy thời gian hiện tại
              const currentPriceObj = item.prices.find(
                (p) => p.time_serve === currentTimeServe
              );
              const currentPrice = currentPriceObj ? currentPriceObj.price : 0;
        
              // Nếu giá = 0 thì không hiển thị
              if (currentPrice === 0) {
                return null; // Không render gì nếu giá bằng 0
              }
        
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
                    {currentPrice > 0
                      ? currentPrice.toLocaleString() + "đ"
                      : "Đang cập nhật"}
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
        ) : (
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
                    <Text style={styles.menuCount}>{item.foods?.length || 0} </Text>
                  </View>
                </TouchableOpacity>
              )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            />
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
});

export default RestaurantDetails;
