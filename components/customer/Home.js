import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View, ScrollView, StyleSheet } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useEffect, useState } from "react";
import { Chip, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import Cart from "./Cart";
import RNPickerSelect from 'react-native-picker-select';
import Swiper from 'react-native-swiper';
import { getCurrentTimeServe, loadFoodCategory, loadFood } from "../../configs/Data";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [cateId, setCateId] = useState(null);
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const nav = useNavigation();
  const [selectedRange, setSelectedRange] = useState(null);
  const [currentTimeServe, setCurrentTimeServe] = useState(getCurrentTimeServe());

  const handleRangeChange = (value) => {
    setSelectedRange(value);
    switch (value) {
      case "1":
        quickFilter(0, 50000);
        break;
      case "2":
        quickFilter(50000, 100000);
        break;
      case "3":
        quickFilter(100000, 200000);
        break;
      case "4":
        quickFilter(200000, 1000000);
        break;
      default:
        quickFilter();
    }
  };

  const priceRangeOptions = [
    { label: "Dưới 50.000₫", value: "1" },
    { label: "50.000₫ - 100.000₫", value: "2" },
    { label: "100.000₫ - 200.000₫", value: "3" },
    { label: "Trên 200.000₫", value: "4" },
  ];

  const foodBanners = [
    { uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&h=200&q=80" },
    { uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=200&q=80" },
    { uri: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=400&h=200&q=80" },
  ];

  const loadCates = async () => {
    try {
      let res = await loadFoodCategory();
      setCategories(res.results || []); // Gán mảng rỗng nếu res.results là undefined
    } catch (ex) {
      console.error('Error loading categories:', ex);
      setCategories([]); // Gán mảng rỗng nếu có lỗi
    }
  };

  const loadFoods = async () => {
    if (page <= 0) {
      return;
    } else {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await loadFood({ page, q, cateId, priceMin, priceMax });
        const availableFoods = res.results.filter(r => r.is_available === true);
        if (isFirstPage) {
          setFoods(availableFoods);
        } else {
          setFoods([...foods, ...availableFoods]);
        }
        if (res.next === null) {
          setPage(0);
        } // Ngăn load thêm khi hết dữ liệu
      } catch (ex) {
        console.error(ex);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    loadCates();
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => {
      loadFoods();
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [q, cateId, priceMax]);

  useEffect(() => {
    let timer = setTimeout(() => {
      loadFoods();
    }, 800);

    return () => clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    const intervalId = setInterval(() => {
        setCurrentTimeServe(getCurrentTimeServe());
    }, 300 * 1000);

    return () => clearInterval(intervalId); // Clear interval khi rời trang
  }, []);

  const quickFilter = async (valueMin, valueMax) => {
    setPage(1);
    setFoods([]);
    setPriceMin(valueMin);
    setPriceMax(valueMax);
  };

  const search = (value, callback) => {
    setPage(1);
    setFoods([]);
    callback(value);
  };

  const pickerSelectStyles = StyleSheet.create({
    inputAndroid: {
      height: 40,
      borderWidth: 1,
      borderColor: '#666',
      borderRadius: 6,
      paddingHorizontal: 10,
      marginTop: 8,
      backgroundColor: '#fff',
      color: '#000',
    },
    placeholder: {
      color: '#999',
    },
  });

  const renderHeader = () => (
    <View>
      {/* Options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 60 }}>
        <View style={[MyStyles.row, { justifyContent: "space-around" }]}>
          {/* Các nút option */}
          <TouchableOpacity style={MyStyles.optionButton}
          onPress={() => nav.navigate("UserFavorite")}>
            <Icon name="heart-outline" size={20} />
            <Text style={MyStyles.optionText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity style={MyStyles.optionButton}
            onPress={() => nav.navigate("UserFollow")}>
            <Icon name="account-multiple-outline" size={20} />
            <Text style={MyStyles.optionText}>Following</Text>
          </TouchableOpacity>

          <TouchableOpacity style={MyStyles.optionButton}
            onPress={() => nav.navigate("Order")}>
          <Icon name="cart-outline" size={20} />
          <Text style={MyStyles.optionText}>Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={MyStyles.optionButton}
            onPress={() => nav.navigate("Address")}>
            <Icon name="map-marker-outline" size={20} /> 
            <Text style={MyStyles.optionText}>Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
  
      Banner
      <View style={MyStyles.banner}>
        <Swiper autoplay autoplayTimeout={5} showsPagination dotColor="#ccc" activeDotColor="#ff6347" loop>
          {foodBanners.map((item, index) => (
            <Image key={index} source={{ uri: item.uri }} style={MyStyles.bannerImage} resizeMode="cover" />
          ))}
        </Swiper>
      </View>
  
      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={MyStyles.cate}>
          <TouchableOpacity onPress={() => search(null, setCateId)}>
            <Chip style={MyStyles.m} icon="label">All Result</Chip>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity key={`Cate${c.id}`} onPress={() => search(c.id, setCateId)}>
              <Chip style={MyStyles.m} icon="label">{c.name}</Chip>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
  

  return (
    <SafeAreaView style={[MyStyles.container, MyStyles.p]}>
      {/* Search */}
      <View style={[MyStyles.row, MyStyles.searchBox]}>
        <Searchbar
          placeholder="Search for foods..."
          onChangeText={(t) => search(t, setQ)}
          value={q}
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => nav.navigate(Cart)}>
          <Icon name="cart-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>
  
      {/* Dropdown */}
      <View>
        <RNPickerSelect
          onValueChange={handleRangeChange}
          placeholder={{ label: "Chọn khoảng giá", value: null }}
          items={priceRangeOptions}
          value={selectedRange}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={foods.filter(item => {
            const currentPriceObj = item.prices.find(p => p.time_serve === currentTimeServe);
            const currentPrice = currentPriceObj ? currentPriceObj.price : 0;
            return currentPrice > 0;
          })}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => {
            const defaultImage = "https://picsum.photos/400/200";
            const imageUri = item.image || defaultImage;
            const currentPriceObj = item.prices.find(p => p.time_serve === currentTimeServe);
            const currentPrice = currentPriceObj ? currentPriceObj.price : 0;
            return (
              <View style={MyStyles.productCardGrid}>
                <TouchableOpacity onPress={() => nav.navigate('Food', { foodId: item.id })}>
                  <Image source={{ uri: imageUri }} style={MyStyles.productImage} />
                  <Text style={MyStyles.productName}>{item.name}</Text>
                  <Text style={MyStyles.productBrand}>Nhà hàng: {item.restaurant_name}</Text>
                  <Text style={MyStyles.productPrice}>{currentPrice.toLocaleString("vi-VN")}₫</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
          ListEmptyComponent={() => (
            <Text style={MyStyles.productEmpty}>Hiện tại không có sản phẩm nào.</Text>
          )}
          onEndReachedThreshold={0.2}
          onEndReached={() => {
            if (!loadingMore && page > 0) setPage(page + 1);
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default Home;