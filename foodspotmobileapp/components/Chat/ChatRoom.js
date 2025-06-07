import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, FlatList, 
  TouchableOpacity, KeyboardAvoidingView, SafeAreaView, Image
} from "react-native";
import { getDatabase, onValue, push, ref, set } from "firebase/database";
import { app } from "../../configs/FirebaseConfigs";
import { useNavigation } from "@react-navigation/native";
import { checkToken, loadUser, loadUserDetails, loadRestaurantDetails } from "../../configs/Data";
import styles from "../../styles/ChatRoomStyles";

const ChatRoom = ({ route }) => {
  const { restaurantId, userIdOverride } = route.params;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [otherName, setOtherName] = useState("");
  const [otherImage, setOtherImage] = useState(null);
  const db = getDatabase(app);
  const nav = useNavigation();

  const conversationId = userId && restaurantId
    ? `user_${userId.toString()}_restaurant_${restaurantId.toString()}`
    : null;

  const loadCurrentUser = async () => {
    const token = await checkToken(nav);
    const res = await loadUser(token);

    if (userIdOverride) {
      setUserId(userIdOverride);
    } else {
      setUserId(res.id);
    }
    setCurrentRole(res.role);
  };

  const loadOtherDetails = async () => {
    if (!userId || !currentRole) return;
    const token = await checkToken(nav);
    if (!token) return;

    try {
      if (currentRole === "CUSTOMER") {
        const data = await loadRestaurantDetails(restaurantId);
        setOtherName(data.name);
        setOtherImage(data.image);
      } else if (currentRole === "RESTAURANT_USER") {
        const data = await loadUserDetails(token, userIdOverride || userId);
        setOtherName(data.first_name + ' ' + data.last_name);
        setOtherImage(data.image);
      }
    } catch (e) {
      console.error("Load other details error:", e);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadOtherDetails();
  }, [userId, currentRole]);

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = ref(db, `messages/${conversationId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = [];

      if (data) {
        for (const key in data) {
          loadedMessages.push(data[key]);
        }
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      }

      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;

    const newMessage = {
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      senderId: userId,
      text: message,
      timestamp: Date.now(),
    };

    const messageRef = push(ref(db, `messages/${conversationId}`));
    try {
      await set(messageRef, newMessage);
      setMessage("");
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn: ", err.message || err);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.senderId === userId
          ? styles.messageSelf
          : styles.messageOther
      ]}
    >
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {otherImage ? (
          <Image source={{ uri: otherImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {otherName ? otherName.charAt(0) : "?"}
            </Text>
          </View>
        )}
        <Text style={styles.headerTitle}>{otherName}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Nhập tin nhắn..."
            style={styles.textInput}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoom;