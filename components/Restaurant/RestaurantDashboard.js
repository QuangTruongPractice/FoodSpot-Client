import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, Card, Title, Paragraph, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";

const RestaurantDashboard = () => {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]); // Danh sách nhà hàng của owner
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Lấy thông tin người dùng và danh sách nhà hàng
  const fetchUserAndRestaurants = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại!");
      }

      const authApi = authApis(token);

      // Lấy thông tin người dùng hiện tại
      const userResponse = await authApi.get(endpoints["users_current-user_read"]);
      const userData = userResponse.data;
      console.log("Thông tin người dùng:", userData);
      setUser(userData);

      // Kiểm tra vai trò người dùng
      if (userData.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Bạn không có quyền truy cập khu vực này!");
        navigation.navigate("Login");
        return;
      }

      // Lấy danh sách nhà hàng của người dùng
      const restaurantResponse = await authApi.get(endpoints["restaurants_list"]);
      const userRestaurants = restaurantResponse.data.filter(r => r.owner.id === userData.id);
      if (!userRestaurants || userRestaurants.length === 0) {
        Alert.alert("Lỗi", "Bạn chưa có nhà hàng nào!");
        return;
      }
      console.log("Danh sách nhà hàng:", userRestaurants);
      setRestaurants(userRestaurants);
    } catch (ex) {
      console.error("Lỗi khi lấy thông tin:", ex.response?.data || ex.message);
      Alert.alert("Lỗi", "Không thể tải thông tin. Vui lòng thử lại!");
      navigation.navigate("Login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndRestaurants();
  }, []);

  // Hàm đăng xuất
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      navigation.navigate("Login");
    } catch (ex) {
      console.error("Lỗi khi đăng xuất:", ex);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
    }
  };

  // Điều hướng đến màn hình đăng món ăn
  const handleAddFood = (restaurantId) => {
    navigation.navigate("AddFood", { restaurantId });
  };

  // Điều hướng đến màn hình quản lý thông tin nhà hàng
  const handleManageRestaurant = (restaurantId) => {
    navigation.navigate("ManageRestaurant", { restaurantId });
  };

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (!user || !restaurants.length) {
    return null;
  }

  return (
    <ScrollView style={MyStyles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Quản lý Nhà hàng</Title>
        <Paragraph style={styles.subtitle}>Chào mừng, {user.first_name} {user.last_name}!</Paragraph>
      </View>

      {restaurants.map((restaurant) => (
        <View key={restaurant.id} style={styles.restaurantSection}>
          <Title style={styles.restaurantTitle}>{restaurant.name}</Title>

          <Card style={styles.card} onPress={() => handleAddFood(restaurant.id)}>
            <Card.Content>
              <Title>Đăng món ăn</Title>
              <Paragraph>Thêm món ăn mới và thiết lập giá theo buổi.</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.card} onPress={() => handleManageRestaurant(restaurant.id)}>
            <Card.Content>
              <Title>Quản lý thông tin</Title>
              <Paragraph>Cập nhật thông tin nhà hàng và phí ship.</Paragraph>
            </Card.Content>
          </Card>
        </View>
      ))}

      <Button
        mode="contained"
        style={[MyStyles.margin, styles.logoutButton]}
        onPress={handleLogout}
      >
        Đăng xuất
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
  },
  restaurantSection: {
    marginBottom: 20,
  },
  restaurantTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
  },
  card: {
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    marginTop: 20,
  },
});

export default RestaurantDashboard;