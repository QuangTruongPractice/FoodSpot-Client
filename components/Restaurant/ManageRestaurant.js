import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Text, Alert } from "react-native";
import { TextInput, Button, Title, ActivityIndicator, HelperText } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

const ManageRestaurant = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    phone_number: "",
    shipping_fee_per_km: "",
    address: { name: "", latitude: null, longitude: null },
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  // Lấy thông tin nhà hàng
  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng đăng nhập lại!" });
        navigation.navigate("Login");
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints["restaurant-details"](restaurantId));
      setRestaurantData(response.data);
    } catch (ex) {
      let errorMessage = ex.response?.data?.error || ex.message || "Không thể tải thông tin nhà hàng!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Login");
      }
      Toast.show({ type: "error", text1: "Lỗi", text2: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  // Cập nhật giá trị cho các trường
  const handleInputChange = (field, value) => {
    setRestaurantData({ ...restaurantData, [field]: value });
    if (field === "address.name") {
      setAddressError(""); // Xóa lỗi khi người dùng nhập lại
    }
  };

  // Tìm kiếm địa chỉ với Nominatim
  const searchAddress = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        setRestaurantData({
          ...restaurantData,
          address: {
            name: display_name,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          },
        });
        setAddressError("");
        Toast.show({ type: "success", text1: "Thành công", text2: "Đã tìm thấy địa chỉ!" });
      } else {
        setAddressError("Không tìm thấy địa chỉ. Vui lòng thử lại!");
      }
    } catch (ex) {
      setAddressError("Không thể tìm kiếm địa chỉ. Vui lòng kiểm tra kết nối!");
    }
  };

  // Chọn ảnh đại diện
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Quyền truy cập thư viện ảnh bị từ chối!" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setRestaurantData({ ...restaurantData, avatar: result.assets[0] });
      Toast.show({ type: "success", text1: "Thành công", text2: "Đã chọn ảnh đại diện!" });
    }
  };

  // Cập nhật thông tin nhà hàng
  const updateRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng đăng nhập lại!" });
        navigation.navigate("Login");
        return;
      }

      if (!restaurantData.name || !restaurantData.phone_number || !restaurantData.address.name) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập đầy đủ thông tin!" });
        return;
      }

      if (!restaurantData.address.latitude || !restaurantData.address.longitude) {
        setAddressError("Vui lòng chọn địa chỉ hợp lệ!");
        return;
      }

      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn cập nhật thông tin nhà hàng?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cập nhật",
            onPress: async () => {
              const authApi = authApis(token);
              const formData = new FormData();
              formData.append("name", restaurantData.name);
              formData.append("phone_number", restaurantData.phone_number);
              formData.append("shipping_fee_per_km", restaurantData.shipping_fee_per_km || "0");
              formData.append("address.name", restaurantData.address.name);
              formData.append("address.latitude", restaurantData.address.latitude.toString());
              formData.append("address.longitude", restaurantData.address.longitude.toString());

              if (restaurantData.avatar?.uri) {
                formData.append("avatar", {
                  uri: restaurantData.avatar.uri,
                  name: restaurantData.avatar.fileName || "avatar.png",
                  type: "image/png",
                });
              }

              await authApi.patch(endpoints["restaurant-details"](restaurantId), formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              Toast.show({ type: "success", text1: "Thành công", text2: "Cập nhật thông tin nhà hàng thành công!" });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (ex) {
      let errorMessage = ex.response?.data?.error || ex.message || "Không thể cập nhật thông tin nhà hàng!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Login");
      }
      Toast.show({ type: "error", text1: "Lỗi", text2: errorMessage });
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
      <Title style={styles.title}>Quản lý Nhà hàng</Title>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Title style={styles.subtitle}>Ảnh đại diện</Title>
        {restaurantData.avatar?.uri ? (
          <Image source={{ uri: restaurantData.avatar.uri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text>Chưa có ảnh</Text>
          </View>
        )}
        <TouchableOpacity onPress={pickImage} disabled={loading}>
          <Text style={[styles.linkText, { color: loading ? "#888" : "#6200EE" }]}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>

      {/* Form nhập liệu */}
      <TextInput
        label="Tên nhà hàng"
        value={restaurantData.name}
        onChangeText={(text) => handleInputChange("name", text)}
        style={styles.input}
        error={!restaurantData.name && loading}
      />
      <TextInput
        label="Số điện thoại"
        value={restaurantData.phone_number}
        onChangeText={(text) => handleInputChange("phone_number", text)}
        style={styles.input}
        keyboardType="phone-pad"
        error={!restaurantData.phone_number && loading}
      />
      <TextInput
        label="Phí vận chuyển (VND/km)"
        value={restaurantData.shipping_fee_per_km?.toString() || ""}
        onChangeText={(text) => handleInputChange("shipping_fee_per_km", text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Địa chỉ"
        value={restaurantData.address.name}
        onChangeText={(text) => {
          handleInputChange("address.name", text);
          if (text.length > 5) {
            searchAddress(text);
          }
        }}
        style={styles.input}
        error={!!addressError}
      />
      <HelperText type="error" visible={!!addressError}>
        {addressError}
      </HelperText>

      {/* Bản đồ */}
      {restaurantData.address.latitude && restaurantData.address.longitude ? (
        <View style={styles.mapContainer}>
          <Title style={styles.subtitle}>Vị trí nhà hàng</Title>
          <MapView
            style={styles.map}
            provider={null} // Sử dụng OpenStreetMap
            region={{
              latitude: restaurantData.address.latitude,
              longitude: restaurantData.address.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: restaurantData.address.latitude,
                longitude: restaurantData.address.longitude,
              }}
              title={restaurantData.name}
              description={restaurantData.address.name}
            />
          </MapView>
        </View>
      ) : null}

      <Button
        mode="contained"
        onPress={updateRestaurant}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
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
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 15,
    color: "#555",
  },
  input: {
    marginHorizontal: 15,
    marginVertical: 8,
  },
  button: {
    marginHorizontal: 15,
    marginVertical: 20,
    backgroundColor: "#6200EE",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 10,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
  },
  mapContainer: {
    marginVertical: 15,
    marginHorizontal: 15,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
});

export default ManageRestaurant;