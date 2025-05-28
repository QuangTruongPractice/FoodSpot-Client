import { ScrollView, View, Text, Dimensions } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContexts";
import { loadUser } from "../../configs/Data";

const Login = () => {
  const [user, setUser] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigation();
  const dispatch = useContext(MyDispatchContext);

  const setState = (value, field) => setUser({ ...user, [field]: value });

  const validate = () => {
    if (!user.username || !user.password) {
      setMsg("Vui lòng nhập tên đăng nhập và mật khẩu!");
      return false;
    }
    setMsg(null);
    return true;
  };

  const login = async () => {
    if (validate()) {
      try {
        setLoading(true);
        const loginData = {
          username: user.username,
          password: user.password,
          client_id: "mZRkDrLtg9De3TnMKW3B208Pl4ubbUfgwOjX2NCv",
          client_secret:
            "iTqsj04Ua6EpU0YQs5TCO4fW69vd7j6VBu9wKW9nPldV6TuWPDf42cV9eTIgAma3zjD4HKcSwltqZBrlNuPD31lbNuunOl0y8KvCjW4WrJy4TxqaMIUJrmwv6g2zBYSY",
          grant_type: "password",
        };

        let res = await Apis.post(endpoints["login"], loginData);
        const accessToken = res.data.access_token;

        await AsyncStorage.setItem("access_token", accessToken);
        let userRes = await loadUser(accessToken);
        await AsyncStorage.setItem("userId", userRes.id.toString());

        dispatch({
          type: "login",
          payload: userRes,
        });

        const userRole = userRes.role;
        if (userRole === "CUSTOMER") {
          nav.navigate("Home");
        } else if (userRole === "RESTAURANT_USER") {
          nav.navigate("Restaurant", { screen: "RestaurantHome" });
        } else {
          setMsg("Vai trò không hợp lệ!");
        }
      } catch (ex) {
        console.error("Lỗi đăng nhập:", ex.response?.data || ex.message);
        setMsg(
          ex.response?.data?.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const fields = [
    { label: "Tên đăng nhập", icon: "account", secureTextEntry: false, field: "username" },
    { label: "Mật khẩu", icon: "lock", secureTextEntry: true, field: "password" },
  ];

  const width = Dimensions.get("window").width * 0.9;

  return (
    <View style={[MyStyles.container, { alignItems: "center" }]}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 24 }}>FoodSpot</Text>

        <HelperText type="error" visible={!!msg}>
          {msg}
        </HelperText>

        {fields.map((i) => (
          <TextInput
            key={i.field}
            label={i.label}
            value={user[i.field]}
            onChangeText={(t) => setState(t, i.field)}
            secureTextEntry={i.secureTextEntry}
            right={<TextInput.Icon icon={i.icon} />}
            style={{ width, marginVertical: 8 }}
          />
        ))}

        <Button
          mode="contained"
          onPress={login}
          loading={loading}
          disabled={loading}
          style={{ width, marginVertical: 12 }}
        >
          Đăng nhập
        </Button>

        <Button
          mode="outlined"
          onPress={() => nav.navigate("Register")}
          style={{ width, borderColor: "#ccc", marginBottom: 10 }}
          textColor="#000"
        >
          Đăng ký
        </Button>

        <Text style={{ textAlign: "center", marginTop: 10 }}>
          Bạn là chủ nhà hàng?{" "}
          <Text
            style={{ color: "blue", textDecorationLine: "underline" }}
            onPress={() => nav.navigate("Auth", { screen: "RestaurantRegister" })}
          >
            Đăng ký tại đây
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
};

export default Login;