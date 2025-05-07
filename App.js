import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MyUserContext, MyDispatchContext } from "./configs/MyContexts";
import MyUserReducer from "./reducers/MyUserReducer";
import Home from "./components/Home/Home";
import Login from "./components/User/Login";
import Register from "./components/User/Register";
import Profile from "./components/User/Profile";
import RestaurantDashboard from "./components/Restaurant/RestaurantDashboard";
import AddFood from "./components/Restaurant/AddFood";
import ManageRestaurant from "./components/Restaurant/ManageRestaurant";
import { Icon } from "react-native-paper";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect, useReducer, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import MyStyles from "./styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "./configs/Apis";

// Stack Navigator chính
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator cho Home (khách hàng)
const HomeStack = createNativeStackNavigator();
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen
      name="Home"
      component={Home}
      options={{ title: "Địa điểm ăn uống" }}
    />
    <HomeStack.Screen
      name="Profile"
      component={Profile}
      options={{ title: "Tài khoản" }}
    />
  </HomeStack.Navigator>
);

// Stack Navigator cho Restaurant (nhà hàng)
const RestaurantStack = createNativeStackNavigator();
const RestaurantStackNavigator = () => (
  <RestaurantStack.Navigator screenOptions={{ headerShown: false }}>
    <RestaurantStack.Screen
      name="RestaurantDashboard"
      component={RestaurantDashboard}
      options={{ title: "Quản lý Nhà hàng" }}
    />
    <RestaurantStack.Screen
      name="AddFood"
      component={AddFood}
      options={{ title: "Thêm món ăn" }}
    />
    <RestaurantStack.Screen
      name="ManageRestaurant"
      component={ManageRestaurant}
      options={{ title: "Quản lý thông tin" }}
    />
  </RestaurantStack.Navigator>
);

// Stack Navigator cho Authentication (đăng nhập/đăng ký)
const AuthStack = createNativeStackNavigator();
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen
      name="Login"
      component={Login}
      options={{ title: "Đăng nhập" }}
    />
    <AuthStack.Screen
      name="Register"
      component={Register}
      options={{ title: "Đăng ký" }}
    />
  </AuthStack.Navigator>
);

// Tab Navigator chính
const TabNavigator = () => {
  const [user] = useContext(MyUserContext);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#6200EE",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#ddd",
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => <Icon source="home" size={20} color={color} />,
        }}
      />
      {user === null ? (
        <Tab.Screen
          name="AuthTab"
          component={AuthStackNavigator}
          options={{
            title: "Tài khoản",
            tabBarIcon: ({ color }) => <Icon source="account" size={20} color={color} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="AccountTab"
          component={user.role === "RESTAURANT_USER" ? RestaurantStackNavigator : Profile}
          options={{
            title: user.role === "RESTAURANT_USER" ? "Quản lý" : "Tài khoản",
            tabBarIcon: ({ color }) => <Icon source="account" size={20} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Màn hình khởi đầu (Splash Screen)
const SplashScreen = () => (
  <View style={MyStyles.container}>
    <ActivityIndicator animating={true} size="large" color="#6200EE" />
  </View>
);

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [isLoading, setIsLoading] = useState(true); // Trạng thái kiểm tra đăng nhập

  // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          const authApi = authApis(token);
          const userRes = await authApi.get(endpoints["users_current-user_read"]);
          const userData = userRes.data;
          dispatch({ type: "login", payload: userData });
        }
      } catch (ex) {
        console.error("Lỗi kiểm tra token:", ex.response?.data || ex.message);
        await AsyncStorage.removeItem("access_token");
        dispatch({ type: "logout" });
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <PaperProvider>
        <SplashScreen />
        <StatusBar style="auto" />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <MyUserContext.Provider value={[user, dispatch]}>
        <MyDispatchContext.Provider value={dispatch}>
          <NavigationContainer>
            <TabNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </PaperProvider>
  );
};

export default App;