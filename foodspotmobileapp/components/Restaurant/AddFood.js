import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  Image
} from "react-native";
import { MyUserContext } from "../../configs/MyContexts";
import APis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import Toast from "react-native-toast-message";

const AddFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurantId } = route.params;
  const [foodData, setFoodData] = useState({
    name: "",
    description: "",
    food_category: "",
    is_available: true,
    image: null
  });
  
  // State cho nhiều giá
  const [prices, setPrices] = useState([
    { time_serve: "NOON", price: "", id: Date.now() }
  ]);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const timeServeOptions = [
    { key: "MORNING", label: "Sáng" },
    { key: "NOON", label: "Trưa" },
    { key: "EVENING", label: "Chiều" },
    { key: "NIGHT", label: "Tối" },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("access_token");
        const response = await APis.get(endpoints["foods-category"], {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(response.data.results) ? response.data.results : response.data;
        setCategories(data);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải danh sách danh mục!");
        console.error("Lỗi tải danh mục:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Hàm chọn ảnh từ thư viện
  const picker = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Quyền truy cập thư viện ảnh bị từ chối!"
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: "photo",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (!result.canceled) {
      updateField("image", result.assets[0]);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã chọn ảnh món ăn!"
      });
    }
  };

  const updateField = (field, value) => {
    setFoodData({ ...foodData, [field]: value });
  };

  // Cập nhật giá theo thời gian phục vụ
  const updatePrice = (id, field, value) => {
    if (field === "price") {
      const numericValue = value.replace(/[^0-9]/g, '');
      setPrices(prices.map(price => 
        price.id === id ? { ...price, [field]: numericValue } : price
      ));
    } else {
      setPrices(prices.map(price => 
        price.id === id ? { ...price, [field]: value } : price
      ));
    }
  };

  // Thêm khung giá mới
  const addPriceSlot = () => {
    const newPrice = {
      time_serve: "NOON",
      price: "",
      id: Date.now()
    };
    setPrices([...prices, newPrice]);
  };

  // Xóa khung giá
  const removePriceSlot = (id) => {
    if (prices.length === 1) {
      Alert.alert("Thông báo", "Phải có ít nhất một mức giá!");
      return;
    }
    setPrices(prices.filter(price => price.id !== id));
  };

  // Kiểm tra xem thời gian phục vụ đã được chọn chưa
  const isTimeServeUsed = (timeServe, currentId) => {
    return prices.some(price => price.time_serve === timeServe && price.id !== currentId);
  };

  const getSelectedCategoryName = () => {
    if (!foodData.food_category) return "Chọn danh mục";
    const selectedCategory = categories.find(cat => cat.id.toString() === foodData.food_category);
    return selectedCategory ? selectedCategory.name : "Chọn danh mục";
  };

  const handleSelectCategory = (categoryId) => {
    setFoodData({ ...foodData, food_category: categoryId.toString() });
    setShowCategoryModal(false);
  };

  const validatePrices = () => {
    // Kiểm tra tất cả các giá đã được nhập
    for (let price of prices) {
      if (!price.price || parseInt(price.price) <= 0) {
        return false;
      }
    }

    // Kiểm tra không có thời gian phục vụ trùng lặp
    const timeServes = prices.map(p => p.time_serve);
    const uniqueTimeServes = [...new Set(timeServes)];
    if (timeServes.length !== uniqueTimeServes.length) {
      return false;
    }

    return true;
  };

  const handleAddFood = async () => {
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
      
      // Bước 1: Tạo món ăn mới với FormData để gửi kèm ảnh
      let form = new FormData();
      form.append("name", foodData.name);
      form.append("description", foodData.description || "");
      form.append("food_category", parseInt(foodData.food_category));
      form.append("restaurant", parseInt(restaurantId));
      form.append("is_available", foodData.is_available);

      // Thêm ảnh nếu có
      if (foodData.image) {
        form.append("image", {
          uri: foodData.image.uri,
          name: foodData.image.fileName,
          type: user.avatar.type && user.avatar.type.startsWith('image/')
          ? user.avatar.type
          : 'image/jpeg'
        });
      }

      console.log("Creating food with FormData");

      // Tạo món ăn mới với ảnh
      const createFoodResponse = await authApis(token).post(
        endpoints["foods"],
        form,
        {
          headers: { 
            "Content-Type": "multipart/form-data" 
          },
        }
      );

      const newFoodId = createFoodResponse.data.id;
      console.log("Created food with ID:", newFoodId);

      // Bước 2: Thêm tất cả các giá cho món ăn vừa tạo
      const pricePromises = prices.map(priceItem => {
        const pricePayload = {
          time_serve: priceItem.time_serve,
          price: parseInt(priceItem.price),
        };

        console.log("Adding price with payload:", pricePayload);

        return authApis(token).post(
          endpoints["food-add-price"](newFoodId),
          pricePayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      });

      // Chờ tất cả các request thêm giá hoàn thành
      await Promise.all(pricePromises);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Thêm món ăn với ${prices.length} mức giá thành công!`
      });
      navigation.goBack();
      
    } catch (error) {
      let errorMessage = "Không thể thêm món ăn! Vui lòng kiểm tra lại.";
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.details) {
          if (typeof error.response.data.details === "object") {
            const details = Object.entries(error.response.data.details).map(
              ([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join("; ")}`;
                }
                return `${key}: ${value}`;
              }
            );
            errorMessage = details.join("; ");
          } else {
            errorMessage = error.response.data.details;
          }
        } else {
          const errors = Object.entries(error.response.data).map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`;
            }
            return `${key}: ${value}`;
          });
          errorMessage = errors.join("; ");
        }
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Yêu cầu hết thời gian. Vui lòng kiểm tra kết nối mạng.";
      }
      
      Alert.alert("Lỗi", errorMessage);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage
      });
      console.error("Lỗi thêm món ăn:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPriceSlot = (priceItem, index) => {
    return (
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
                  isUsed && !isSelected && styles.disabledTimeServe
                ]}
                onPress={() => updatePrice(priceItem.id, "time_serve", option.key)}
                disabled={loading || (isUsed && !isSelected)}
              >
                <Text style={[
                  styles.timeServeButtonText,
                  isSelected && styles.selectedTimeServeText,
                  isUsed && !isSelected && styles.disabledTimeServeText
                ]}>
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
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thêm Món Ăn Mới</Text>
      
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
        <Text style={[
          styles.categorySelectorText, 
          !foodData.food_category && styles.placeholderText
        ]}>
          {getSelectedCategoryName()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Phần chọn ảnh món ăn */}
      <Text style={styles.label}>Ảnh món ăn</Text>
      <TouchableOpacity 
        style={styles.imagePickerButton} 
        onPress={picker} 
        disabled={loading}
      >
        <Text style={[styles.imagePickerText, loading && styles.disabledText]}>
          {foodData.image ? "Thay đổi ảnh món ăn..." : "Chọn ảnh món ăn..."}
        </Text>
      </TouchableOpacity>

      {/* Hiển thị ảnh đã chọn */}
      {foodData.image && (
        <View style={styles.imagePreviewContainer}>
          <Image
            style={styles.imagePreview}
            source={{ uri: foodData.image.uri }}
          />
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

      {/* Phần giá - cho phép nhiều giá */}
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
        onPress={handleAddFood}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Đang thêm..." : "Thêm món ăn"}
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
                    foodData.food_category === item.id.toString() && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleSelectCategory(item.id)}
                >
                  <Text style={[
                    styles.categoryItemText,
                    foodData.food_category === item.id.toString() && styles.selectedCategoryItemText
                  ]}>
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
  // Styles cho phần chọn ảnh
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
  // Styles cho phần giá
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

export default AddFood;