import { useContext } from "react";
import { MyUserContext } from "../../configs/MyContexts";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const RestaurantHome = () => {
  const [user] = useContext(MyUserContext);
  const navigation = useNavigation();

  if (!user || user.role !== "RESTAURANT_USER") {
    navigation.replace("RestaurantLogin");
    return null;
  }

  return (
    <View>
      <Text>Chào mừng đến với Trang chủ Nhà hàng</Text>
      {/* Các chức năng dành riêng cho nhà hàng */}
    </View>
  );
};

export default RestaurantHome;