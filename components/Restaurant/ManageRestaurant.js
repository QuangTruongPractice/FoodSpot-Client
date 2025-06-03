
import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Text, Alert } from "react-native";
import { TextInput, Button, Title, ActivityIndicator, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { debounce } from 'lodash';

// Utility functions - Enhanced version
const reverseGeocodeDetailed = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi&extratags=1&namedetails=1`
    );
    
    if (response.data && response.data.address) {
      const addr = response.data.address;
      const streetInfo = {
        house_number: addr.house_number || '',
        road: addr.road || addr.street || addr.way || '',
        neighbourhood: addr.neighbourhood || addr.suburb || '',
        quarter: addr.quarter || addr.city_district || '',
        city: addr.city || addr.town || addr.municipality || '',
        district: addr.district || addr.county || '',
        state: addr.state || addr.province || '',
        country: addr.country || 'Vietnam'
      };
      
      const addressParts = [
        streetInfo.house_number,
        streetInfo.road,
        streetInfo.neighbourhood,
        streetInfo.quarter,
        streetInfo.city,
        streetInfo.district,
        streetInfo.state
      ].filter(Boolean);
      
      const formattedAddress = addressParts.join(', ');
      
      return {
        formatted_address: formattedAddress,
        street_info: streetInfo,
        raw_data: response.data,
        coordinates: { lat, lng }
      };
    }
    
    return await reverseGeocodeGoogle(lat, lng);
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    return await reverseGeocodeGoogle(lat, lng);
  }
};

// Alternative geocoding with Nominatim
const reverseGeocodeNominatim = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`
    );
    
    if (response.data && response.data.display_name) {
      return {
        formatted_address: response.data.display_name,
        detailed: response.data.address || {},
        raw: response.data
      };
    }
    throw new Error("Không tìm thấy địa chỉ!");
  } catch (error) {
    return { formatted_address: await reverseGeocode(lat, lng) };
  }
};

// Enhanced address search with multiple results
const searchAddressMultiple = async (query) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=vi`
    );
    return response.data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address_details: item.address || {},
      importance: item.importance || 0
    }));
  } catch (error) {
    throw new Error("Không thể tìm kiếm địa chỉ!");
  }
};

const calculateDistance = async (userLat, userLng, restaurantLat, restaurantLng) => {
  try {
    const res = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${userLng},${userLat}?overview=false`
    );
    if (res.data.code === "Ok") {
      const route = res.data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration
      };
    } else {
      console.warn("Không thể tính khoảng cách");
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi tính khoảng cách:", err);
    return null;
  }
};

const ManageRestaurant = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    phone_number: "",
    shipping_fee_per_km: "",
    address: { name: "", latitude: null, longitude: null },
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); // Separate loading state for search
  const [addressQuery, setAddressQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);
  
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

  // Lấy vị trí hiện tại
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Quyền truy cập vị trí bị từ chối!" });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      
      if (restaurantData.address.latitude && restaurantData.address.longitude) {
        calculateDistanceToRestaurant(location.coords.latitude, location.coords.longitude);
      }
      
      Toast.show({ type: "success", text1: "Thành công", text2: "Đã lấy vị trí hiện tại!" });
    } catch (ex) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể lấy vị trí hiện tại!" });
    } finally {
      setLocationLoading(false);
    }
  };

  // Tính khoảng cách
  const calculateDistanceToRestaurant = async (userLat, userLng) => {
    if (!restaurantData.address.latitude || !restaurantData.address.longitude) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Chưa có tọa độ nhà hàng!" });
      return;
    }

    try {
      const result = await calculateDistance(
        userLat, 
        userLng, 
        restaurantData.address.latitude, 
        restaurantData.address.longitude
      );
      
      if (result) {
        setDistanceInfo({
          distance: (result.distance / 1000).toFixed(2),
          duration: Math.ceil(result.duration / 60),
          shippingFee: restaurantData.shipping_fee_per_km ? 
            (result.distance / 1000 * parseFloat(restaurantData.shipping_fee_per_km)).toFixed(0) : 0
        });
        Toast.show({ 
          type: "success", 
          text1: "Thành công", 
          text2: `Khoảng cách: ${(result.distance / 1000).toFixed(2)} km` 
        });
      }
    } catch (ex) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tính khoảng cách!" });
    }
  };

  // Sử dụng vị trí hiện tại làm địa chỉ
  const useCurrentLocationAsAddress = async () => {
    if (!userLocation) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng lấy vị trí hiện tại trước!" });
      return;
    }

    try {
      setLocationLoading(true);
      const nominatimResult = await reverseGeocodeNominatim(userLocation.latitude, userLocation.longitude);
      
      let fullAddress = nominatimResult.formatted_address;
      
      if (nominatimResult.detailed) {
        const addr = nominatimResult.detailed;
        const addressParts = [
          addr.house_number,
          addr.road || addr.street,
          addr.neighbourhood || addr.suburb,
          addr.quarter || addr.city_district,
          addr.city || addr.town,
          addr.state,
          addr.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          fullAddress = addressParts.join(', ');
        }
      }
      
      setRestaurantData({
        ...restaurantData,
        address: {
          name: fullAddress,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
      });
      setAddressQuery(fullAddress);
      Toast.show({ type: "success", text1: "Thành công", text2: "Đã sử dụng vị trí hiện tại!" });
    } catch (ex) {
      try {
        const address = await reverseGeocode(userLocation.latitude, userLocation.longitude);
        setRestaurantData({
          ...restaurantData,
          address: {
            name: address,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        });
        setAddressQuery(address);
        Toast.show({ type: "success", text1: "Thành công", text2: "Đã sử dụng vị trí hiện tại!" });
      } catch (fallbackEx) {
        Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể chuyển đổi tọa độ thành địa chỉ!" });
      }
    } finally {
      setLocationLoading(false);
    }
  };

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

  // Cập nhật giá trị trường
  const handleInputChange = (field, value) => {
    setRestaurantData({ ...restaurantData, [field]: value });
    if (field === "shipping_fee_per_km" && distanceInfo) {
      setDistanceInfo({
        ...distanceInfo,
        shippingFee: value ? (distanceInfo.distance * parseFloat(value)).toFixed(0) : 0
      });
    }
  };

  // Tìm kiếm địa chỉ với debounce - FIXED VERSION
  const searchAddress = debounce(async (query) => {
    if (!query || query.trim().length < 3) {
      setShowSuggestions(false);
      setAddressSuggestions([]);
      return;
    }

    try {
      setSearchLoading(true); // Use separate loading state
      const results = await searchAddressMultiple(query);
      if (results && results.length > 0) {
        setAddressSuggestions(results.sort((a, b) => b.importance - a.importance));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setAddressSuggestions([]);
        Toast.show({ type: "info", text1: "Thông báo", text2: "Không tìm thấy địa chỉ nào phù hợp!" });
      }
    } catch (ex) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tìm kiếm địa chỉ!" });
      setShowSuggestions(false);
      setAddressSuggestions([]);
    } finally {
      setSearchLoading(false); // Use separate loading state
    }
  }, 800); // Increase debounce time to 800ms

  // Handle manual search button press
  const handleManualSearch = async () => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập ít nhất 3 ký tự để tìm kiếm!" });
      return;
    }
    searchAddress(addressQuery);
  };

  // Chọn địa chỉ từ gợi ý - FIXED VERSION
  const selectAddress = (selectedAddress) => {
    // Update restaurant data first
    setRestaurantData({
      ...restaurantData,
      address: {
        name: selectedAddress.display_name,
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lon,
      },
    });
    
    // Update address query WITHOUT triggering search
    setAddressQuery(selectedAddress.display_name);
    
    // Hide suggestions
    setShowSuggestions(false);
    setAddressSuggestions([]);
    
    // Calculate distance if user location is available
    if (userLocation) {
      calculateDistanceToRestaurant(userLocation.latitude, userLocation.longitude);
    }
    
    Toast.show({ type: "success", text1: "Thành công", text2: "Đã chọn địa chỉ!" });
  };

  // Handle address input change - FIXED VERSION
  const handleAddressInputChange = (text) => {
    setAddressQuery(text);
    
    // Only trigger search if user is actively typing (length > 3)
    // and don't trigger if text matches current restaurant address
    if (text.length >= 3 && text !== restaurantData.address.name) {
      searchAddress(text);
    } else {
      setShowSuggestions(false);
      setAddressSuggestions([]);
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

  // HTML cho WebView hiển thị Google Maps
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
          )}¢er=${restaurantData.address.latitude || 10.7769},${
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

      {/* Location Controls */}
      <View style={styles.locationControls}>
        <Button
          mode="outlined"
          onPress={getCurrentLocation}
          disabled={locationLoading}
          style={styles.locationButton}
          icon="crosshairs-gps"
        >
          {locationLoading ? "Đang lấy..." : "Lấy vị trí hiện tại"}
        </Button>
        {userLocation && (
          <Button
            mode="outlined"
            onPress={useCurrentLocationAsAddress}
            disabled={locationLoading}
            style={styles.locationButton}
            icon="map-marker"
          >
            Dùng vị trí hiện tại
          </Button>
        )}
      </View>

      {/* Address Input and Search - FIXED VERSION */}
      <View style={styles.addressContainer}>
        <TextInput
          label="Địa chỉ"
          value={addressQuery}
          onChangeText={handleAddressInputChange} // Use new handler
          style={[styles.input, { flex: 1 }]}
          placeholder="Nhập địa chỉ để tìm kiếm"
          right={searchLoading ? <TextInput.Icon icon={() => <ActivityIndicator size="small" />} /> : null}
        />
        <Button
          mode="contained"
          onPress={handleManualSearch}
          disabled={searchLoading || addressQuery.trim().length < 3}
          style={styles.searchButton}
          labelStyle={{ fontSize: 12 }}
        >
          {searchLoading ? "Đang tìm..." : "Tìm"}
        </Button>
      </View>

      {/* Address Suggestions */}
      {showSuggestions && addressSuggestions.length > 0 && (
        <Card style={styles.suggestionsContainer}>
          <Card.Content>
            <Title style={styles.suggestionsTitle}>Chọn địa chỉ phù hợp:</Title>
            {addressSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => selectAddress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion.display_name}</Text>
                {suggestion.address_details.road && (
                  <Text style={styles.suggestionSubText}>
                    📍 {suggestion.address_details.road}
                    {suggestion.address_details.house_number && `, ${suggestion.address_details.house_number}`}
                    {suggestion.address_details.city && `, ${suggestion.address_details.city}`}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            <Button
              mode="text"
              onPress={() => {
                setShowSuggestions(false);
                setAddressSuggestions([]);
              }}
              style={{ marginTop: 10 }}
            >
              Đóng
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Distance Information */}
      {distanceInfo && (
        <Card style={styles.distanceCard}>
          <Card.Content>
            <Title style={styles.distanceTitle}>Thông tin khoảng cách</Title>
            <Text style={styles.distanceText}>
              📍 Khoảng cách: {distanceInfo.distance} km
            </Text>
            <Text style={styles.distanceText}>
              ⏱️ Thời gian di chuyển: ~{distanceInfo.duration} phút
            </Text>
            <Text style={styles.distanceText}>
              💰 Phí vận chuyển ước tính: {distanceInfo.shippingFee} VND
            </Text>
            {userLocation && restaurantData.address.latitude && (
              <Button
                mode="text"
                onPress={() => calculateDistanceToRestaurant(userLocation.latitude, userLocation.longitude)}
                style={{ marginTop: 10 }}
                icon="refresh"
              >
                Tính lại khoảng cách
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

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
  locationControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 10,
    marginVertical: 10,
  },
  locationButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  distanceCard: {
    margin: 15,
    backgroundColor: "#f8f9fa",
  },
  distanceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2196F3",
  },
  distanceText: {
    fontSize: 14,
    marginVertical: 2,
    color: "#424242",
  },
  suggestionsContainer: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f9f9f9",
    marginVertical: 2,
    borderRadius: 6,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  suggestionSubText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});

export default ManageRestaurant;