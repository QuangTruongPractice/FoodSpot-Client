import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Text, Alert } from "react-native";
import { TextInput, Button, Title, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
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
  const [addressQuery, setAddressQuery] = useState(""); // Lưu trữ địa chỉ tạm thời để tìm kiếm
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params || {};
  const [user] = useContext(MyUserContext);

  const GOOGLE_MAPS_API_KEY = "AIzaSyBgpRfzhwt1V_A9DmTY4Dwmh9EGb75_wNo"; 

  // Validate restaurantId
  useEffect(() => {
    if (!restaurantId || isNaN(restaurantId)) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "ID nhà hàng không hợp lệ!" });
      navigation.goBack();
    }
  }, [restaurantId]);

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
      setAddressQuery(response.data.address.name || "");
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
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId]);

  // Cập nhật giá trị cho các trường
  const handleInputChange = (field, value) => {
    setRestaurantData({ ...restaurantData, [field]: value });
  };

  // Tìm kiếm địa chỉ với Nominatim
  const searchAddress = async () => {
    if (!addressQuery) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập địa chỉ!" });
      return;
    }
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`
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
        setAddressQuery(display_name);
        Toast.show({ type: "success", text1: "Thành công", text2: "Đã tìm thấy địa chỉ!" });
      } else {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Không tìm thấy địa chỉ!" });
      }
    } catch (ex) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tìm kiếm địa chỉ!" });
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
        Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập đủ thông tin!" });
        return;
      }

      Alert.alert(
        "Xác nhận",
        "Bạn muốn cập nhật thông tin nhà hàng?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cập nhật",
            onPress: async () => {
              const authApi = authApis(token);
              const formData = new FormData();
              formData.append("name", restaurantData.name || "");
              formData.append("phone_number", restaurantData.phone_number || "");
              formData.append("shipping_fee_per_km", restaurantData.shipping_fee_per_km?.toString() || "");
              formData.append("address.name", restaurantData.address.name || "");
              if (restaurantData.address.latitude && restaurantData.address.longitude) {
                formData.append("address.latitude", restaurantData.address.latitude.toString());
                formData.append("address.longitude", restaurantData.address.longitude.toString());
              }

              if (restaurantData.avatar && restaurantData.avatar.uri) {
                formData.append("avatar", {
                  uri: restaurantData.avatar.uri,
                  name: restaurantData.avatar.fileName || "avatar.png",
                  type: "image/png",
                });
              }

              await authApi.patch(endpoints["restaurant-details"](restaurantId), formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              Toast.show({ type: "success", text1: "Thành công", text2: "Cập nhật thông tin thành công!" });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (ex) {
      let errorMessage = ex.response?.data?.error || ex.message || "Không thể cập nhật thông tin!";
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

  // HTML cho WebView hiển thị Google Maps Embed API
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Maps Embed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          #map { height: 100%; width: 100%; }
          html, body { margin: 0; padding: 0; height: 100%; }
        </style>
      </head>
      <body>
        <iframe
          id="map"
          frameborder="0"
          style="border:0; width:100%; height:100%;"
          src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
            restaurantData.address.name || "Ho Chi Minh City, Vietnam"
          )}&center=${restaurantData.address.latitude || 10.7769},${
            restaurantData.address.longitude || 106.7009
          }&zoom=15"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

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
        <TouchableOpacity style={MyStyles.margin} onPress={pickImage} disabled={loading}>
          <Text style={{ color: loading ? "#888" : "blue" }}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>

      {/* Form nhập liệu */}
      <TextInput
        label="Tên nhà hàng"
        value={restaurantData.name}
        onChangeText={(text) => handleInputChange("name", text)}
        style={styles.input}
      />
      <TextInput
        label="Số điện thoại"
        value={restaurantData.phone_number}
        onChangeText={(text) => handleInputChange("phone_number", text)}
        style={styles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        label="Phí vận chuyển (VND/km)"
        value={restaurantData.shipping_fee_per_km?.toString() || ""}
        onChangeText={(text) => handleInputChange("shipping_fee_per_km", text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <View style={styles.addressContainer}>
        <TextInput
          label="Địa chỉ"
          value={addressQuery}
          onChangeText={(text) => setAddressQuery(text)}
          style={[styles.input, { flex: 1 }]}
        />
        <Button
          mode="contained"
          onPress={searchAddress}
          disabled={loading}
          style={styles.searchButton}
          labelStyle={{ fontSize: 12 }}
        >
          Tìm
        </Button>
      </View>

      {/* Bản đồ với WebView */}
      {restaurantData.address.name ? (
        <View style={styles.mapContainer}>
          <Title style={styles.subtitle}>Vị trí nhà hàng</Title>
          <WebView
            style={styles.map}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
          />
        </View>
      ) : null}

      <Button
        mode="contained"
        onPress={updateRestaurant}
        disabled={loading}
        style={styles.button}
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
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 15,
  },
  input: {
    margin: 10,
  },
  button: {
    margin: 20,
    paddingVertical: 5,
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
  mapContainer: {
    marginVertical: 15,
    marginHorizontal: 15,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  searchButton: {
    marginLeft: 10,
    paddingVertical: 2,
  },
});

export default ManageRestaurant;