import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MyUserContext } from "../../configs/MyContexts";
import APis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

const EditFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { foodId, foodID, restaurantId } = route.params || {};
  const finalFoodId = foodId || foodID;
  const [foodData, setFoodData] = useState({
    name: "",
    description: "",
    food_category: "",
    is_available: true,
    image: null, // Đối tượng ảnh mới (nếu có)
  });
  const [prices, setPrices] = useState([{ time_serve: "NOON", price: "", id: Date.now() }]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null); // URL ảnh hiện tại từ server

  const timeServeOptions = [
    { key: "MORNING", label: "Sáng" },
    { key: "NOON", label: "Trưa" },
    { key: "EVENING", label: "Chiều" },
    { key: "NIGHT", label: "Tối" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const token = await AsyncStorage.getItem("access_token");

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
        const [foodResponse, categoriesResponse] = await Promise.all([
          authApi.get(endpoints["food-details"](finalFoodId)),
          APis.get(endpoints["foods-category"], {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const food = foodResponse.data;
        const categoriesData = Array.isArray(categoriesResponse.data.results)
          ? categoriesResponse.data.results
          : categoriesResponse.data;

        setFoodData({
          name: food.name || "",
          description: food.description || "",
          food_category: food.food_category ? food.food_category.toString() : "",
          is_available: food.is_available !== undefined ? food.is_available : true,
          image: null, // Không lưu URL mà để null, URL được lưu trong originalImageUrl
        });

        setPrices(
          food.prices && food.prices.length > 0
            ? food.prices.map((p) => ({
                time_serve: p.time_serve,
                price: p.price.toString(),
                id: Date.now() + Math.random(),
              }))
            : [{ time_serve: "NOON", price: "", id: Date.now() }]
        );

        setOriginalImageUrl(food.image);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error.response?.data || error.message);
        let errorMessage = "Không thể tải thông tin món ăn!";
        if (error.response?.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn!";
          await AsyncStorage.removeItem("access_token");
          navigation.navigate("Auth", { screen: "Login" });
        } else if (error.response?.status === 403) {
          errorMessage = "Bạn không có quyền truy cập món ăn này!";
        } else if (error.response?.status === 404) {
          errorMessage = "Không tìm thấy món ăn!";
        }

        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: errorMessage,
        });
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    if (!restaurantId || !finalFoodId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: `Thiếu thông tin: ${!restaurantId ? "restaurantId" : ""}${
          !restaurantId && !finalFoodId ? " và " : ""
        }${!finalFoodId ? "foodId" : ""}`,
      });
      navigation.goBack();
      return;
    }

    fetchData();
  }, [finalFoodId, restaurantId, user, navigation]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Quyền truy cập thư viện ảnh bị từ chối!",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFoodData({ ...foodData, image: result.assets[0] });
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã chọn ảnh món ăn!",
      });
    }
  };

  const updateField = (field, value) => {
    setFoodData({ ...foodData, [field]: value });
  };

  const updatePrice = (id, field, value) => {
    if (field === "price") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setPrices(prices.map((price) => (price.id === id ? { ...price, [field]: numericValue } : price)));
    } else {
      setPrices(prices.map((price) => (price.id === id ? { ...price, [field]: value } : price)));
    }
  };

  const addPriceSlot = () => {
    const newPrice = {
      time_serve: "NOON",
      price: "",
      id: Date.now(),
    };
    setPrices([...prices, newPrice]);
  };

  const removePriceSlot = (id) => {
    if (prices.length === 1) {
      Alert.alert("Thông báo", "Phải có ít nhất một mức giá!");
      return;
    }
    setPrices(prices.filter((price) => price.id !== id));
  };

  const isTimeServeUsed = (timeServe, currentId) => {
    return prices.some((price) => price.time_serve === timeServe && price.id !== currentId);
  };

  const getSelectedCategoryName = () => {
    if (!foodData.food_category) return "Chọn danh mục";
    const selectedCategory = categories.find((cat) => cat.id.toString() === foodData.food_category);
    return selectedCategory ? selectedCategory.name : "Chọn danh mục";
  };

  const handleSelectCategory = (categoryId) => {
    setFoodData({ ...foodData, food_category: categoryId.toString() });
    setShowCategoryModal(false);
  };

  const validatePrices = () => {
    for (let price of prices) {
      if (!price.price || parseInt(price.price) <= 0) {
        return false;
      }
    }
    const timeServes = prices.map((p) => p.time_serve);
    const uniqueTimeServes = [...new Set(timeServes)];
    return timeServes.length === uniqueTimeServes.length;
  };
  const handleUpdateFood = async () => {
      // Validation
      if (!foodData.name) {
        Alert.alert("Lỗi", "Vui lòng điền tên món ăn!");
        return;
      }
      if (!foodData.food_category) {
        Alert.alert("Lỗi", "Vui lòng chọn danh mục!");
        return;
      }
      if (!validatePrices()) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ giá hợp lệ và không trùng thời gian phục vụ!");
        return;
      }

      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("access_token");
        const authApi = authApis(token);

        // Chuẩn bị FormData
        let form = new FormData();
        form.append("name", foodData.name);
        form.append("description", foodData.description || "");
        form.append("food_category", parseInt(foodData.food_category));
        form.append("restaurant", parseInt(restaurantId));
        form.append("is_available", foodData.is_available.toString());

        // Chỉ thêm image vào FormData nếu có ảnh mới được chọn
        if (foodData.image === "") {
            form.append("image", "");
        } else if (foodData.image && foodData.image.uri) {
            form.append("image", {
                uri: foodData.image.uri,
                name: foodData.image.fileName,
                type: foodData.image.type && foodData.image.type.startsWith('image/')
                ? foodData.image.type
                : 'image/jpeg'
            });
        }

        console.log("🔍 Sending PATCH request with FormData");

        // Gửi yêu cầu cập nhật món ăn
        const response = await authApi.patch(endpoints["food-details"](finalFoodId), form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Cập nhật giá
        const foodResponse = await authApi.get(endpoints["food-details"](finalFoodId));
        const existingPrices = foodResponse.data.prices || [];

        const pricePromises = prices.map(async (priceItem) => {
          const pricePayload = {
            time_serve: priceItem.time_serve,
            price: parseInt(priceItem.price),
          };

          const existingPrice = existingPrices.find((p) => p.time_serve === priceItem.time_serve);
          if (existingPrice) {
            return authApi.patch(
              endpoints["food-update-price"](finalFoodId),
              pricePayload,
              { headers: { "Content-Type": "application/json" } }
            );
          } else {
            return authApi.post(
              endpoints["food-add-price"](finalFoodId),
              pricePayload,
              { headers: { "Content-Type": "application/json" } }
            );
          }
        });

        const currentTimeServes = prices.map((p) => p.time_serve);
        const pricesToDelete = existingPrices.filter((p) => !currentTimeServes.includes(p.time_serve));
        const deletePromises = pricesToDelete.map((price) =>
          authApi.delete(endpoints["food-delete-price"](finalFoodId), {
            params: { time_serve: price.time_serve },
          })
        );

        await Promise.all([...pricePromises, ...deletePromises]);

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Cập nhật món ăn với ${prices.length} mức giá thành công!`,
        });
        navigation.goBack();
      } catch (error) {
        let errorMessage = "Không thể cập nhật món ăn! Vui lòng kiểm tra lại.";
        if (error.response?.data) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.details) {
            if (typeof error.response.data.details === "object") {
              const details = Object.entries(error.response.data.details).map(([key, value]) =>
                Array.isArray(value) ? `${key}: ${value.join("; ")}` : `${key}: ${value}`
              );
              errorMessage = details.join("; ");
            } else {
              errorMessage = error.response.data.details;
            }
          } else {
            const errors = Object.entries(error.response.data).map(([key, value]) =>
              Array.isArray(value) ? `${key}: ${value.join(", ")}` : `${key}: ${value}`
            );
            errorMessage = errors.join("; ");
          }
        } else if (error.code === "ECONNABORTED") {
          errorMessage = "Yêu cầu hết thời gian. Vui lòng kiểm tra kết nối mạng.";
        } else if (error.response?.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn!";
          await AsyncStorage.removeItem("access_token");
          navigation.navigate("Auth", { screen: "Login" });
        } else if (error.response?.status === 403) {
          errorMessage = "Bạn không có quyền chỉnh sửa món ăn này!";
        }

        Alert.alert("Lỗi", errorMessage);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: errorMessage,
        });
        console.error("Lỗi cập nhật món ăn:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

  const renderPriceSlot = (priceItem, index) => (
    <View key={priceItem.id} style={styles.priceSlotContainer}>
      <View style={styles.priceSlotHeader}>
        <Text style={styles.priceSlotTitle}>Giá #{index + 1}</Text>
        {prices.length > 1 && (
          <TouchableOpacity
            style={styles.removePriceButton}
            onPress={() => removePriceSlot(priceItem.id)}
            disabled={loading}
          >
            <Text style={styles.removePriceButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Thời gian phục vụ *</Text>
      <View style={styles.timeServeButtons}>
        {timeServeOptions.map((option) => {
          const isUsed = isTimeServeUsed(option.key, priceItem.id);
          const isSelected = priceItem.time_serve === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeServeButton,
                isSelected && styles.selectedTimeServe,
                isUsed && !isSelected && styles.disabledTimeServe,
              ]}
              onPress={() => updatePrice(priceItem.id, "time_serve", option.key)}
              disabled={loading || (isUsed && !isSelected)}
            >
              <Text
                style={[
                  styles.timeServeButtonText,
                  isSelected && styles.selectedTimeServeText,
                  isUsed && !isSelected && styles.disabledTimeServeText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Giá (VNĐ) *</Text>
      <TextInput
        style={styles.priceInput}
        placeholder="0"
        value={priceItem.price}
        onChangeText={(text) => updatePrice(priceItem.id, "price", text)}
        keyboardType="numeric"
        editable={!loading}
      />
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải thông tin món ăn...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Chỉnh Sửa Món Ăn</Text>

      <Text style={styles.label}>Tên món ăn *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên món ăn"
        value={foodData.name}
        onChangeText={(text) => updateField("name", text)}
        editable={!loading}
      />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Nhập mô tả món ăn"
        value={foodData.description}
        onChangeText={(text) => updateField("description", text)}
        multiline
        editable={!loading}
      />

      <Text style={styles.label}>Danh mục món ăn *</Text>
      <TouchableOpacity
        style={styles.categorySelector}
        onPress={() => setShowCategoryModal(true)}
        disabled={loading}
      >
        <Text
          style={[styles.categorySelectorText, !foodData.food_category && styles.placeholderText]}
        >
          {getSelectedCategoryName()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Ảnh món ăn</Text>
      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={pickImage}
        disabled={loading}
      >
        <Text style={[styles.imagePickerText, loading && styles.disabledText]}>
          {foodData.image
            ? "Thay đổi ảnh món ăn..."
            : originalImageUrl
            ? "Chọn ảnh mới..."
            : "Chọn ảnh món ăn..."}
        </Text>
      </TouchableOpacity>

      {originalImageUrl && !foodData.image && (
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.imageLabel}>Ảnh hiện tại:</Text>
          <Image source={{ uri: originalImageUrl }} style={styles.imagePreview} />
        </View>
      )}

      {foodData.image && (
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.imageLabel}>Ảnh mới:</Text>
          <Image source={{ uri: foodData.image.uri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => updateField("image", null)}
            disabled={loading}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.availabilityContainer}>
        <Text style={styles.label}>Trạng thái món ăn</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            {foodData.is_available ? "Có sẵn" : "Hết hàng"}
          </Text>
          <Switch
            value={foodData.is_available}
            onValueChange={(value) => updateField("is_available", value)}
            trackColor={{ false: "#ccc", true: "#6200ee" }}
            thumbColor={foodData.is_available ? "#fff" : "#f4f3f4"}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.pricesSection}>
        <View style={styles.pricesSectionHeader}>
          <Text style={styles.pricesSectionTitle}>Giá món ăn *</Text>
          <TouchableOpacity
            style={styles.addPriceButton}
            onPress={addPriceSlot}
            disabled={loading || prices.length >= 4}
          >
            <Text style={styles.addPriceButtonText}>+ Thêm giá</Text>
          </TouchableOpacity>
        </View>

        {prices.map((priceItem, index) => renderPriceSlot(priceItem, index))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleUpdateFood}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Đang cập nhật..." : "Cập nhật món ăn"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục món ăn</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    foodData.food_category === item.id.toString() && styles.selectedCategoryItem,
                  ]}
                  onPress={() => handleSelectCategory(item.id)}
                >
                  <Text
                    style={[
                      styles.categoryItemText,
                      foodData.food_category === item.id.toString() &&
                        styles.selectedCategoryItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {foodData.food_category === item.id.toString() && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  categorySelector: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  imagePickerButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  imagePickerText: {
    fontSize: 16,
    color: "#6200ee",
  },
  disabledText: {
    color: "#999",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
    alignItems: "center",
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  imageLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  availabilityContainer: {
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  pricesSection: {
    marginBottom: 20,
  },
  pricesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pricesSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addPriceButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPriceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  priceSlotContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  priceSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceSlotTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6200ee",
  },
  removePriceButton: {
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removePriceButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  timeServeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  timeServeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  selectedTimeServe: {
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
  },
  disabledTimeServe: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
  timeServeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedTimeServeText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledTimeServeText: {
    color: "#999",
  },
  priceInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: "#6200ee",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedCategoryItem: {
    backgroundColor: "#f0f8ff",
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectedCategoryItemText: {
    color: "#6200ee",
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 16,
    color: "#6200ee",
    fontWeight: "bold",
  },
});

export default EditFood;