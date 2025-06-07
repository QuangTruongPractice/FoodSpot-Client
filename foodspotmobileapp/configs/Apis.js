import axios from "axios"
import qs from "qs";

const BASE_URL = 'http://192.168.1.4:8000/';

export const endpoints = {
    //order
    'orders': '/orders/',
    'orders-info': (orderId) => `/orders/${orderId}/`,
    'orders-detail': (id) => `/order-detail/${id}/`,
    'checkout': '/orders/checkout/',
    'check-ordered': 'check-ordered',
    "by-order": (orderId) => `/order-detail/by-order/${orderId}/`,
    "orders-current-restaurant": "/orders/current-restaurant-orders/",

    //payment
    'momo-payment': '/momo-payment/',
    //food
    'foods-category': '/foods-category/',
    'foods': '/foods/',
    'food-details': (foodId) => `/foods/${foodId}/`,
    'food-reviews': (foodId) => `/foods/${foodId}/reviews/`,
    "food-add-price": (foodId) => `/foods/${foodId}/add_price/`,
    "food-update-price": (foodId) => `/foods/${foodId}/update_price/`,
    "food-delete-price": (foodId) => `/foods/${foodId}/delete_price/`,
    
    //User
    'current-user': '/users/current-user/',
    'current-user-follow': '/users/current-user/follow/',
    'current-user-favorite': '/users/current-user/favorite/',
    'current-user-food-reviews': '/users/current-user/food-reviews/',
    "current_restaurant":"/users/current-user/restaurant/",
    //Menu
    'menus': '/menus/',
    'menus-details': (id) => `/menus/${id}/`,
    "add-food-to-menu": (id) => `/menus/${id}/add-food/`,
    "foods-in-menu": (id) => `/menus/${id}/foods/`,
    //Restaurant
    'restaurants':'/restaurants/',
    'restaurant-details': (id) => `/restaurants/${id}/`,
    'restaurant-menus': (id) => `/restaurants/${id}/menus/`,
    'restaurant-foods': (id) => `/restaurants/${id}/foods/`,
    'restaurant-reviews': (id) => `/restaurants/${id}/reviews/`,

    // Users Address
    "users-address_list": "/users-address/",
    "users-address_read": (id) => `/users-address/${id}/`,

    // Users
    "users_list": "/users/",
    "users_create": "/users/",
    "users_read": (id) => `/users/${id}/`,
    "register_customer": "/users/register-customer/",
    "register_restaurant": "/users/register-restaurant/",
    'login': '/o/token/',

    //Cart
    'add-to-cart': '/add-to-cart/',
    'my-cart': '/cart/my-cart/',
    'delete-cart': cartId => `/cart/${cartId}/`,
    'sub-carts': '/cart/sub-carts/',
    'delete-multiple-sub-carts': '/sub-cart/delete-sub-carts/',
    'delete-multiple-items': '/sub-cart-item/delete-multiple/',
    'restaurant-sub-cart': '/sub-cart/restaurant-sub-cart/',
    'update-sub-cart-item': '/update-sub-cart-item/',

    //Reviews
    'reviews-restaurant': '/restaurant-review/',
    'reviews-food': '/foods-review/',
    'reviews-restaurant-detail': (id) => `/restaurant-review/${id}/`,
    'reviews-food-detail': (id) => `/foods-review/${id}/`,

      // Revenue Statistics
    "food-revenue": (restaurantId) => `/restaurant/${restaurantId}/food-revenue/`,
    "category-revenue": (restaurantId) => `/restaurant/${restaurantId}/category-revenue/`,
    "combined-revenue": (restaurantId) => `/restaurant/${restaurantId}/revenue-statistics/`,


    // Notifications
    'notifications': '/notifications/',
    'mark-as-read': (id) => `/notifications/${id}/mark_read/`,
    'mark-all-as-read': '/notifications/mark_all_read/',
    'unread-count': '/notifications/unread_count/'
}

  
// export const getFoodRevenue = async (restaurantId, period, token) => {
//   const authApi = authApis(token);
//   try {
//     const response = await authApi.get(endpoints['food-revenue'](restaurantId), {
//       params: { period },
//       paramsSerializer: (params) => qs.stringify(params, { encode: false }),
//     });
//     // Kiểm tra dữ liệu trả về
//     if (!response.data?.data?.summary) {
//       throw new Error('Dữ liệu doanh thu không đầy đủ!');
//     }
//     return {
//       data: response.data.data, // Trả về object bên trong trường `data`
//       status: response.status,
//     };
//   } catch (error) {
//     const errorMessage =
//       error.response?.status === 401
//         ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!'
//         : error.response?.status === 403
//         ? 'Bạn không có quyền truy cập dữ liệu này!'
//         : error.message || 'Không thể tải dữ liệu doanh thu món ăn!';
//     console.error('Lỗi khi lấy dữ liệu doanh thu món ăn:', errorMessage);
//     throw new Error(errorMessage);
//   }
// };

// export const getCategoryRevenue = async (restaurantId, period, token) => {
//   const authApi = authApis(token);
//   try {
//     const response = await authApi.get(endpoints['category-revenue'](restaurantId), {
//       params: { period },
//       paramsSerializer: (params) => qs.stringify(params, { encode: false }),
//     });
//     return {
//       data: response.data,
//       status: response.status,
//     };
//   } catch (error) {
//     const errorMessage =
//       error.response?.status === 401
//         ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!'
//         : error.response?.status === 403
//         ? 'Bạn không có quyền truy cập dữ liệu này!'
//         : error.message || 'Không thể tải dữ liệu doanh thu danh mục!';
//     console.error('Lỗi khi lấy dữ liệu doanh thu danh mục:', errorMessage);
//     throw new Error(errorMessage);
//   }
// };

export const getCombinedRevenue = async (restaurantId, period, token) => {
  const authApi = authApis(token);
  try {
    const response = await authApi.get(endpoints["combined-revenue"](restaurantId), {
      params: { period },
    });
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thống kê tổng hợp:", error);
    throw error;
  }
};


const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
  });
  
  api.interceptors.request.use(
    (config) => {
      if (config.url && typeof config.url === "string") {
        if (config.url.includes("/o/token/") && config.method === "post") {
          config.headers["Content-Type"] = "application/x-www-form-urlencoded";
          if (config.data) {
            config.data = qs.stringify(config.data);
          }
        }
      } else {
        console.warn("Yêu cầu không có URL:", config);
      }
      console.log("Yêu cầu:", config.url, config.method, config.headers, config.data);
      return config;
    },
    (error) => {
      console.error("Lỗi yêu cầu:", error);
      return Promise.reject(error);
    }
  );
  
  api.interceptors.response.use(
    (response) => {
      console.log("Phản hồi:", response.status, response.data)
      return response
    },
    (error) => {
      const errorMessage =
        error.response?.data?.error ||
        (error.message.includes("timeout")
          ? "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại!"
          : "Lỗi không xác định")
      console.error("Lỗi phản hồi:", errorMessage, error.response?.data)
      return Promise.reject({ ...error, message: errorMessage })
    }
  )
  
  export const authApis = (token) => {
    if (!token || typeof token !== "string") {
      console.error("Token không hợp lệ:", token);
      throw new Error("Token không hợp lệ!");
    }
  
    const authApi = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });
  
    authApi.interceptors.request.use(
      (config) => {
        console.log("Yêu cầu auth:", config.url, config.method, config.headers, config.data);
        return config;
      },
      (error) => {
        console.error("Lỗi yêu cầu auth:", error);
        return Promise.reject(error);
      }
    );
  
    authApi.interceptors.response.use(
      (response) => {
        console.log("Phản hồi auth:", response.status, response.data);
        return response;
      },
      (error) => {
        console.error("Lỗi phản hồi auth:", error.message, error.response?.data);
        return Promise.reject(error);
      }
    );
  
    return authApi;
  };
  
  export default api;

