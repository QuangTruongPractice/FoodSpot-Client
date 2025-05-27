import { Text, View, FlatList, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { checkToken, loadUserFollow, loadRestaurantDetails } from "../../configs/Data";
import styles from "../../styles/FollowStyles";

const UserFollow = () => {
    const [restaurantDetails, setRestaurantDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();

    const loadData = async () => {
        setLoading(true);
        const token = await checkToken();

        try {
            const followRestaurant = await loadUserFollow(token);
            const followedRestaurants = followRestaurant.filter(follow => follow.status === "FOLLOW");

            if (followedRestaurants.length > 0) {
                const details = await Promise.all(
                    followedRestaurants.map(async (follow) => {
                        const restaurantRes = await loadRestaurantDetails(follow.restaurant);
                        return { ...restaurantRes, follow_id: follow.id };
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

    const handleUnfollow = async (restaurantId) => {
        const token = await checkToken();
        try {
            await authApis(token).post(endpoints["current-user-follow"], {
                restaurant: restaurantId,
                status: "CANCEL"
            });
            setRestaurantDetails(prevState =>
                prevState.filter(item => item.id !== restaurantId)
            );
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
                            <TouchableOpacity style={styles.unfollowButton} onPress={() => handleUnfollow(item.id)}>
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

export default UserFollow;
