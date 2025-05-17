import React, { useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Title, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";

const AddFood = () => {
  const [foodData, setFoodData] = useState({
    name: "",
    description: "",
    categoryId: "",
    prices: [{ time_serve: "MORNING", price: "" }, { time_serve: "NOON", price: "" }],
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  const handleInputChange = (field, value) => {
    setFoodData({ ...foodData, [field]: value });
  };

  const handlePriceChange = (index, field, value) => {
    const newPrices = [...foodData.prices];
    newPrices[index][field] = value;
    setFoodData({ ...foodData, prices: newPrices });
  };

  const addFood = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const formData = new FormData();
      formData.append("name", foodData.name);
      formData.append("restaurant", restaurantId);
      formData.append("food_category", foodData.categoryId);
      formData.append("description", foodData.description);
      formData.append("prices", JSON.stringify(foodData.prices));

      const authApi = authApis(token);
      await authApi.post(endpoints.foods, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Thành công", "Món ăn đã được thêm!");
      navigation.goBack();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể thêm món ăn!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={MyStyles.container}>
      <Title style={styles.title}>Thêm Món ăn</Title>
      <TextInput
        label="Tên món ăn"
        value={foodData.name}
        onChangeText={(text) => handleInputChange("name", text)}
        style={MyStyles.margin}
      />
      <TextInput
        label="Mô tả"
        value={foodData.description}
        onChangeText={(text) => handleInputChange("description", text)}
        style={MyStyles.margin}
        multiline
      />
      <TextInput
        label="ID danh mục món ăn"
        value={foodData.categoryId}
        onChangeText={(text) => handleInputChange("categoryId", text)}
        style={MyStyles.margin}
        keyboardType="numeric"
      />
      <Title style={styles.subtitle}>Giá theo buổi</Title>
      {foodData.prices.map((price, index) => (
        <View key={index} style={styles.priceContainer}>
          <TextInput
            label={`Giá (${price.time_serve})`}
            value={price.price}
            onChangeText={(text) => handlePriceChange(index, "price", text)}
            style={[MyStyles.margin, styles.priceInput]}
            keyboardType="numeric"
          />
        </View>
      ))}
      <Button
        mode="contained"
        onPress={addFood}
        disabled={loading}
        style={[MyStyles.margin, styles.button]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : "Thêm món ăn"}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 10,
    marginLeft: 15,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
  },
  button: {
    marginTop: 20,
  },
});

export default AddFood;