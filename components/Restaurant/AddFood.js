import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert, Text, TouchableOpacity } from "react-native";
import { Button, TextInput, HelperText, ActivityIndicator, Chip, Title } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";

const AddFood = ({ route }) => {
  const { restaurantId } = route.params;
  const [food, setFood] = useState({
    name: "",
    description: "",
    image: null,
    food_category: "",
    prices: [
      { time_serve: "MORNING", price: "" },
      { time_serve: "NOON", price: "" },
      { time_serve: "EVENING", price: "" },
      { time_serve: "NIGHT", price: "" },
    ],
  });
  const [categories, setCategories] = useState([]); // Mảng rỗng mặc định
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [error, setError] = useState(null); // Lưu lỗi API

  // Tải danh sách danh mục
  const loadCategories = async (retryCount = 3) => {
    setFetchingCategories(true);
    setError(null);

    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại!");
      setFetchingCategories(false);
      return;
    }

    const authApi = authApis(token);
    for (let i = 0; i < retryCount; i++) {
      try {
        let url = endpoints["foods-category_list"];
        let allCategories = [];

        while (url) {
          const res = await authApi.get(url);
          console.log("Phản hồi API danh mục:", res.data); // Log để debug
          const data = res.data;
          if (!data || (!data.results && !Array.isArray(data))) {
            throw new Error("Dữ liệu danh mục không hợp lệ!");
          }
          const results = data.results || data;
          allCategories = [...allCategories, ...(Array.isArray(results) ? results : [])];
          url = data.next || null;
        }
        setCategories(allCategories);
        return; // Thoát nếu thành công
      } catch (ex) {
        console.error(`Lỗi tải danh mục (lần ${i + 1}):`, ex.response?.data || ex.message);
        if (i === retryCount - 1) {
          setError("Không thể tải danh mục sau nhiều lần thử. Vui lòng kiểm tra kết nối hoặc thử lại!");
        }
      } finally {
        setFetchingCategories(false);
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Cần cấp quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setFood({ ...food, image: result.assets[0].uri });
    }
  };

  // Cập nhật giá theo buổi
  const updatePrice = (timeServe, value) => {
    const updatedPrices = food.prices.map((price) =>
      price.time_serve === timeServe ? { ...price, price: value } : price
    );
    setFood({ ...food, prices: updatedPrices });
  };

  // Gửi dữ liệu món ăn lên API
  const addFood = async () => {
    if (!food.name || !food.description || !food.food_category) {
      setError("Vui lòng điền đầy đủ tên, mô tả và danh mục!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Không tìm thấy token!");
      }

      const authApi = authApis(token);

      const formData = new FormData();
      formData.append("name", food.name);
      formData.append("description", food.description);
      formData.append("restaurant", restaurantId);
      if (food.food_category) {
        formData.append("food_category", food.food_category);
      }

      if (food.image) {
        formData.append("image", {
          uri: food.image,
          name: "food_image.jpg",
          type: "image/jpeg",
        });
      }

      const filteredPrices = food.prices.filter((p) => p.price !== "");
      formData.append("prices", JSON.stringify(filteredPrices));

      const res = await authApi.post(endpoints["foods_list"], formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Món ăn đã được thêm:", res.data);
      Alert.alert("Thành công", "Món ăn đã được thêm!");
      setFood({
        name: "",
        description: "",
        image: null,
        food_category: "",
        prices: [
          { time_serve: "MORNING", price: "" },
          { time_serve: "NOON", price: "" },
          { time_serve: "EVENING", price: "" },
          { time_serve: "NIGHT", price: "" },
        ],
      });
    } catch (ex) {
      console.error("Lỗi khi thêm món ăn:", ex.response?.data || ex.message);
      setError("Không thể thêm món ăn. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={MyStyles.container}>
      <Title style={MyStyles.margin}>Thêm món ăn mới</Title>

      {fetchingCategories && (
        <View style={MyStyles.margin}>
          <ActivityIndicator animating={true} size="small" color="#6200EE" />
          <Text>Đang tải danh mục...</Text>
        </View>
      )}
      {error && (
        <View style={MyStyles.margin}>
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <TouchableOpacity onPress={loadCategories}>
            <Text style={{ color: "#6200EE", textDecorationLine: "underline" }}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        label="Tên món ăn"
        value={food.name}
        onChangeText={(text) => setFood({ ...food, name: text })}
        style={MyStyles.margin}
      />

      <TextInput
        label="Mô tả"
        value={food.description}
        onChangeText={(text) => setFood({ ...food, description: text })}
        style={MyStyles.margin}
        multiline
      />

      <Button mode="contained" onPress={pickImage} style={MyStyles.margin}>
        Chọn ảnh món ăn
      </Button>
      {food.image && <Chip style={MyStyles.margin}>Ảnh đã chọn</Chip>}

      <Picker
        selectedValue={food.food_category}
        onValueChange={(value) => setFood({ ...food, food_category: value })}
        style={MyStyles.margin}
        enabled={!fetchingCategories}
      >
        <Picker.Item label="Chọn danh mục" value="" />
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((c) => (
            <Picker.Item
              key={c.id.toString()}
              label={c.name || "Không có tên"}
              value={c.id.toString()}
            />
          ))
        ) : (
          <Picker.Item label="Không có danh mục" value="" disabled />
        )}
      </Picker>

      <Title style={MyStyles.margin}>Giá theo buổi</Title>
      {food.prices.map((price) => (
        <TextInput
          key={price.time_serve}
          label={`Giá buổi ${price.time_serve}`}
          value={price.price}
          onChangeText={(text) => updatePrice(price.time_serve, text)}
          keyboardType="numeric"
          style={MyStyles.margin}
        />
      ))}

      <Button
        mode="contained"
        onPress={addFood}
        disabled={loading || fetchingCategories}
        loading={loading}
        style={MyStyles.margin}
      >
        Thêm món ăn
      </Button>
    </ScrollView>
  );
};

export default AddFood;