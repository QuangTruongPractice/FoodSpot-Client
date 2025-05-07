import React, { useState, useEffect } from "react";
import { ScrollView, View, Alert } from "react-native";
import { Button, TextInput, HelperText, ActivityIndicator, Chip } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";

const ManageRestaurant = ({ route }) => {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState({
    name: "",
    phone_number: "",
    avatar: null,
    address: { name: "", latitude: "", longitude: "" },
    shipping_fee_per_km: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy thông tin nhà hàng
  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Không tìm thấy token!");
      }

      const authApi = authApis(token);
      const res = await authApi.get(`${endpoints["restaurants_list"]}${restaurantId}/`);
      const data = res.data;
      console.log("Thông tin nhà hàng:", data);

      setRestaurant({
        name: data.name,
        phone_number: data.phone_number,
        avatar: data.avatar,
        address: {
          name: data.address.name,
          latitude: data.address.latitude.toString(),
          longitude: data.address.longitude.toString(),
        },
        shipping_fee_per_km: data.shipping_fee_per_km ? data.shipping_fee_per_km.toString() : "",
      });
    } catch (ex) {
      console.error("Lỗi tải thông tin nhà hàng:", ex.response?.data || ex.message);
      setError("Không thể tải thông tin nhà hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  // Chọn ảnh đại diện
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
      setRestaurant({ ...restaurant, avatar: result.assets[0].uri });
    }
  };

  // Cập nhật thông tin nhà hàng
  const updateRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Không tìm thấy token!");
      }

      const authApi = authApis(token);

      // Tạo FormData để gửi dữ liệu
      const formData = new FormData();
      formData.append("name", restaurant.name);
      formData.append("phone_number", restaurant.phone_number);
      formData.append("address[name]", restaurant.address.name);
      formData.append("address[latitude]", restaurant.address.latitude);
      formData.append("address[longitude]", restaurant.address.longitude);
      formData.append("shipping_fee_per_km", restaurant.shipping_fee_per_km);

      // Thêm ảnh nếu có
      if (restaurant.avatar && restaurant.avatar.startsWith("file://")) {
        formData.append("avatar", {
          uri: restaurant.avatar,
          name: "restaurant_avatar.jpg",
          type: "image/jpeg",
        });
      }

      // Gửi yêu cầu PATCH
      const res = await authApi.patch(
        `${endpoints["restaurants_list"]}${restaurantId}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Thông tin nhà hàng đã được cập nhật:", res.data);
      Alert.alert("Thành công", "Thông tin nhà hàng đã được cập nhật!");
    } catch (ex) {
      console.error("Lỗi cập nhật nhà hàng:", ex.response?.data || ex.message);
      setError("Không thể cập nhật thông tin. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={MyStyles.container}>
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <TextInput
        label="Tên nhà hàng"
        value={restaurant.name}
        onChangeText={(text) => setRestaurant({ ...restaurant, name: text })}
        style={MyStyles.margin}
      />

      <TextInput
        label="Số điện thoại"
        value={restaurant.phone_number}
        onChangeText={(text) => setRestaurant({ ...restaurant, phone_number: text })}
        keyboardType="phone-pad"
        style={MyStyles.margin}
      />

      <Button
        mode="contained"
        onPress={pickImage}
        style={MyStyles.margin}
      >
        Chọn ảnh đại diện
      </Button>
      {restaurant.avatar && <Chip style={MyStyles.margin}>Ảnh đã chọn</Chip>}

      <TextInput
        label="Địa chỉ"
        value={restaurant.address.name}
        onChangeText={(text) =>
          setRestaurant({ ...restaurant, address: { ...restaurant.address, name: text } })
        }
        style={MyStyles.margin}
      />

      <TextInput
        label="Vĩ độ (Latitude)"
        value={restaurant.address.latitude}
        onChangeText={(text) =>
          setRestaurant({ ...restaurant, address: { ...restaurant.address, latitude: text } })
        }
        keyboardType="numeric"
        style={MyStyles.margin}
      />

      <TextInput
        label="Kinh độ (Longitude)"
        value={restaurant.address.longitude}
        onChangeText={(text) =>
          setRestaurant({ ...restaurant, address: { ...restaurant.address, longitude: text } })
        }
        keyboardType="numeric"
        style={MyStyles.margin}
      />

      <TextInput
        label="Phí ship mỗi km (VNĐ)"
        value={restaurant.shipping_fee_per_km}
        onChangeText={(text) => setRestaurant({ ...restaurant, shipping_fee_per_km: text })}
        keyboardType="numeric"
        style={MyStyles.margin}
      />

      <Button
        mode="contained"
        onPress={updateRestaurant}
        disabled={loading}
        loading={loading}
        style={MyStyles.margin}
      >
        Cập nhật thông tin
      </Button>
    </ScrollView>
  );
};

export default ManageRestaurant;