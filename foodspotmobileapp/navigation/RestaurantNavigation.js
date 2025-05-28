import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantHome from "../components/Restaurant/RestaurantHome";
import AddFood from "../components/Restaurant/AddFood";
import EditFood from "../components/Restaurant/EditFood";
import DeleteFood from "../components/Restaurant/DeleteFood";
import ToggleAvailability from "../components/Restaurant/ToggleAvailability";
import ManageRestaurant from "../components/Restaurant/ManageRestaurant";
import ManageOrders from "../components/Restaurant/ManageOrders";
import ManageMenus from "../components/Restaurant/ManageMenus";
import FoodManagement from "../components/Restaurant/FoodManagement";

const RestaurantStack = createNativeStackNavigator();

const RestaurantNavigation = () => (
  <RestaurantStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#6200ee" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
      headerShown: true, // Bật header để hiển thị tiêu đề
    }}
  >
    <RestaurantStack.Screen
      name="RestaurantHome"
      component={RestaurantHome}
      options={{ title: "Quản lý Nhà hàng" }}
    />
    <RestaurantStack.Screen
      name="FoodManagement"
      component={FoodManagement}
      options={{ title: "Quản lý Món ăn" }}
    />
    <RestaurantStack.Screen
      name="AddFood"
      component={AddFood}
      options={{ title: "Thêm Món ăn" }}
    />
    <RestaurantStack.Screen
      name="EditFood"
      component={EditFood}
      options={{ title: "Chỉnh sửa Món ăn" }}
    />
    <RestaurantStack.Screen
      name="DeleteFood"
      component={DeleteFood}
      options={{ title: "Xóa Món ăn" }}
    />
    <RestaurantStack.Screen
      name="ToggleAvailability"
      component={ToggleAvailability}
      options={{ title: "Chuyển đổi Trạng thái" }}
    />
    <RestaurantStack.Screen
      name="ManageRestaurant"
      component={ManageRestaurant}
      options={{ title: "Quản lý Thông tin" }}
    />
    <RestaurantStack.Screen
      name="ManageOrders"
      component={ManageOrders}
      options={{ title: "Quản lý Đơn hàng" }}
    />
    <RestaurantStack.Screen
      name="ManageMenus"
      component={ManageMenus}
      options={{ title: "Quản lý Menu" }}
    />
  </RestaurantStack.Navigator>
);

export default RestaurantNavigation;