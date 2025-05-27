import axios from "axios";

// Hàm chuyển toạ độ sang địa chỉ
export const reverseGeocode = async (lat, lng) => {
  const url = "https://maps.gomaps.pro/maps/api/geocode/json";
  const params = {
    latlng: `${lat},${lng}`,
    language: "vi",
    key: "AlzaSygbvzKU5_deWxyDIaFevjN2g1BG_W9VMJB",
  };

  const res = await axios.get(url, { params });
  if (res.data.status !== "OK" || res.data.results.length === 0)
    throw new Error("Không tìm thấy địa chỉ!");
  return res.data.results[0].formatted_address;
};

export const calculateDistance = async (userLat, userLng, restaurantLat, restaurantLng) => {
  try {
    const res = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${userLng},${userLat}?overview=false`
    );

    if (res.data.code === "Ok") {
      const route = res.data.routes[0];
      return {
        distance: route.distance,  // đơn vị: mét
        duration: route.duration   // đơn vị: giây
      };
    } else {
      console.warn("Không thể tính khoảng cách");
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi tính khoảng cách:", err);
    return null;
  }
};