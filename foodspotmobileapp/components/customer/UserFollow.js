import { Text, View, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserFollow = () => {
    const [restaurantDetails, setRestaurantDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();

    const loadData = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            nav.replace("Login");
            return;
        }

        try {
            const followRes = await authApis(token).get(endpoints["current-user-follow"]);
            const followRestaurant = followRes.data;
            const followedRestaurants = followRestaurant.filter(follow => follow.status === "FOLLOW");

            if (followedRestaurants.length > 0) {
                const details = await Promise.all(
                    followedRestaurants.map(async (follow) => {
                        const restaurantRes = await Apis.get(endpoints["restaurant-details"](follow.restaurant));
                        return { ...restaurantRes.data, follow_id: follow.id };
                    })
                );
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

    useEffect(() => {
        loadData();
    }, []);

    const handleUnfollow = async (followId) => {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            nav.replace("Login");
            return;
        }

        try {
            await authApis(token).patch(endpoints["follow-details"](followId), { status: "CANCEL" });
            setRestaurantDetails(prevState => prevState.filter(item => item.follow_id !== followId));
        } catch (error) {
            console.error("Error unfollowing restaurant:", error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item && (
                <TouchableOpacity onPress={() => nav.navigate("RestaurantDetails", { restaurantId: item.id })}>
                    <View style={styles.itemContainer}>
                        <Image source={{ uri: item.avatar || "https://picsum.photos/200" }} style={styles.avatar} />
                        <View style={styles.infoContainer}>
                            <Text style={styles.name}>{item.name}</Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.star}>⭐ {item.star_rating}</Text>
                                <Text style={styles.rating}>{item.rating}</Text>
                            </View>
                        </View>
                        <View style={styles.actionsColumn}>
                            <TouchableOpacity style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>Tin nhắn</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.unfollowButton} onPress={() => handleUnfollow(item.follow_id)}>
                                <Text style={styles.unfollowText}>Hủy theo dõi</Text>
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
                <Text style={styles.message}>Đang tải dữ liệu...</Text>
            ) : restaurantDetails.length === 0 ? (
                <Text style={styles.message}>Bạn chưa theo dõi nhà hàng nào!</Text>
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
    card: { flex: 1, backgroundColor: "#fff", marginBottom: 15 },
    itemContainer: { flexDirection: "row", padding: 10, borderRadius: 8, backgroundColor: "#f8f8f8" },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    infoContainer: { flex: 1, marginLeft: 10 },
    name: { fontSize: 16, fontWeight: "bold", color: "#333" },
    ratingRow: { flexDirection: "row", alignItems: "center" },
    star: { fontSize: 14, color: "#f39c12" },
    rating: { fontSize: 14, color: "#555", marginLeft: 5 },
    actionsColumn: { flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" },
    actionButton: { backgroundColor: "#eee", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
    actionButtonText: { fontWeight: "bold", color: "#333" },
    unfollowButton: { backgroundColor: "#e74c3c", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
    unfollowText: { color: "#fff", fontWeight: "bold" },
    message: { textAlign: "center", fontSize: 16, color: "#888" },
});

export default UserFollow;
