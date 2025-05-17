import React, { useEffect, useState, useContext } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Card, Title, Paragraph, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints.orders);
      const restaurantOrders = response.data.filter((order) => order.restaurant.id === restaurantId);
      setOrders(restaurantOrders);
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải đơn hàng!";
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
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      const authApi = authApis(token);
      await authApi.patch(endpoints["orders-info"](orderId), { status });
      Alert.alert("Thành công", "Trạng thái đơn hàng đã được cập nhật!");
      fetchOrders();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể cập nhật trạng thái!";
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

  const renderOrder = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Đơn hàng #{item.id}</Title>
        <Paragraph>Khách hàng: {item.user.email}</Paragraph>
        <Paragraph>Tổng tiền: {item.total} VND</Paragraph>
        <Paragraph>Trạng thái: {item.status}</Paragraph>
      </Card.Content>
      <Card.Actions>
        {item.status === "PENDING" && (
          <Button onPress={() => updateOrderStatus(item.id, "CONFIRMED")}>Xác nhận</Button>
        )}
        {item.status === "CONFIRMED" && (
          <Button onPress={() => updateOrderStatus(item.id, "DELIVERED")}>Giao hàng</Button>
        )}
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={MyStyles.container}>
      <Title style={styles.title}>Quản lý Đơn hàng</Title>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  card: {
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
  },
  list: {
    paddingBottom: 20,
  },
});

export default ManageOrders;