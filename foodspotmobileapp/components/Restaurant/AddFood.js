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
  
  const [prices, setPrices] = useState([
    { time_serve: "NOON", price: "", id: Date.now() }
  ]);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const timeServeOptions = [
    { key: "MORNING", label: "🌅 Sáng" },
    { key: "NOON", label: "☀️ Trưa" },
    { key: "EVENING", label: "🌆 Chiều" },
    { key: "NIGHT", label: "🌙 Tối" },
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (!result.canceled) {
      setFoodData({ ...foodData, image: result.assets[0] });
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

  const addPriceSlot = () => {
    const newPrice = {
      time_serve: "NOON",
      price: "",
      id: Date.now()
    };
    setPrices([...prices, newPrice]);
  };

  const removePriceSlot = (id) => {
    if (prices.length === 1) {
      Alert.alert("Thông báo", "Phải có ít nhất một mức giá!");
      return;
    }
    setPrices(prices.filter(price => price.id !== id));
  };

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
    for (let price of prices) {
      if (!price.price || parseInt(price.price) <= 0) {
        return false;
      }
    }
    const timeServes = prices.map(p => p.time_serve);
    const uniqueTimeServes = [...new Set(timeServes)];
    return timeServes.length === uniqueTimeServes.length;
  };

  const handleAddFood = async () => {
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
      
      let form = new FormData();
      form.append("name", foodData.name);
      form.append("description", foodData.description || "");
      form.append("food_category", parseInt(foodData.food_category));
      form.append("restaurant", parseInt(restaurantId));
      form.append("is_available", foodData.is_available);

      if (foodData.image) {
        form.append("image", {
          uri: foodData.image.uri,
          name: foodData.image.fileName || `food_image_${Date.now()}.jpg`,
          type: foodData.image.type && foodData.image.type.startsWith('image/')
            ? foodData.image.type
            : 'image/jpeg'
        });
      }
      console.log("-----------------------------------------",foodData.image)
      const createFoodResponse = await authApis(token).post(
        endpoints["foods"],
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newFoodId = createFoodResponse.data.id;

      const pricePromises = prices.map(priceItem => {
        const pricePayload = {
          time_serve: priceItem.time_serve,
          price: parseInt(priceItem.price),
        };
        return authApis(token).post(
          endpoints["food-add-price"](newFoodId),
          pricePayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      });

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
      <View style={styles.header}>
        <Text style={styles.title}>Thêm Món Ăn Mới</Text>
        <Text style={styles.subtitle}>Thêm món ăn mới cho nhà hàng của bạn</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên món ăn *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên món ăn"
            placeholderTextColor="#999"
            value={foodData.name}
            onChangeText={(text) => updateField("name", text)}
            editable={!loading}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Nhập mô tả món ăn"
            placeholderTextColor="#999"
            value={foodData.description}
            onChangeText={(text) => updateField("description", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>
        
        <View style={styles.inputGroup}>
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ảnh món ăn</Text>
          <TouchableOpacity 
            style={[styles.imagePickerButton, loading && styles.disabledButton]}
            onPress={picker} 
            disabled={loading}
          >
            <Text style={[styles.imagePickerText, loading && styles.disabledText]}>
              {foodData.image ? "Thay đổi ảnh món ăn..." : "Chọn ảnh món ăn..."}
            </Text>
          </TouchableOpacity>

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
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Trạng thái món ăn</Text>
              <Text style={styles.switchDescription}>
                {foodData.is_available ? "Có sẵn" : "Hết hàng"}
              </Text>
            </View>
            <Switch
              value={foodData.is_available}
              onValueChange={(value) => updateField("is_available", value)}
              trackColor={{ false: "#D1D5DB", true: "#34D399" }}
              thumbColor={foodData.is_available ? "#10B981" : "#9CA3AF"}
              ios_backgroundColor="#D1D5DB"
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.pricesSection}>
          <View style={styles.pricesSectionHeader}>
            <Text style={styles.pricesSectionTitle}>Giá món ăn *</Text>
            <TouchableOpacity 
              style={[styles.addPriceButton, (loading || prices.length >= 4) && styles.disabledButton]}
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
      </View>

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
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionInput: {
    height: 100,
    paddingTop: 14,
  },
  categorySelector: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6B7280",
  },
  imagePickerButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: "center",
    position: "relative",
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchInfo: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
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
    color: "#374151",
  },
  addPriceButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPriceButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  priceSlotContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: "#007AFF",
  },
  removePriceButton: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removePriceButtonText: {
    color: "#FFF",
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
    borderColor: "#D1D5DB",
    backgroundColor: "#F9F9F9",
  },
  selectedTimeServe: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  disabledTimeServe: {
    backgroundColor: "#F0F0F0",
    borderColor: "#CCC",
  },
  timeServeButtonText: {
    fontSize: 14,
    color: "#1F2937",
  },
  selectedTimeServeText: {
    color: "#FFF",
    fontWeight: "600",
  },
  disabledTimeServeText: {
    color: "#9CA3AF",
  },
  priceInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    fontSize: 16,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    margin: 20,
    maxHeight: "70%",
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "bold",
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedCategoryItem: {
    backgroundColor: "#EBF8FF",
  },
  categoryItemText: {
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  selectedCategoryItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
  },
});

export default AddFood;