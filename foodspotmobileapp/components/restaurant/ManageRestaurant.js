import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { TextInput, Button, Title, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";

const ManageRestaurant = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    phone_number: "",
    shipping_fee_per_km: "",
    address: { name: "", latitude: "", longitude: "" },
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints["restaurant-details"](restaurantId));
      setRestaurantData(response.data);
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải thông tin nhà hàng!";
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

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const handleInputChange = (field, value) => {
    setRestaurantData({ ...restaurantData, [field]: value });
  };

  const handleAddressChange = (field, value) => {
    setRestaurantData({
      ...restaurantData,
      address: { ...restaurantData.address, [field]: value },
    });
  };

  const updateRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      await authApi.patch(endpoints["restaurant-details"](restaurantId), restaurantData);
      Alert.alert("Thành công", "Thông tin nhà hàng đã được cập nhật!");
      navigation.goBack();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể cập nhật thông tin!";
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

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <ScrollView style={MyStyles.container}>
      <Title style={styles.title}>Quản lý Thông tin Nhà hàng</Title>
      <TextInput
        label="Tên nhà hàng"
        value={restaurantData.name}
        onChangeText={(text) => handleInputChange("name", text)}
        style={MyStyles.margin}
      />
      <TextInput
        label="Số điện thoại"
        value={restaurantData.phone_number}
        onChangeText={(text) => handleInputChange("phone_number", text)}
        style={MyStyles.margin}
        keyboardType="phone-pad"
      />
      <TextInput
        label="Phí vận chuyển (VND/km)"
        value={restaurantData.shipping_fee_per_km}
        onChangeText={(text) => handleInputChange("shipping_fee_per_km", text)}
        style={MyStyles.margin}
        keyboardType="numeric"
      />
      <Title style={styles.subtitle}>Địa chỉ</Title>
      <TextInput
        label="Tên địa chỉ"
        value={restaurantData.address.name}
        onChangeText={(text) => handleAddressChange("name", text)}
        style={MyStyles.margin}
      />
      <TextInput
        label="Vĩ độ"
        value={restaurantData.address.latitude}
        onChangeText={(text) => handleAddressChange("latitude", text)}
        style={MyStyles.margin}
        keyboardType="numeric"
      />
      <TextInput
        label="Kinh độ"
        value={restaurantData.address.longitude}
        onChangeText={(text) => handleAddressChange("longitude", text)}
        style={MyStyles.margin}
        keyboardType="numeric"
      />
      <Button
        mode="contained"
        onPress={updateRestaurant}
        disabled={loading}
        style={[MyStyles.margin, styles.button]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : "Cập nhật"}
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
  button: {
    marginTop: 20,
  },
});

export default ManageRestaurant;