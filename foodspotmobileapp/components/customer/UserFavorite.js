import { Text, View, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconButton } from "react-native-paper";

const UserFavorite = () => {
    const [foodDetails, setFoodDetails] = useState([]);
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
            const favRes = await authApis(token).get(endpoints["current-user-favorite"]);
            const favFood = favRes.data;
            console.info(favFood.data);
    
            const favoriteFoods = favFood.filter(fav => fav.status === "FAVORITE");
    
            if (favoriteFoods.length > 0) {
                const details = await Promise.all(
                    favoriteFoods.map(async (fav) => {
                        const foodRes = await Apis.get(endpoints["food-details"](fav.food));
                        const foodData = foodRes.data;
                        console.log("Đây là dữ liệu:", foodRes.data);
                        const minPrice = foodData.prices && foodData.prices.length > 0
                            ? Math.min(...foodData.prices.map(p => p.price))
                            : 0; // Nếu không có price nào thì cho 0
                        
                        return { ...foodData, min_price: minPrice, fav_id: fav.id };
                    })
                );
                console.info(details);
                setFoodDetails(details);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            setFoodDetails([]);
        } finally {
            setLoading(false);
        }
    };

    // Gọi hàm loadData khi component mount
    useEffect(() => {
        loadData();
    }, []);

    // Xử lý hủy theo dõi nhà hàng
    const handleUnfavorite = async (favId) => {
        const token = await AsyncStorage.getItem("token");
        
        if (!token) {
            nav.replace("Login");
            return;
        }
    
        try {
            await authApis(token).patch(endpoints["favorite-details"](favId), {
                status: "CANCEL"
            });
            // Cập nhật lại danh sách nhà hàng theo dõi sau khi hủy theo dõi
            setFoodDetails(prevState => prevState.filter(item => item.fav_id !== favId));

        } catch (error) {
            console.error("Error unfavorite food:", error);
        }
    };
    
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item && (
                <TouchableOpacity
                    style={styles.itemContainer}
                    onPress={() => nav.navigate("Food", { foodId: item.id })}
                >
                    <Image
                        source={{ uri: item.image }}
                        style={styles.avatar}
                    />
                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.priceStarContainer}>
                            <Text style={styles.price}>{item.min_price.toLocaleString()} đ</Text>
                            <Text style={styles.star}>⭐ {item.star_rating}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => handleUnfavorite(item.fav_id)}
                    >
                        <View style={styles.actionsColumn}>
                            <IconButton
                                icon="heart"
                                size={24}
                                iconColor="red"
                                containerColor="#ffe6e6"  // nền nhẹ nhẹ cho icon
                                style={{
                                    borderRadius: 8,
                                    marginRight: 4,
                                    marginTop: 8
                                }}
                            />
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, padding: 10 }}>
            {loading ? (
                <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>Đang tải dữ liệu...</Text>
            ) : foodDetails.length === 0 ? (
                <Text style={{ textAlign: "center", fontSize: 16, color: "#888" }}>Bạn chưa yêu thích món ăn nào!</Text>
            ) : (
                <FlatList
                    data={foodDetails}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );
};
const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: "#fff",
        marginBottom: 15,
        borderRadius: 8,
        overflow: "hidden",
        elevation: 2, // đổ bóng nhẹ cho Android
        shadowColor: "#000", // đổ bóng nhẹ cho iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 8, // nhẹ nhẹ cho avatar vuông
        backgroundColor: "#eee",
    },
    infoContainer: {
        flex: 1,
        marginLeft: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    description: {
        fontSize: 13,
        color: "#888",
        marginTop: 2,
    },
    priceStarContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    price: {
        fontSize: 14,
        color: "#e74c3c",
        fontWeight: "600",
    },
    star: {
        fontSize: 13,
        color: "#f39c12",
        marginLeft: 10,
    },
    favoriteButton: {
        width: 32,
        height: 32,
        backgroundColor: "#ffe6e6",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
});

export default UserFavorite;
