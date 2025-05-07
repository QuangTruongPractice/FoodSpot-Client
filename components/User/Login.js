import { ScrollView, View, ActivityIndicator } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContexts";

const Login = () => {
  const info = [
    { label: "Email", icon: "email", secureTextEntry: false, field: "username" }, // Sử dụng email thay vì username
    { label: "Mật khẩu", icon: "eye", secureTextEntry: true, field: "password" },
  ];
  const [user, setUser] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false); // Thêm trạng thái kiểm tra
  const nav = useNavigation();
  const dispatch = useContext(MyDispatchContext);

  const setState = (value, field) => {
    setUser({ ...user, [field]: value });
  };

  const validate = () => {
    if (!user.username || !user.password) {
      setMsg("Vui lòng nhập email và mật khẩu!");
      return false;
    }
    setMsg(null);
    return true;
  };

  const login = async () => {
    if (validate()) {
      try {
        setLoading(true);
        setChecking(true); // Bắt đầu kiểm tra
        setMsg(null);

        const loginData = {
          username: user.username, // Email của người dùng
          password: user.password,
          client_id: "ly6xF1VvDFftDXCFUZtr3ZNNzLqcTUzv1uz7wmVO",
          client_secret:
            "tVdL3xRmmzbdc1DrI4IP4SqxQAjo1uAa7BJ64l00jB5R3wZg06VPyNNwrYMHlblZFAiCnakzFQc8Pbwdov5n7g5lhuoFxbPLkMDlSmS94CM5mpbbTYzCJsYhRK7RkBMV",
          grant_type: "password",
        };
        console.log("Dữ liệu gửi tới /o/token/:", loginData);

        // Gọi API đăng nhập
        let res = await Apis.post(endpoints["login"], loginData);
        const accessToken = res.data.access_token;
        console.log("Access Token:", accessToken);

        // Lưu token vào AsyncStorage
        await AsyncStorage.setItem("access_token", accessToken);
        console.log("Token đã lưu vào AsyncStorage:", accessToken);

        // Gọi API để lấy thông tin người dùng
        let userRes = await authApis(accessToken).get(endpoints["users_current-user_read"]);
        const userData = userRes.data;
        console.log("Thông tin người dùng:", userData);

        // Cập nhật MyUserContext
        dispatch({
          type: "login",
          payload: userData, // Lưu thông tin user
        });

        // Điều hướng dựa trên vai trò
        if (userData.role === "CUSTOMER") {
          nav.navigate("HomeTab");
        } else if (userData.role === "RESTAURANT_USER") {
          nav.navigate("RestaurantDashboard");
        } else {
          setMsg("Vai trò không hợp lệ!");
          await AsyncStorage.removeItem("access_token");
          dispatch({ type: "logout" });
        }
      } catch (ex) {
        console.error("Lỗi đăng nhập:", ex.response?.data || ex.message);
        setMsg(
          ex.response?.data?.detail ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!"
        );
      } finally {
        setLoading(false);
        setChecking(false); // Kết thúc kiểm tra
      }
    }
  };

  return (
    <View style={MyStyles.container}>
      <ScrollView>
        {checking && (
          <ActivityIndicator
            animating={true}
            size="large"
            style={MyStyles.margin}
          />
        )}
        <HelperText type="error" visible={!!msg}>
          {msg}
        </HelperText>

        {info.map((i) => (
          <TextInput
            value={user[i.field]}
            onChangeText={(t) => setState(t, i.field)}
            style={MyStyles.margin}
            key={i.field}
            label={i.label}
            secureTextEntry={i.secureTextEntry}
            right={<TextInput.Icon icon={i.icon} />}
          />
        ))}

        <Button
          disabled={loading}
          loading={loading}
          onPress={login}
          mode="contained"
          style={MyStyles.margin}
        >
          Đăng nhập
        </Button>

        <Button
          mode="text"
          onPress={() => nav.navigate("Register")}
          style={MyStyles.margin}
        >
          Bạn chưa có tài khoản? Đăng ký ngay
        </Button>
      </ScrollView>
    </View>
  );
};

export default Login;