import React, { useState, useEffect, useContext } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  ActivityIndicator,
  Portal,
  Modal,
  Chip,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContexts";
import Toast from "react-native-toast-message";

const FoodManagement = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Debug để xem structure của params
  console.log("🔍 Full route params:", JSON.stringify(route.params, null, 2));
  
  const restaurantId = route.params?.restaurantId;
  const [user] = useContext(MyUserContext);

  console.log("🏪 Restaurant ID:", restaurantId);
  
  // Kiểm tra nếu không có restaurantId
  if (!restaurantId) {
    console.error("❌ Restaurant ID không tồn tại!");
    Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: "Không tìm thấy ID nhà hàng!",
    });
    return null;
  }

  const fetchFoods = async (url) => {
    // Nếu không có url, tạo URL mới theo format đúng
    if (!url) {
      url = `/restaurants/${restaurantId}/foods/`;
    }
    
    console.log("🔍 Đang gọi URL:", url);
    console.log("🏪 Restaurant ID:", restaurantId);
    console.log("👤 User:", user);
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      console.log("🔑 Token exists:", !!token);
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Vui lòng đăng nhập lại!",
        });
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      console.log("📡 Gọi API với URL:", url);
      const response = await authApi.get(url);
      console.log("📥 Response status:", response.status);
      console.log("📦 Response data:", JSON.stringify(response.data, null, 2));
      
      // SỬA CHÍNH TẠI ĐÂY - Xử lý response data đúng cách
      let data = [];
      if (Array.isArray(response.data)) {
        // Nếu response.data là array trực tiếp
        data = response.data;
        setNextPage(null); // Không có pagination
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Nếu có pagination với results
        data = response.data.results;
        setNextPage(response.data.next);
      } else {
        // Fallback
        data = [];
      }
      
      console.log("🍽️ Số món ăn nhận được:", data.length);
      console.log("🔍 Chi tiết món ăn:", data.map(food => ({ id: food.id, name: food.name, available: food.is_available })));
      
      setFoods((prev) => (url.includes("page=") ? [...prev, ...data] : data));
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải danh sách món ăn!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      } else if (ex.response?.status === 403) {
        errorMessage = "Bạn không có quyền xem món ăn của nhà hàng này!";
      }
      console.error("Lỗi tải món ăn:", ex.response?.data || ex.message);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
      setFoods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("🚀 Component mounted, fetching foods...");
    if (restaurantId) {
      fetchFoods(`/restaurants/${restaurantId}/foods/`);
    }
  }, [restaurantId]);

  const onRefresh = () => {
    setRefreshing(true);
    setFoods([]);
    fetchFoods(`/restaurants/${restaurantId}/foods/`);
  };

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("🔍 Current foods state:", foods.length);
  console.log("🔍 Filtered foods:", filteredFoods.length);

  const renderFoodItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {item.image ? (
          <Image
            source={{ uri: item.image, cache: "reload" }}
            style={styles.foodImage}
            resizeMode="cover"
            onError={(e) => console.log(`Lỗi tải ảnh ${item.name}:`, e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.foodImage, styles.noImage]}>
            <Paragraph style={styles.noImageText}>Không có ảnh</Paragraph>
          </View>
        )}
        <View style={styles.foodInfo}>
          <Title style={styles.foodName}>{item.name}</Title>
          <Paragraph style={styles.foodDetail}>
            Danh mục: {item.food_category_name || "Chưa xác định"}
          </Paragraph>
          {item.prices && item.prices.length > 0 ? (
            item.prices.map((price, index) => (
              <Paragraph key={index} style={styles.foodDetail}>
                Giá ({price.time_serve}): {price.price.toLocaleString("vi-VN")} VNĐ
              </Paragraph>
            ))
          ) : (
            <Paragraph style={styles.foodDetail}>Chưa có giá</Paragraph>
          )}
          <Paragraph style={styles.foodDetail}>
            Mô tả: {item.description || "Chưa có mô tả"}
          </Paragraph>
          <Paragraph style={styles.foodDetail}>
            Đánh giá: {item.star_rating ? item.star_rating.toFixed(2) : "Chưa có"}
          </Paragraph>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: item.is_available ? "#e6ffed" : "#ffe6e6" },
            ]}
            textStyle={{ color: item.is_available ? "#2e7d32" : "#d32f2f" }}
          >
            {item.is_available ? "Có sẵn" : "Tạm ẩn"}
          </Chip>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("EditFood", { restaurantId, food: item })}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
        >
          Sửa
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("DeleteFood", { foodId: item.id })}
          style={styles.actionButton}
          labelStyle={[styles.actionButtonLabel, { color: "#d32f2f" }]}
        >
          Xóa
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("ToggleAvailability", { foodId: item.id, currentStatus: item.is_available })}
          style={[styles.actionButton, { backgroundColor: item.is_available ? "#d32f2f" : "#2e7d32" }]}
          labelStyle={styles.actionButtonLabel}
        >
          {item.is_available ? "Tạm ẩn" : "Kích hoạt"}
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Quản lý Món Ăn</Title>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("AddFood", { restaurantId })}
          style={styles.addButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="plus"
        >
          Thêm món
        </Button>
      </View>
      <TextInput
        label="Tìm kiếm món ăn"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        mode="outlined"
        theme={{ roundness: 10 }}
        dense
        left={<TextInput.Icon icon="magnify" />}
      />
      {loading && foods.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Title style={styles.loadingText}>Đang tải món ăn...</Title>
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Paragraph style={styles.emptyText}>
                {searchQuery ? "Không tìm thấy món ăn phù hợp" : "Chưa có món ăn nào"}
              </Paragraph>
              {!searchQuery && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("AddFood", { restaurantId })}
                  style={styles.emptyButton}
                  icon="plus"
                >
                  Thêm món đầu tiên
                </Button>
              )}
            </View>
          }
          ListFooterComponent={
            nextPage && !loading ? (
              <Button
                mode="outlined"
                onPress={() => fetchFoods(nextPage)}
                style={styles.loadMoreButton}
                labelStyle={styles.loadMoreLabel}
              >
                Tải thêm
              </Button>
            ) : null
          }
        />
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    borderRadius: 10,
    backgroundColor: "#6200ee",
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#666",
    fontSize: 14,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  foodDetail: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  statusChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  cardActions: {
    justifyContent: "flex-end",
    padding: 8,
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 6,
    borderColor: "#6200ee",
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#6200ee",
    borderRadius: 10,
  },
  loadMoreButton: {
    marginVertical: 12,
    alignSelf: "center",
    borderColor: "#6200ee",
  },
  loadMoreLabel: {
    fontSize: 14,
    color: "#6200ee",
  },
});

export default FoodManagement;