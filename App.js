import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MyUserContext, MyDispatchContext } from "./configs/MyContexts";
import MyUserReducer from "./reducers/MyUserReducer";
import Home from "./components/Home/Home";
import Login from "./components/User/Login";
import Register from "./components/User/Register";
import Profile from "./components/User/Profile";
import { Icon } from "react-native-paper";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { useContext, useReducer } from "react";
const Stack = createNativeStackNavigator();
const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="home" component={Home} options={{ title: "Ecommerce" }} />
    </Stack.Navigator>
  );
};

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  const [user] = useContext(MyUserContext);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="index"
        component={StackNavigator}
        options={{
          title: "Trang chủ",
          tabBarIcon: () => <Icon source="home" size={20} />,
        }}
      />
      {user === null ? (
        <>
          <Tab.Screen
            name="login"
            component={Login}
            options={{
              title: "Đăng nhập",
              tabBarIcon: () => <Icon source="account" size={20} />,
            }}
          />
          <Tab.Screen
            name="register"
            component={Register}
            options={{
              title: "Đăng ký",
              tabBarIcon: () => <Icon source="account-plus" size={20} />,
            }}
          />
        </>
      ) : (
        <Tab.Screen
          name="profile"
          component={Profile}
          options={{
            title: "Tài khoản",
            tabBarIcon: () => <Icon source="account" size={20} />,
          }}
        />
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