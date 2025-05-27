import { Text, View, FlatList, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { IconButton } from "react-native-paper";
import { checkToken, loadUserFavorite, loadFoodDetails, getCurrentTimeServe } from "../../configs/Data";
import styles from "../../styles/FavoriteStyles";

const UserFavorite = () => {
  const [foodDetails, setFoodDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();

  const loadData = async () => {
    setLoading(true);
    const token = await checkToken();
    try {
      const favFood = await loadUserFavorite(token);
      const favoriteFoods = favFood.filter(fav => fav.status === "FAVORITE");

      if (favoriteFoods.length > 0) {
        const currentTimeServe = getCurrentTimeServe();
        const details = await Promise.all(
          favoriteFoods.map(async (fav) => {
            const foodData = await loadFoodDetails(fav.food);
            const matchedPriceObj = foodData.prices?.find(p => p.time_serve === currentTimeServe);
            const priceAtCurrentTime = matchedPriceObj ? matchedPriceObj.price : 0;

            return { ...foodData, price: priceAtCurrentTime, fav_id: fav.id };
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

  useEffect(() => {
    loadData();
  }, []);

  const handleUnfavorite = async (foodId) => {
    const token = await checkToken();
    try {
      await authApis(token).post(endpoints["current-user-favorite"], { 
        food: foodId,
        status: "CANCEL" 
      });
      setFoodDetails(prevState =>
        prevState.filter(item => item.id !== foodId)
      );
    } catch (error) {
      console.error("Error unfavorite food:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item && (
        <TouchableOpacity style={styles.itemContainer} onPress={() => nav.navigate("Food", { foodId: item.id })}>
          <Image source={{ uri: item.image }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <View style={styles.priceStarContainer}>
              <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
              <Text style={styles.star}>⭐ {item.star_rating}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={() => handleUnfavorite(item.id)}>
            <View style={styles.actionsColumn}>
              <IconButton icon="heart" size={24} iconColor="red" containerColor="#ffe6e6" style={{ borderRadius: 8, marginRight: 4, marginTop: 8 }} />
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
        <FlatList data={foodDetails} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
      )}
    </View>
  );
};

export default UserFavorite;
