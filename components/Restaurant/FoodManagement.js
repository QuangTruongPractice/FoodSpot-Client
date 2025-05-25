import React, { useState, useEffect, useContext } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  Platform,
  TouchableOpacity,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  const fetchFoods = async (url = `${endpoints.foods}?restaurant_id=${restaurantId}`) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(url);
      console.log("Danh sách món ăn:", JSON.stringify(response.data.results, null, 2));
      const data = Array.isArray(response.data.results) ? response.data.results : [];
      setFoods((prev) => (url.includes("page=") ? [...prev, ...data] : data));
      setNextPage(response.data.next);
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
      Alert.alert("Lỗi", errorMessage);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleDelete = async (foodId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa món ăn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem("access_token");
              const authApi = authApis(token);
              await authApi.delete(endpoints["food-details"](foodId));
              setFoods((prev) => prev.filter((food) => food.id !== foodId));
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Món ăn đã được xóa!",
              });
            } catch (ex) {
              let errorMessage = ex.message || "Không thể xóa món ăn!";
              if (ex.response?.status === 401) {
                errorMessage = "Phiên đăng nhập hết hạn!";
                await AsyncStorage.removeItem("access_token");
                navigation.navigate("Auth", { screen: "Login" });
              } else if (ex.response?.status === 403) {
                errorMessage = "Bạn không có quyền xóa món ăn này!";
              }
              console.error("Lỗi xóa món ăn:", ex.response?.data || ex.message);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: errorMessage,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleAvailability = async (foodId, currentStatus) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      const authApi = authApis(token);
      console.log(`Cập nhật is_available cho món ${foodId}: ${!currentStatus}`);
      const response = await authApi.patch(endpoints["food-details"](foodId), {
        is_available: !currentStatus,
      });
      console.log("Phản hồi API:", response.data);
      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? { ...food, is_available: response.data.is_available }
            : food
        )
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Món ăn đã được ${response.data.is_available ? "kích hoạt" : "tạm ẩn"}!`,
      });
    } catch (ex) {
      let errorMessage = ex.message || "Không thể cập nhật trạng thái!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      } else if (ex.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật món ăn này!";
      }
      console.error("Lỗi cập nhật is_available:", ex.response?.data || ex.message);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food) => {
    console.log("Chỉnh sửa món:", food);
    navigation.navigate("AddFood", {
      restaurantId,
      foodData: {
        id: food.id,
        name: food.name,
        description: food.description,
        categoryId: food.food_category.toString(),
        prices: food.prices,
        image: food.image,
        is_available: food.is_available,
      },
    });
  };

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFoodItem = ({ item }) => {
    console.log(`Món ${item.name}: is_available=${item.is_available}, image=${item.image}`);
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {item.image ? (
            <Image
              source={{ uri: item.image, cache: "reload" }}
              style={styles.foodImage}
              resizeMode="cover"
              defaultSource={require("../../assets/splash-icon.png")}
              key={item.image}
              onError={(e) => console.log(`Lỗi tải ảnh ${item.name}:`, e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.foodImage, styles.noImage]}>
              <Paragraph>Không có ảnh</Paragraph>
            </View>
          )}
          <View style={styles.foodInfo}>
            <Title style={styles.foodName}>{item.name}</Title>
            <Paragraph style={styles.foodDetail}>
              Danh mục: {item.food_category_name || "Chưa xác định"}
            </Paragraph>
            {item.prices.map((price, index) => (
              <Paragraph key={index} style={styles.foodDetail}>
                Giá ({price.time_serve}): {price.price.toLocaleString("vi-VN")} VNĐ
              </Paragraph>
            ))}
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
            onPress={() => handleEdit(item)}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            Sửa
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
            labelStyle={[styles.actionButtonLabel, { color: "#d32f2f" }]}
          >
            Xóa
          </Button>
          <Button
            mode="contained"
            onPress={() => handleToggleAvailability(item.id, item.is_available)}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            {item.is_available ? "Tạm ẩn" : "Kích hoạt"}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

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
        >
          Thêm món ăn
        </Button>
      </View>
      <TextInput
        label="Tìm kiếm món ăn"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        mode="outlined"
        theme={{ roundness: 8 }}
        dense
        left={<TextInput.Icon icon="magnify" />}
      />
      <FlatList
        data={filteredFoods}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Paragraph style={styles.emptyText}>
            Không tìm thấy món ăn nào.
          </Paragraph>
        }
        ListFooterComponent={
          nextPage && !loading ? (
            <Button
              mode="outlined"
              onPress={() => fetchFoods(nextPage)}
              style={styles.loadMoreButton}
            >
              Tải thêm
            </Button>
          ) : null
        }
      />
      <Portal>
        <Modal
          visible={loading}
          dismissable={false}
          contentContainerStyle={styles.modal}
        >
          <ActivityIndicator size="large" color="#6200ee" />
          <Title style={styles.modalText}>Đang xử lý...</Title>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
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
  },
  cardActions: {
    justifyContent: "flex-end",
    padding: 8,
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 6,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 32,
  },
  loadMoreButton: {
    marginVertical: 16,
    alignSelf: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 24,
    margin: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  modalText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
  },
});

export default FoodManagement;