import { Text, View, Image, ScrollView } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useEffect, useState } from "react";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";

const OrderDetails = ({ route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadOrderDetails = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["orders-details"](orderId));
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
        return <ActivityIndicator size="large" color="#0000ff" />;

    return (
        <ScrollView style={{ padding: 10 }}>
            <Text style={[MyStyles.m, { fontWeight: "bold", fontSize: 18 }]}>Chi tiết đơn hàng #{order.id}</Text>
            <Text style={MyStyles.m}>Nhà hàng: {order.restaurant_name}</Text>
            <Text style={MyStyles.m}>Ngày đặt: {order.ordered_date}</Text>
            <Text style={MyStyles.m}>Tổng tiền: {order.total.toLocaleString()}đ</Text>
            <Text style={MyStyles.m}>Trạng thái: {order.status}</Text>

            <Text style={[MyStyles.m, { marginTop: 15, fontSize: 16, fontWeight: "bold" }]}>Danh sách món ăn:</Text>

            {order.order_details.map(item => (
                <View key={item.id} style={{ flexDirection: "row", marginVertical: 10 }}>
                    <Image source={{ uri: item.food.image }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontWeight: "bold" }}>{item.food.name}</Text>
                        <Text>Giá: {item.food.prices[0].price.toLocaleString()}đ</Text>
                        <Text>Số lượng: {item.quantity}</Text>
                        <Text>Phục vụ: {item.time_serve}</Text>
                        <Text>Tạm tính: {item.sub_total.toLocaleString()}đ</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

export default OrderDetails;
