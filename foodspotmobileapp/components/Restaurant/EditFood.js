import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MyUserContext } from "../../configs/MyContexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const EditFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurantId, food } = route.params;
  const [foodData, setFoodData] = useState({
    id: food.id,
    name: food.name,
    description: food.description || "",
    food_category: food.food_category.toString(),
    prices: food.prices.length > 0 ? food.prices : [{ time_serve: "", price: "" }],
    image: food.image || null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("access_token");
        const authApi = authApis(token);
        const response = await authApi.get(endpoints["categories"]);
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
      prices: [...foodData.prices, { time_serve: "", price: "" }],
    });
  };

  const updatePriceField = (index, field, value) => {
    const newPrices = [...foodData.prices];
    newPrices[index][field] = value;
    setFoodData({ ...foodData, prices: newPrices });
  };

  const handleUpdateFood = async () => {
    if (!foodData.name || !foodData.food_category || !foodData.prices[0].time_serve || !foodData.prices[0].price) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ Tên, Danh mục, Thời gian phục vụ và Giá!");
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
      formData.append("prices", JSON.stringify(foodData.prices.filter((p) => p.time_serve && p.price)));

      if (foodData.image && foodData.image.startsWith("file://")) {
        formData.append("image", {
          uri: foodData.image,
          type: "image/jpeg",
          name: "food_image.jpg",
        });
      }

      const res = await authApi.patch(endpoints["food-details"](foodData.id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Thành công", "Cập nhật món ăn thành công!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật món ăn! Vui lòng kiểm tra lại.");
      console.error("Lỗi cập nhật món ăn:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa Món Ăn</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên món ăn"
        value={foodData.name}
        onChangeText={(text) => setFoodData({ ...foodData, name: text })}
      />
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Mô tả"
        value={foodData.description}
        onChangeText={(text) => setFoodData({ ...foodData, description: text })}
        multiline
      />
      <Text style={styles.sectionTitle}>Danh mục món ăn</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={foodData.food_category}
          onValueChange={(value) => setFoodData({ ...foodData, food_category: value })}
          style={styles.picker}
          enabled={!loading}
        >
          <Picker.Item label="Chọn danh mục" value="" />
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.id.toString()} />
          ))}
        </Picker>
      </View>
      <Button
        title="Chọn ảnh món ăn"
        onPress={pickImage}
        color="#6200ee"
        disabled={loading}
      />
      {foodData.image && (
        <Image source={{ uri: foodData.image }} style={styles.previewImage} />
      )}
      <Text style={styles.sectionTitle}>Giá món ăn</Text>
      {foodData.prices.map((price, index) => (
        <View key={index} style={styles.priceContainer}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Thời gian phục vụ (VD: MORNING)"
            value={price.time_serve}
            onChangeText={(text) => updatePriceField(index, "time_serve", text)}
          />
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Giá (VNĐ)"
            value={price.price.toString()}
            onChangeText={(text) => updatePriceField(index, "price", text)}
            keyboardType="numeric"
          />
        </View>
      ))}
      <Button
        title="Thêm giá khác"
        onPress={addPriceField}
        color="#0288d1"
        disabled={loading}
      />
      <Button
        title="Cập nhật món ăn"
        onPress={handleUpdateFood}
        color="#6200ee"
        disabled={loading}
      />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
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
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  picker: {
    height: 50,
    fontSize: 16,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    marginRight: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 12,
  },
});

export default EditFood;