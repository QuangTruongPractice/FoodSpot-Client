import { Text, View, Image } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useContext } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      console.log("Token đã được xóa khỏi AsyncStorage");
      dispatch({ type: "logout" });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  if (!user || !user[0]) {
    return (
      <View style={[MyStyles.container, MyStyles.center]}>
        <Text style={[MyStyles.subject, { color: "#666", fontSize: 18 }]}>
          Bạn đã đăng xuất
        </Text>
      </View>
    );
  }

  const userData = user[0];

  return (
    <View style={[MyStyles.container, { padding: 20 }]}>
      <Card style={{ padding: 20, borderRadius: 20 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Image
            source={{ uri: userData.avatar || "https://picsum.photos/200" }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 10,
              backgroundColor: "#ccc",
            }}
          />
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            {userData.first_name || "Không có"} {userData.last_name || "Tên"}
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>
            {userData.role || "Người dùng"}
          </Text>
        </View>

        <View style={{ marginVertical: 10 }}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.info}>{userData.email || "Không có email"}</Text>
        </View>

        <View style={{ marginVertical: 10 }}>
          <Text style={styles.label}>Số điện thoại</Text>
          <Text style={styles.info}>
            {userData.phone_number || "Chưa cung cấp"}
          </Text>
        </View>

        <Button
          mode="contained"
          buttonColor="#ff4d4f"
          textColor="white"
          style={{ marginTop: 20 }}
          onPress={logout}
        >
          Đăng xuất
        </Button>
      </Card>
    </View>
  );
};

const styles = {
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  info: {
    fontSize: 16,
    color: "#000",
  },
};

export default Profile;
