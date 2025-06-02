import { Text, View, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { checkToken, loadOrderInfo } from "../../configs/Data";
import styles from "../../styles/OrderInfoStyles";

const OrderInfo = ({ route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const loadOrderDetails = async () => {
        try {
            const token = await checkToken(navigation);
            const res = await loadOrderInfo(token, orderId);
            setOrder(res);
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

export default OrderInfo;