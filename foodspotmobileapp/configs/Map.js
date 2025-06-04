import axios from "axios";

const GOMAPS_API_KEY = 'AlzaSygbvzKU5_deWxyDIaFevjN2g1BG_W9VMJB';
// Hàm chuyển toạ độ sang địa chỉ
export const reverseGeocode = async (lat, lng) => {
  const url = "https://maps.gomaps.pro/maps/api/geocode/json";
  const params = {
    latlng: `${lat},${lng}`,
    language: "vi",
    key: GOMAPS_API_KEY,
  };

  const res = await axios.get(url, { params });
  if (res.data.status !== "OK" || res.data.results.length === 0)
    throw new Error("Không tìm thấy địa chỉ!");
  return res.data.results[0].formatted_address;
};

export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get("https://maps.gomaps.pro/maps/api/geocode/json", {
      params: {
        address,
        key: GOMAPS_API_KEY,
        language: "vi",
        region: "VN",
      },
    });

    const results = response.data.results;
    if (results.length === 0) {
      console.warn("Không tìm thấy tọa độ cho địa chỉ này.");
      return null;
    }

    const { lat, lng } = results[0].geometry.location;
    const formatted_address = results[0].formatted_address;

    return {
      latitude: lat,
      longitude: lng,
      formatted_address,
    };
  } catch (error) {
    console.error("Lỗi khi gọi GoMaps Geocoding API:", error.message);
    return null;
  }
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

const MAPBOX_TOKEN = "pk.eyJ1IjoidHJhbnF1YW5ndHJ1b25nMjUiLCJhIjoiY21iZG9oeXZtMTRnMzJsb3ByNThsOTNrMSJ9.4XSsLeWF_fv5EgQNh1N9gQ";

export const fetchMapboxSuggestions = async (text, limit = 5, autocomplete = true) => {
  if (text.length < 3) return [];

  try {
    const res = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json`,
      {
        params: {
          access_token: MAPBOX_TOKEN,
          autocomplete,
          limit,
          language: "vi",
          bbox: "102.14441,8.17966,109.4642,23.3934", // Giới hạn khu vực Việt Nam
        },
      }
    );

    // Xử lý xóa mã bưu điện khỏi place_name
    const cleanedFeatures = res.data.features.map(feature => ({
      ...feature,
      place_name: feature.place_name.replace(/,\s?\d{5}/g, ''), // Xóa số có 5 chữ số sau dấu phẩy
    }));

    return cleanedFeatures;
  } catch (err) {
    console.warn("Lỗi gợi ý địa chỉ:", err);
    return [];
  }
};


export const fetchMapboxPlace = async (text) => {
  if (!text.trim()) return null;

  try {
    const res = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json`,
      {
        params: {
          access_token: MAPBOX_TOKEN,
          autocomplete: false,
          limit: 1,
          language: "vi",
        },
      }
    );
    return res.data.features.length > 0 ? res.data.features[0] : null;
  } catch (err) {
    console.warn("Lỗi lấy địa điểm:", err);
    return null;
  }
};