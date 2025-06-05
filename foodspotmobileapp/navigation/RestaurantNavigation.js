import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantHome from "../components/restaurant/RestaurantHome";
import AddFood from "../components/restaurant/AddFood";
import EditFood from "../components/restaurant/EditFood";
import DeleteFood from "../components/restaurant/DeleteFood";
import ToggleAvailability from "../components/restaurant/ToggleAvailability";
import ManageRestaurant from "../components/restaurant/ManageRestaurant";
import ManageOrders from "../components/restaurant/ManageOrders";
import ManageMenus from "../components/restaurant/ManageMenus";
import FoodManagement from "../components/restaurant/FoodManagement";
import OrderDetails from "../components/restaurant/OrderDetails";
import AddFoodInMenu from "../components/restaurant/AddFoodInMenu";
import EditMenu from "../components/restaurant/EditMenu";
import MenuDetails from "../components/restaurant/MenuDetails";
import AddMenu from "../components/restaurant/AddMenu";
import RevenueStatisticsScreen from "../components/restaurant/RevenueStatisticsScreen";
import FoodRevenueScreen from "../components/restaurant/FoodRevenueScreen";
import CategoryRevenueScreen from "../components/restaurant/CategoryRevenueScreen";

const RestaurantStack = createNativeStackNavigator();

const RestaurantNavigation = () => (
  <RestaurantStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#6200ee" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
      headerShown: true,
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
    <RestaurantStack.Screen
      name="OrderDetails"
      component={OrderDetails}
      options={{ title: "Chi tiết Đơn hàng" }}
    />
    <RestaurantStack.Screen
      name="AddFoodInMenu"
      component={AddFoodInMenu}
      options={{ title: "Thêm Món ăn vào Menu" }}
    />
    <RestaurantStack.Screen
      name="EditMenu"
      component={EditMenu}
      options={{ title: "Chỉnh sửa Menu" }}
    />
    <RestaurantStack.Screen
      name="MenuDetails"
      component={MenuDetails}
      options={{ title: "Chi tiết Menu" }}
    />
    <RestaurantStack.Screen
      name="AddMenu"
      component={AddMenu}
      options={{ title: "Thêm menu mới" }}
    />
    <RestaurantStack.Screen
      name="RevenueStatistics"
      component={RevenueStatisticsScreen}
      options={{ title: "Thống Kê Doanh Thu Tổng Hợp" }}
    />
    <RestaurantStack.Screen
      name="FoodRevenue"
      component={FoodRevenueScreen}
      options={{ title: "Thống Kê Doanh Thu Theo Món Ăn" }}
    />
    <RestaurantStack.Screen
      name="CategoryRevenue"
      component={CategoryRevenueScreen}
      options={{ title: "Thống Kê Doanh Thu Theo Danh Mục" }}
    />
  </RestaurantStack.Navigator>
);

export default RestaurantNavigation;