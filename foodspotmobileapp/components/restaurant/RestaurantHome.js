import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, Card, Title, Paragraph, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext, MyDispatchContext } from "../../configs/MyContexts";

const RestaurantHome = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const dispatch = useContext(MyDispatchContext);
  const [user] = useContext(MyUserContext);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      if (!user || user.role !== "RESTAURANT_USER" || !user.is_approved) {
        Alert.alert("Lỗi", "Bạn không có quyền truy cập hoặc tài khoản chưa được phê duyệt!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints.restaurants);
      const userRestaurants = response.data.filter((r) => r.owner.id === user.id);
      if (!userRestaurants.length) {
        Alert.alert("Thông báo", "Bạn chưa có nhà hàng! Vui lòng đăng ký.");
        navigation.navigate("Auth", { screen: "RestaurantRegister" });
        return;
      }
      setRestaurants(userRestaurants);
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải thông tin nhà hàng!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        dispatch({ type: "logout" });
        navigation.navigate("Auth", { screen: "Login" });
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("userId");
      dispatch({ type: "logout" });
      navigation.navigate("Auth", { screen: "Login" });
    } catch (ex) {
      Alert.alert("Lỗi", "Không thể đăng xuất!");
    }
  };

  const navigateTo = (screen, restaurantId) => {
    navigation.navigate("Restaurant", { screen, params: { restaurantId } });
  };

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" color="#6200EE" />
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
        <Paragraph style={styles.subtitle}>
          Chào mừng, {user.first_name} {user.last_name}!
        </Paragraph>
      </View>

      {restaurants.map((restaurant) => (
        <View key={restaurant.id} style={styles.restaurantSection}>
          <Title style={styles.restaurantTitle}>{restaurant.name}</Title>
          <Card style={styles.card} onPress={() => navigateTo("AddFood", restaurant.id)}>
            <Card.Content>
              <Title>Đăng món ăn</Title>
              <Paragraph>Thêm món ăn mới và thiết lập giá.</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.card} onPress={() => navigateTo("ManageRestaurant", restaurant.id)}>
            <Card.Content>
              <Title>Quản lý thông tin</Title>
              <Paragraph>Cập nhật thông tin nhà hàng.</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.card} onPress={() => navigateTo("ManageOrders", restaurant.id)}>
            <Card.Content>
              <Title>Quản lý đơn hàng</Title>
              <Paragraph>Xem và cập nhật trạng thái đơn hàng.</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.card} onPress={() => navigateTo("ManageMenus", restaurant.id)}>
            <Card.Content>
              <Title>Quản lý menu</Title>
              <Paragraph>Thêm, chỉnh sửa hoặc xóa menu.</Paragraph>
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

export default RestaurantHome;