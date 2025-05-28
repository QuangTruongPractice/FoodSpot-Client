import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image, TouchableOpacity, Modal, FlatList, Switch } from "react-native";
import { MyUserContext } from "../../configs/MyContexts";
import APis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const AddFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurantId } = route.params;
  const [foodData, setFoodData] = useState({
    name: "",
    description: "",
    food_category: "",
    prices: [{ time_serve: "MORNING", price: "" }],
    image: null,
    is_available: true, // Thêm trường trạng thái món ăn
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Danh sách thời gian phục vụ có sẵn
  const timeServeOptions = [
    { key: "MORNING", label: "Sáng" },
    { key: "AFTERNOON", label: "Chiều" },
    { key: "EVENING", label: "Tối" },
    { key: "ALL_DAY", label: "Cả ngày" }
  ];

  // Lấy danh sách danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("access_token");
        const response = await APis.get(endpoints["foods-category"]);
        const data = Array.isArray(response.data.results) ? response.data.results : [];
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFoodData({ ...foodData, image: result.assets[0].uri });
    }
  };

  const addPriceField = () => {
    setFoodData({
      ...foodData,
      prices: [...foodData.prices, { time_serve: "MORNING", price: "" }],
    });
  };

  const updatePriceField = (index, field, value) => {
    const newPrices = [...foodData.prices];
    if (field === "price") {
      // Chỉ cho phép nhập số và dấu chấm
      const numericValue = value.replace(/[^0-9.]/g, '');
      newPrices[index][field] = numericValue;
    } else {
      newPrices[index][field] = value;
    }
    setFoodData({ ...foodData, prices: newPrices });
  };

  const removePriceField = (index) => {
    if (foodData.prices.length > 1) {
      const newPrices = foodData.prices.filter((_, i) => i !== index);
      setFoodData({ ...foodData, prices: newPrices });
    }
  };

  // Kiểm tra trùng lặp thời gian phục vụ
  const validatePrices = () => {
    const timeServes = foodData.prices.map(p => p.time_serve);
    const uniqueTimeServes = new Set(timeServes);
    return timeServes.length === uniqueTimeServes.size;
  };

  const handleAddFood = async () => {
    // Kiểm tra các trường bắt buộc
    if (!foodData.name || !foodData.food_category) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ Tên món ăn và Danh mục!");
      return;
    }

    // Lọc các giá hợp lệ (có cả time_serve và price)
    const validPrices = foodData.prices.filter(p => p.time_serve && p.price && parseFloat(p.price) > 0);
    
    if (validPrices.length === 0) {
      Alert.alert("Lỗi", "Vui lòng thêm ít nhất một mức giá hợp lệ!");
      return;
    }

    // Kiểm tra trùng lặp thời gian phục vụ
    if (!validatePrices()) {
      Alert.alert("Lỗi", "Không được trùng lặp thời gian phục vụ!");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const authApi = authApis(token);
      const formData = new FormData();
      
      formData.append("name", foodData.name);
      formData.append("description", foodData.description);
      formData.append("food_category", foodData.food_category);
      formData.append("restaurant", restaurantId);
      formData.append("is_available", foodData.is_available);
      
      // Chuyển đổi giá thành số và định dạng lại
      const formattedPrices = validPrices.map(p => ({
        time_serve: p.time_serve,
        price: parseFloat(p.price)
      }));
      
      formData.append("prices", JSON.stringify(formattedPrices));

      if (foodData.image) {
        formData.append("image", {
          uri: foodData.image,
          type: "image/jpeg",
          name: "food_image.jpg",
        });
      }

      const res = await authApi.post(endpoints["foods"], formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      Alert.alert("Thành công", "Thêm món ăn thành công!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể thêm món ăn! Vui lòng kiểm tra lại.");
      console.error("Lỗi thêm món ăn:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tìm tên danh mục được chọn
  const getSelectedCategoryName = () => {
    if (!foodData.food_category) return "Chọn danh mục";
    const selectedCategory = categories.find(cat => cat.id.toString() === foodData.food_category);
    return selectedCategory ? selectedCategory.name : "Chọn danh mục";
  };

  // Xử lý chọn danh mục
  const handleSelectCategory = (categoryId, categoryName) => {
    setFoodData({ ...foodData, food_category: categoryId.toString() });
    setShowCategoryModal(false);
  };

  // Lấy label cho thời gian phục vụ
  const getTimeServeLabel = (timeServe) => {
    const option = timeServeOptions.find(opt => opt.key === timeServe);
    return option ? option.label : timeServe;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thêm Món Ăn Mới</Text>
      
      <Text style={styles.label}>Tên món ăn *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên món ăn"
        value={foodData.name}
        onChangeText={(text) => setFoodData({ ...foodData, name: text })}
      />
      
      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Nhập mô tả món ăn"
        value={foodData.description}
        onChangeText={(text) => setFoodData({ ...foodData, description: text })}
        multiline
      />
      
      <Text style={styles.sectionTitle}>Danh mục món ăn *</Text>
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

      {/* Trạng thái món ăn */}
      <View style={styles.availabilityContainer}>
        <Text style={styles.sectionTitle}>Trạng thái món ăn</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            {foodData.is_available ? "Có sẵn" : "Hết hàng"}
          </Text>
          <Switch
            value={foodData.is_available}
            onValueChange={(value) => setFoodData({ ...foodData, is_available: value })}
            trackColor={{ false: "#ccc", true: "#6200ee" }}
            thumbColor={foodData.is_available ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Chọn ảnh món ăn</Text>
      <TouchableOpacity 
        style={styles.imageButton} 
        onPress={pickImage}
        disabled={loading}
      >
        <Text style={styles.imageButtonText}>
          {foodData.image ? "Thay đổi ảnh" : "Chọn ảnh món ăn"}
        </Text>
      </TouchableOpacity>
      
      {foodData.image && (
        <Image source={{ uri: foodData.image }} style={styles.previewImage} />
      )}
      
      <Text style={styles.sectionTitle}>Giá món ăn *</Text>
      <Text style={styles.helperText}>Thêm giá cho các thời gian phục vụ khác nhau</Text>
      
      {foodData.prices.map((price, index) => (
        <View key={index} style={styles.priceContainer}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceLabel}>Giá #{index + 1}</Text>
            {foodData.prices.length > 1 && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removePriceField(index)}
              >
                <Text style={styles.removeButtonText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.priceInputContainer}>
            {/* Dropdown cho thời gian phục vụ */}
            <View style={styles.timeServeContainer}>
              <Text style={styles.inputLabel}>Thời gian phục vụ</Text>
              <View style={styles.timeServeButtons}>
                {timeServeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.timeServeButton,
                      price.time_serve === option.key && styles.selectedTimeServe
                    ]}
                    onPress={() => updatePriceField(index, "time_serve", option.key)}
                  >
                    <Text style={[
                      styles.timeServeButtonText,
                      price.time_serve === option.key && styles.selectedTimeServeText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputLabel}>Giá (VNĐ)</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={price.price}
                onChangeText={(text) => updatePriceField(index, "price", text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      ))}
      
      <TouchableOpacity 
        style={styles.addPriceButton} 
        onPress={addPriceField}
        disabled={loading}
      >
        <Text style={styles.addPriceButtonText}>+ Thêm giá cho thời gian khác</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.disabledButton]} 
        onPress={handleAddFood}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? "Đang thêm..." : "Thêm món ăn"}
        </Text>
      </TouchableOpacity>

      {/* Modal chọn danh mục */}
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
                  onPress={() => handleSelectCategory(item.id, item.name)}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
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
  
  // Styles cho trạng thái món ăn
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
  
  imageButton: {
    backgroundColor: "#6200ee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginVertical: 12,
    alignSelf: "center",
  },
  
  // Styles mới cho phần giá
  priceContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  priceInputContainer: {
    gap: 12,
  },
  timeServeContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  timeServeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  timeServeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedTimeServeText: {
    color: "#fff",
    fontWeight: "600",
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  
  removeButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addPriceButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#0288d1",
    borderStyle: "dashed",
  },
  addPriceButtonText: {
    color: "#0288d1",
    fontSize: 16,
    fontWeight: "600",
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
  
  // Modal styles
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