import { Text, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useContext } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const user = useContext(MyUserContext); // user là mảng [userData, dispatch]
  const dispatch = useContext(MyDispatchContext);

  // Log để debug
  console.info("User trong Profile:", user);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      console.log("Token đã được xóa khỏi AsyncStorage");
      dispatch({ type: "logout" });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  // Nếu user không tồn tại hoặc user[0] không có (đã đăng xuất)
  if (!user || !user[0]) {
    return <Text style={MyStyles.subject}>ĐÃ ĐĂNG XUẤT</Text>;
  }

  // Lấy thông tin người dùng từ user[0]
  const userData = user[0];

  return (
    <View style={[MyStyles.container, MyStyles.center]}>
      <Text style={MyStyles.subject}>
        {userData.first_name || "Không có"} {userData.last_name || "tên"}
      </Text>
      <Text style={MyStyles.margin}>Email: {userData.email || "Không có email"}</Text>
      <Text style={MyStyles.margin}>
        Số điện thoại: {userData.phone_number || "Chưa cung cấp"}
      </Text>
      <Text style={MyStyles.margin}>Vai trò: {userData.role || "Không xác định"}</Text>
      <Button mode="contained-tonal" onPress={logout}>
        Đăng xuất
      </Button>
    </View>
  );
};

export default Profile;