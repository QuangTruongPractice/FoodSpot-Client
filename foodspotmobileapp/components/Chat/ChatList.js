import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, SafeAreaView, Image
} from "react-native";
import { useEffect, useState } from "react";
import { getDatabase, onValue, ref } from "firebase/database";
import { app } from "../../configs/FirebaseConfigs";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  checkToken, loadUser, loadUserDetails, loadRestaurantDetails
} from "../../configs/Data";
import { authApis, endpoints } from "../../configs/Apis";
import styles from "../../styles/ChatListStyles";

const Notification = () => {
  const [conversations, setConversations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getDatabase(app);
  const nav = useNavigation();
  const isFocused = useIsFocused();

  const loadCurrentUser = async () => {
    setLoading(true);
    try {
      const token = await checkToken(nav);
      const res = await loadUser(token);
      setCurrentRole(res.role);

      if (res.role === "RESTAURANT_USER") {
        const restaurant = await authApis(token).get(endpoints["restaurant-owner-check"]);
        setCurrentUserId(restaurant.data.restaurant_id);
      } else {
        setCurrentUserId(res.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadOtherDetails = async (otherId) => {
    const token = await checkToken(nav);
    if (!token || !currentUserId || !currentRole) return { otherName: "", otherImage: null };

    try {
      if (currentRole === "CUSTOMER") {
        const data = await loadRestaurantDetails(otherId);
        return { otherName: data.name, otherImage: data.image };
      } else if (currentRole === "RESTAURANT_USER") {
        const data = await loadUserDetails(token, otherId);
        return {
          otherName: `${data.first_name} ${data.last_name}`,
          otherImage: data.image,
        };
      }
    } catch (e) {
      console.error("Load other details error:", e);
    }

    return { otherName: "", otherImage: null };
  };

  const loadChatList = async () => {
    if (!currentUserId || !currentRole) return;

    const messagesRef = ref(db, "messages/");
    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        return;
      }

      const convIds = Object.keys(data);

      const convPromises = convIds.map(async (convId) => {
        const parts = convId.split("_");
        const userIdx = parts.indexOf("user");
        const restaurantIdx = parts.indexOf("restaurant");
        if (userIdx === -1 || restaurantIdx === -1) return null;

        const userId = parts[userIdx + 1];
        const restaurantId = parts[restaurantIdx + 1];

        const isCustomer = currentRole === "CUSTOMER";
        const isRestaurantUser = currentRole === "RESTAURANT_USER";

        if (
          (isCustomer && currentUserId == userId) ||
          (isRestaurantUser && currentUserId == restaurantId)
        ) {
          const otherId = isCustomer ? restaurantId : userId;
          const { otherName, otherImage } = await loadOtherDetails(otherId);

          return { convId, otherId, otherName, otherImage };
        }

        return null;
      });

      const convs = (await Promise.all(convPromises)).filter(Boolean);
      setConversations(convs);
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    loadCurrentUser();
  }, [isFocused]);

  useEffect(() => {
    loadChatList();
  }, [currentUserId, currentRole]);

  const goToChat = (item) => {
    if (currentRole === "RESTAURANT_USER") {
      nav.navigate("ChatRoom", {
        restaurantId: currentUserId,
        userIdOverride: item.otherId,
      });
    } else {
      nav.navigate("ChatRoom", {
        restaurantId: item.otherId,
      });
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Tin nhắn</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.convId}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => goToChat(item)}
            style={styles.chatItem}
            activeOpacity={0.8}
          >
            {item.otherImage ? (
              <Image source={{ uri: item.otherImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {item.otherName?.charAt(0) || "?"}
                </Text>
              </View>
            )}
            <Text style={styles.chatTitle}>{item.otherName}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Notification;
