import React, { useState, useEffect, useContext } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  ActivityIndicator,
  Chip,
  IconButton,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContexts";
import Toast from "react-native-toast-message";

const CLOUDINARY_BASE_URL = "http://res.cloudinary.com/ddke8odpp/image/upload/";

const MenuDetails = () => {
  const [menu, setMenu] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { menuId, restaurantId } = route.params || {};
  const [user] = useContext(MyUserContext);

  if (!user) {
    Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng đăng nhập!" });
    navigation.navigate("Login");
    return null;
  }

  if (!menuId || !restaurantId) {
    Toast.show({ type: "error", text1: "Lỗi", text2: "Thiếu ID menu hoặc nhà hàng!" });
    return null;
  }

  const fetchMenuDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng đăng nhập lại!" });
        navigation.navigate("Login");
        return;
      }
      const authApi = authApis(token);
      console.log("📡 Gọi API menu:", endpoints["menus-details"](menuId));
      console.log("📡 Gọi API foods:", `${endpoints["menus-details"](menuId)}foods/`);

      const menuResponse = await authApi.get(endpoints["menus-details"](menuId));
      const foodsResponse = await authApi.get(`${endpoints["menus-details"](menuId)}foods/`);

      console.log("📥 Menu response:", menuResponse.data);
      console.log("📥 Foods response:", foodsResponse.data);

      setMenu(menuResponse.data);
      const foodsData = (foodsResponse.data.results || []).map(food => ({
        ...food,
        image: food.image && !food.image.startsWith("http")
          ? `${CLOUDINARY_BASE_URL}${food.image}`
          : food.image,
      }));
      console.log("📸 Processed food images:", foodsData.map(f => ({ id: f.id, image: f.image })));
      setFoods(foodsData);
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải chi tiết menu!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Login");
      } else if (ex.response?.status === 403) {
        errorMessage = "Bạn không có quyền xem menu này!";
      } else if (ex.response?.status === 404) {
        errorMessage = "Menu không tồn tại!";
      }
      console.error("Lỗi tải chi tiết menu:", ex.response?.data || ex.message);
      Toast.show({ type: "error", text1: "Lỗi", text2: errorMessage });
      setFoods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("🚀 Fetching menu details for menuId:", menuId);
    if (menuId && restaurantId) {
      fetchMenuDetails();
    }
  }, [menuId, restaurantId]);

  const onRefresh = () => {
    setRefreshing(true);
    setFoods([]);
    fetchMenuDetails();
  };

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("🔍 Current foods in menu:", foods.length);
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
          {item.prices.length > 0 ? (
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
    </Card>
  );

  const renderMenuInfo = () => (
    <Card style={[styles.card, styles.menuInfoCard]}>
      <Card.Content>
        <Title style={styles.menuName}>{menu?.name || "Đang tải..."}</Title>
        <Paragraph style={styles.menuDetail}>
          Nhà hàng: {menu?.restaurant_name || "Chưa xác định"}
        </Paragraph>
        <Paragraph style={styles.menuDetail}>
          Mô tả: {menu?.description || "Chưa có mô tả"}
        </Paragraph>
        <Paragraph style={styles.menuDetail}>
          Thời gian phục vụ: {menu?.time_serve || "Chưa xác định"}
        </Paragraph>
        <Chip
          style={[
            styles.statusChip,
            { backgroundColor: menu?.is_active ? "#e6ffed" : "#ffe6e6" },
          ]}
          textStyle={{ color: menu?.is_active ? "#2e7d32" : "#d32f2f" }}
        >
          {menu?.is_active ? "Đang hoạt động" : "Tạm dừng"}
        </Chip>
      </Card.Content>
    </Card>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <View style={[styles.card, styles.skeletonCard]}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
        </View>
      </View>
      <View style={[styles.card, styles.skeletonCard]}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Title style={styles.title}>Chi tiết Menu</Title>
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
      {loading && !menu ? (
        renderLoadingSkeleton()
      ) : (
        <FlatList
          data={filteredFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={menu && renderMenuInfo()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Paragraph style={styles.emptyText}>
                {searchQuery ? "Không tìm thấy món ăn phù hợp" : "Chưa có món ăn nào trong menu"}
              </Paragraph>
              <TouchableOpacity onPress={onRefresh}>
                <Paragraph style={styles.retryText}>Thử làm mới</Paragraph>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#f8f9fa",
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuInfoCard: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  foodImage: {
    width: 80,
    height: 80,
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
    fontSize: 12,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "center",
  },
  menuName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  menuDetail: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  foodDetail: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  statusChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginBottom: 10,
  },
  retryText: {
    color: "#6200ee",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  skeletonCard: {
    flexDirection: "row",
    padding: 12,
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    width: "60%",
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLine: {
    width: "80%",
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 6,
  },
});

export default MenuDetails;