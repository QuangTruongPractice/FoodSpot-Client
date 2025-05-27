import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, Card, Title, Paragraph, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext, MyDispatchContext } from "../../configs/MyContexts";

const RestaurantHome = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const dispatch = useContext(MyDispatchContext);
  const [user] = useContext(MyUserContext);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Vui lòng đăng nhập lại!");
      }

      if (!user || user.role !== "RESTAURANT_USER") {
        throw new Error("Chỉ người dùng có vai trò RESTAURANT_USER mới có quyền truy cập!");
      }

      if (!user.is_approved) {
        throw new Error("Tài khoản nhà hàng chưa được phê duyệt!");
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints.current_restaurant);
      setRestaurant(response.data);
    } catch (ex) {
      let errorMessage = ex.response?.data?.error || ex.message || "Không thể tải thông tin nhà hàng!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        dispatch({ type: "logout" });
        navigation.navigate("Login");
      } else if (ex.response?.status === 404) {
        errorMessage = "Bạn chưa sở hữu nhà hàng nào!";
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRestaurant();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("userId");
      dispatch({ type: "logout" });
      navigation.navigate("Login");
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

  if (!user || !restaurant) {
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

      <View style={styles.restaurantSection}>
        <Title style={styles.restaurantTitle}>{restaurant.name}</Title>
        <Card
          style={styles.card}
          onPress={() => navigateTo("FoodManagement", restaurant.id)}
        >
          <Card.Content>
            <Title>Quản lý món ăn</Title>
            <Paragraph>Xem, thêm, sửa hoặc xóa món ăn.</Paragraph>
          </Card.Content>
        </Card>
 UB
        <Card
          style={styles.card}
          onPress={() => navigateTo("ManageRestaurant", restaurant.id)}
        >
          <Card.Content>
            <Title>Quản lý thông tin</Title>
            <Paragraph>Cập nhật thông tin nhà hàng.</Paragraph>
          </Card.Content>
        </Card>
        <Card
          style={styles.card}
          onPress={() => navigateTo("ManageOrders", restaurant.id)}
        >
          <Card.Content>
            <Title>Quản lý đơn hàng</Title>
            <Paragraph>Xem và cập nhật trạng thái đơn hàng.</Paragraph>
          </Card.Content>
        </Card>
        <Card
          style={styles.card}
          onPress={() => navigateTo("ManageMenus", restaurant.id)}
        >
          <Card.Content>
            <Title>Quản lý menu</Title>
            <Paragraph>Thêm, chỉnh sửa hoặc xóa menu.</Paragraph>
          </Card.Content>
        </Card>
      </View>

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