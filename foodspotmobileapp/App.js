import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MyUserContext, MyDispatchContext } from "./configs/MyContexts";
import MyUserReducer from "./reducers/MyUserReducer";
import Home from "./components/customer/Home";
import Food from "./components/customer/Food";
import Login from "./components/customer/Login";
import Cart from "./components/customer/Cart";
import Notification from "./components/customer/Notification";
import Register from "./components/customer/Register";
import Address from "./components/customer/Address";
import AddAddress from "./components/customer/AddAddress";
import UpdateAddress from "./components/customer/UpdateAddress";
import RestaurantDetails from "./components/customer/RestaurantDetails";
import MenuDetails from "./components/customer/MenuDetails";
import Profile from "./components/customer/Profile";
import { Icon } from "react-native-paper";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { useContext, useReducer } from "react";

const Stack = createNativeStackNavigator();
const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Tab.Screen name="Home" component={Home} options={{ headerShown: false }}/>
      <Tab.Screen name="Food" component={Food}  options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="Address" component={Address} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="AddAddress" component={AddAddress} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="UpdateAddress" component={UpdateAddress} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="RestaurantDetails" component={RestaurantDetails} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="MenuDetails" component={MenuDetails} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
      <Tab.Screen name="Login" component={Login} options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
      }}/>
    </Stack.Navigator>
  );
}

const AuthStack = createNativeStackNavigator();
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="Register" component={Register}
        options={{
          headerShown: true,  // Hiển thị header cho màn hình Food
          headerBackTitleVisible: false,  // Ẩn tên màn hình khi back
        }}/>
  </AuthStack.Navigator>
);

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  const [user] = useContext(MyUserContext);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={StackNavigator} options={{tabBarIcon: () => <Icon size={30} source="home" />}}/>
      {user === null ? (
      <Tab.Screen name="Auth" component={AuthStackNavigator} options={{ tabBarIcon: () => <Icon size={30} source="account-plus" /> }}/>
      ):(
      <>
      <Tab.Screen name="Cart" component={Cart} options={{tabBarIcon: () => <Icon size={30} source="cart" />}}/>
      <Tab.Screen name="Notifications" component={Notification} options={{ tabBarIcon: () => <Icon size={30} source="bell" /> }}/>
      <Tab.Screen name="Profile" component={Profile} options={{tabBarIcon: () => <Icon size={30} source="account"/> }}/>
      </>
      )}
    </Tab.Navigator>
  );
};

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <PaperProvider>
      <MyUserContext.Provider value={[user, dispatch]}>
        <MyDispatchContext.Provider value={dispatch}>
          <NavigationContainer>
            <TabNavigator />
            <StatusBar style="auto" /> {/* Thêm StatusBar nếu cần */}
          </NavigationContainer>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </PaperProvider>
  );
};

export default App;

