import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();

    const loadOrders = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
            nav.replace("Login");
            return;
        }

        try {
            const res = await authApis(token).get(endpoints["orders"]);
            setOrders(res.data);
        } catch (err) {
            console.error("Error loading orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);


    return (
        <ScrollView style={{ padding: 10 }}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                orders.map((order) => (
                    <TouchableOpacity
                        key={order.id}
                        onPress={() => nav.navigate("OrderInfo", {orderId: order.id})}
                        style={{
                            backgroundColor: "#f9f9f9",
                            padding: 15,
                            marginBottom: 10,
                            borderRadius: 10,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: 2
                        }}
                    >
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                            Nhà hàng: {order.restaurant_name}
                        </Text>
                        <Text>Ngày đặt: {order.ordered_date}</Text>
                        <Text>Phí ship: {order.shipping_fee.toLocaleString()} VND</Text>
                        <Text>Tổng tiền: {order.total.toLocaleString()} VND</Text>
                        <Text>Trạng thái: {order.status}</Text>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
};

export default Order;
