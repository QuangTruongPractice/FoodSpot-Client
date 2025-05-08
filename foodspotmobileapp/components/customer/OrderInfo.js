import { Text, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const OrderInfo = ({ route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const loadOrderDetails = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["orders-info"](orderId));
            setOrder(res.data);
        } catch (err) {
            console.error("Error loading order details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrderDetails();
    }, []);

    if (loading)
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.orderBox}>
                <Text style={styles.orderTitle}>Đơn hàng #{order.id}</Text>
                <Text style={styles.text}>🍽 Nhà hàng: <Text style={styles.boldText}>{order.restaurant_name}</Text></Text>
                <Text style={styles.text}>📅 Ngày đặt: {order.ordered_date}</Text>
                <Text style={styles.text}>💰 Tổng tiền: <Text style={styles.price}>{order.total.toLocaleString()}đ</Text></Text>
                <Text style={styles.text}>🚚 Trạng thái: <Text style={styles.status}>{order.status}</Text></Text>
            </View>

            <Text style={styles.foodListTitle}>🍽 Danh sách món ăn:</Text>

            {order.order_details.map(item => (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.navigate("OrderDetails", { orderDetailId: item.id })}
                >
                    <View style={styles.foodItem}>
                        <Image source={{ uri: item.food.image }} style={styles.foodImage} />
                        <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{item.food.name}</Text>
                            <Text>Giá: {item.food.prices[0].price.toLocaleString()}đ</Text>
                            <Text>Số lượng: {item.quantity}</Text>
                            <Text>Phục vụ: {item.time_serve}</Text>
                            <Text style={styles.subTotal}>Tạm tính: {item.sub_total.toLocaleString()}đ</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};
const styles = StyleSheet.create({
    container: { padding: 15, backgroundColor: "#f9f9f9" },
    loading: { marginTop: 50 },
    orderBox: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    orderTitle: { fontWeight: "bold", fontSize: 20, marginBottom: 5 },
    text: { marginVertical: 4, fontSize: 14, color: "#2d3436" },
    boldText: { fontWeight: "bold" },
    price: { fontWeight: "bold", color: "#e67e22" },
    status: { color: "#27ae60" },
    foodListTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    foodItem: { flexDirection: "row", marginBottom: 15, backgroundColor: "#fff", borderRadius: 10, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    foodImage: { width: 80, height: 80, borderRadius: 8 },
    foodInfo: { marginLeft: 12, flex: 1 },
    foodName: { fontWeight: "bold", fontSize: 16 },
    subTotal: { marginTop: 4, fontWeight: "500", color: "#e67e22" },
});

export default OrderInfo;
