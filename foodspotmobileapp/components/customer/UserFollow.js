import { Text, View, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserFollow = () => {
    const [restaurantDetails, setRestaurantDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();

    // Tải dữ liệu bao gồm nhà hàng theo dõi và chi tiết nhà hàng
    const loadData = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            nav.replace("Login");
            return;
        }
    
        try {
            // Lấy danh sách nhà hàng người dùng đã theo dõi
            const followRes = await authApis(token).get(endpoints["current-user-follow"]);
            const followRestaurant = followRes.data;
    
            // Lọc những nhà hàng có status === "FOLLOW"
            const followedRestaurants = followRestaurant.filter(follow => follow.status === "FOLLOW");
    
            if (followedRestaurants.length > 0) {
                // Lấy chi tiết từng nhà hàng và lưu id follow
                const details = await Promise.all(
                    followedRestaurants.map(async (follow) => {
                        const restaurantRes = await Apis.get(endpoints["restaurant-details"](follow.restaurant));
                        return { ...restaurantRes.data, follow_id: follow.id }; // Lưu follow_id
                    })
                );
                console.info(details);
                setRestaurantDetails(details);
            } else {
                setRestaurantDetails([]);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            setRestaurantDetails([]);
        } finally {
            setLoading(false);
        }
    };

    // Gọi hàm loadData khi component mount
    useEffect(() => {
        loadData();
    }, []);

    // Xử lý hủy theo dõi nhà hàng
    const handleUnfollow = async (followId) => {
        const token = await AsyncStorage.getItem("token");
        
        if (!token) {
            nav.replace("Login");
            return;
        }
    
        try {
            await authApis(token).patch(endpoints["follow-details"](followId), {
                status: "CANCEL"
            });
            // Cập nhật lại danh sách nhà hàng theo dõi sau khi hủy theo dõi
            setRestaurantDetails(prevState => prevState.filter(item => item.follow_id !== followId));

        } catch (error) {
            console.error("Error unfollowing restaurant:", error);
        }
    };

    // Render item nhà hàng
    const renderItem = ({ item }) => (
        <View style={{ flex: 1, backgroundColor: "#fff", marginBottom: 15 }}>
            {item && (
                <TouchableOpacity onPress={() => nav.navigate("RestaurantDetails", { restaurantId: item.id })}>
                <View style={{ flexDirection: "row", padding: 10, borderRadius: 8, backgroundColor: "#f8f8f8" }}>
                    <Image
                        source={{ uri: item.avatar || "https://picsum.photos/200" }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>{item.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 14, color: "#f39c12" }}>⭐ {item.star_rating}</Text>
                            <Text style={{ fontSize: 14, color: "#555", marginLeft: 5 }}>{item.rating}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.actionsColumn}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Tin nhắn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: "#e74c3c",
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 5,
                            }}
                            onPress={() => handleUnfollow(item.follow_id)}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Hủy theo dõi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, padding: 10 }}>
            {loading ? (
                <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>Đang tải dữ liệu...</Text>
            ) : restaurantDetails.length === 0 ? (
                <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>Bạn chưa theo dõi nhà hàng nào!</Text>
            ) : (
                <FlatList
                    data={restaurantDetails}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );
};
    const styles = StyleSheet.create({
        actionsColumn: {
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
          },
        actionButton: {
            backgroundColor: "#eee",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginBottom: 6,
          },
        actionButtonColor: {
            backgroundColor: "#9c27b0",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginBottom: 6,
          },
        actionButtonText: {
            fontWeight: "bold",
            color: "#333",
          },
    })

export default UserFollow;
