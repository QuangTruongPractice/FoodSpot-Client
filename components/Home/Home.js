import { FlatList, Text, TouchableOpacity, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useEffect, useState } from "react";
import { Chip } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import { Image } from "expo-image";

const Home = () => {
  const [categories, setCategories] = useState([]); // Mảng rỗng mặc định
  const [foods, setFoods] = useState([]); // Mảng rỗng mặc định
  const [bannerImage, setBannerImage] = useState(null); // Ảnh banner từ API
  const [loading, setLoading] = useState(false);
  const [cateId, setCateId] = useState(null);
  const [error, setError] = useState(null); // Lưu lỗi API

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      let res = await Apis.get(endpoints["foods-category_list"]);
      console.log("Dữ liệu danh mục:", res.data); // Log để debug
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (ex) {
      console.error("Lỗi tải danh mục:", ex.response?.data || ex.message);
      setError("Không thể tải danh mục. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = endpoints["foods_list"];
      if (cateId) {
        url = `${url}?food_category=${cateId}`;
      }
      let res = await Apis.get(url);
      console.log("Dữ liệu món ăn:", res.data); // Log để debug
      const foodData = Array.isArray(res.data) ? res.data : [];
      setFoods(foodData);
      // Lấy ảnh của món ăn đầu tiên làm banner (nếu có)
      setBannerImage(foodData.length > 0 && foodData[0].image ? foodData[0].image : null);
    } catch (ex) {
      console.error("Lỗi tải món ăn:", ex.response?.data || ex.message);
      setError("Không thể tải món ăn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadFoods();
  }, [cateId]);

  const filterByCategory = (id) => {
    setCateId(id);
    setFoods([]); // Reset foods khi đổi danh mục
    setBannerImage(null); // Reset banner
    setError(null);
  };

  const renderFoodItem = ({ item }) => (
    <View style={MyStyles.productCard}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={MyStyles.productImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={MyStyles.productImage}>
          <Text style={MyStyles.placeholderText}>Không có ảnh</Text>
        </View>
      )}
      <Text style={MyStyles.productTitle}>{item.name || "Không có tên"}</Text>
      <Text style={MyStyles.productBrand}>
        {item.restaurant || "Không có nhà hàng"}
      </Text>
      <Text style={MyStyles.productPrice}>
        {item.prices && Array.isArray(item.prices) && item.prices.length > 0
          ? `${item.prices[0].price.toLocaleString("vi-VN")} VNĐ`
          : "Giá không có"}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* Banner */}
      <View style={MyStyles.bannerContainer}>
        {bannerImage ? (
          <Image
            source={{ uri: bannerImage }}
            style={MyStyles.bannerImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={MyStyles.bannerImage}>
            <Text style={MyStyles.placeholderText}>Không có ảnh banner</Text>
          </View>
        )}
        <Text style={MyStyles.bannerText}>Khám phá món ăn ngon</Text>
      </View>

      {/* Categories */}
      <View style={[MyStyles.row, MyStyles.wrap, MyStyles.margin]}>
        <TouchableOpacity onPress={() => filterByCategory(null)}>
          <Chip style={MyStyles.chip} icon="label">
            Tất cả
          </Chip>
        </TouchableOpacity>
        {categories.length > 0 ? (
          categories.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => filterByCategory(c.id)}>
              <Chip style={MyStyles.chip} icon="label">
                {c.name || "Không có tên"}
              </Chip>
            </TouchableOpacity>
          ))
        ) : (
          <Text>Không có danh mục</Text>
        )}
      </View>

      {/* Foods Title */}
      <Text style={[MyStyles.title, MyStyles.margin]}>Món ăn</Text>

      {/* Error Message */}
      {error && (
        <Text style={[MyStyles.errorText, MyStyles.margin]}>{error}</Text>
      )}
    </>
  );

  return (
    <FlatList
      style={MyStyles.container}
      data={foods}
      renderItem={renderFoodItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      columnWrapperStyle={MyStyles.row}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={<Text>Không có món ăn</Text>}
      ListFooterComponent={loading ? <Text>Loading...</Text> : null}
    />
  );
};

export default Home;