import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MyUserContext, MyDispatchContext } from "./configs/MyContexts";
import MyUserReducer from "./reducers/MyUserReducer";
import Home from "./components/customer/Home";
import Food from "./components/customer/Food";
import Login from "./components/User/Login";
import Cart from "./components/customer/Cart";
import Notification from "./components/customer/Notification";
import Register from "./components/User/Register";
import RestaurantRegister from "./components/User/RestaurantRegister";
import Address from "./components/customer/Address";
import AddAddress from "./components/customer/AddAddress";
import UpdateAddress from "./components/customer/UpdateAddress";
import RestaurantDetails from "./components/customer/RestaurantDetails";
import MenuDetails from "./components/customer/MenuDetails";
import UserFollow from "./components/customer/UserFollow";
import UserFavorite from "./components/customer/UserFavorite";
import Checkout from "./components/customer/Checkout";
import Order from "./components/customer/Order";
import OrderInfo from "./components/customer/OrderInfo";
import OrderDetails from "./components/customer/OrderDetails";
import Profile from "./components/User/Profile";
import RestaurantNavigation from "./navigation/RestaurantNavigation";
import { Icon } from "react-native-paper";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect, useReducer, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import MyStyles from "./styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "./configs/Apis";
import Toast from "react-native-toast-message";

const Stack = createNativeStackNavigator();
const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Food" component={Food} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="Address" component={Address} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="AddAddress" component={AddAddress} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="UpdateAddress" component={UpdateAddress} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="RestaurantDetails" component={RestaurantDetails} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="MenuDetails" component={MenuDetails} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="UserFollow" component={UserFollow} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="UserFavorite" component={UserFavorite} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="Cart" component={Cart} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="Checkout" component={Checkout} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="Order" component={Order} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="OrderInfo" component={OrderInfo} options={{ headerShown: true, headerBackTitleVisible: false }} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
};

const AuthStack = createNativeStackNavigator();
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="Register" component={Register} options={{ headerShown: true, headerBackTitleVisible: false }} />
    <AuthStack.Screen name="RestaurantRegister" component={RestaurantRegister} options={{ headerShown: true, headerBackTitleVisible: false }} />
    <AuthStack.Screen name="Restaurant" component={RestaurantNavigation} options={{ tabBarIcon: () => <Icon size={30} source="store" /> }}/>
  </AuthStack.Navigator>
);

const CartStack = createNativeStackNavigator();
const CartStackNavigator = () => (
  <CartStack.Navigator screenOptions={{ headerShown: false }}>
    <CartStack.Screen name="Cart" component={Cart} />
    <CartStack.Screen name="Checkout" component={Checkout} options={{ headerShown: true, headerBackTitleVisible: false }} />
    <CartStack.Screen name="Address" component={Address} options={{ headerShown: true, headerBackTitleVisible: false }} />
  </CartStack.Navigator>
);

const Tab = createBottomTabNavigator();
const TabNavigator = ({ navigation }) => {
  const [user] = useContext(MyUserContext);

  useEffect(() => {
    if (user) {
      if (user.role === "RESTAURANT_USER") {
        navigation.navigate("Restaurant", { screen: "RestaurantHome" });
      } else if (user.role === "customer") {
        navigation.navigate("Home", { screen: "Home" });
      }
    }
  }, [user, navigation]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {user === null || user.role === "CUSTOMER" ? (
        <Tab.Screen
          name="Home"
          component={StackNavigator}
          options={{ tabBarIcon: () => <Icon size={30} source="home" /> }}
        />
      ) : (
        <Tab.Screen
          name="Restaurant"
          component={RestaurantNavigation}
          options={{ tabBarIcon: () => <Icon size={30} source="store" /> }}
        />
      )}
      {user === null ? (
        <Tab.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ tabBarIcon: () => <Icon size={30} source="account-plus" /> }}
        />
      ) : (
        <>
          {user.role === "RESTAURANT_USER" ? (
            <>
              <Tab.Screen
                name="Profile"
                component={Profile}
                options={{ tabBarIcon: () => <Icon size={30} source="account" /> }}
              />
            </>
          ) : (
            <>
              <Tab.Screen
                name="Cart"
                component={CartStackNavigator}
                options={{ tabBarIcon: () => <Icon size={30} source="cart" /> }}
              />
              <Tab.Screen
                name="Profile"
                component={Profile}
                options={{ tabBarIcon: () => <Icon size={30} source="account" /> }}
              />
            </>
          )}
        </>
      )}
    </Tab.Navigator>
  );
};

const SplashScreen = () => (
  <View style={MyStyles.container}>
    <ActivityIndicator animating={true} size="large" color="#6200EE" />
  </View>
);

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          const authApi = authApis(token);
          const userRes = await authApi.get(endpoints["current-user"]);
          dispatch({ type: "login", payload: userRes.data });
        }
      } catch (ex) {
        console.error("Lỗi kiểm tra token:", ex.response?.data || ex.message);
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("userId");
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
          <NavigationContainer ref={navigationRef}>
            <TabNavigator navigation={navigationRef} />
            <StatusBar style="auto" />
            <Toast />
          </NavigationContainer>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </PaperProvider>
  );
};

export default App;