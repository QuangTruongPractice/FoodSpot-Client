import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useEffect, useState } from "react";
import { Chip, Searchbar } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [q, setQ] = useState();
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [cateId, setCateId] = useState(null);
    const nav = useNavigation();

    const loadCates = async () => {
        let res = await Apis.get(endpoints['foods-category'])
        setCategories(res.data.results);
    }
    const loadFoods = async () => {
        if (page > 0) {
            try {
                setLoading(true);

                let url = `${endpoints['foods']}?page=${page}`;

                if (q) {
                    url = `${url}&food_category=${q}`;
                }

                if (cateId) {
                    url = `${url}&category_id=${cateId}`;
                }

                let res = await Apis.get(url);
                setFoods([...foods, ...res.data.results]);

                if (res.data.next === null)
                    setPage(0);
            } catch {
                // ...
            } finally {
                setLoading(false)
            }
       }
    }
    useEffect(() => {
        loadCates();
    }, []);

    useEffect(() => {
        let timer = setTimeout(() => {
            loadFoods();
        }, 500);

        return () => clearTimeout(timer);
    }, [q, page, cateId]);


    return (
        <SafeAreaView style={[MyStyles.container, MyStyles.p]}>
          {/* Tìm kiếm */}
          <View style={[MyStyles.row, MyStyles.searchBox]}>
            <Searchbar
              placeholder="Search for foods..."
              onChangeText={text => setQ(text)}
              value={q}
              style={{ flex: 1 }}
            />
          </View>
    
          {/* Các nút tùy chọn */}
          <View style={[MyStyles.row, { justifyContent: "space-around", marginVertical: 12 }]}>
            <TouchableOpacity style={MyStyles.optionButton}>
              <Icon name="heart-outline" size={20} />
              <Text style={MyStyles.optionText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={MyStyles.optionButton}>
              <Icon name="history" size={20} />
              <Text style={MyStyles.optionText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={MyStyles.optionButton}>
              <Icon name="account-multiple-outline" size={20} />
              <Text style={MyStyles.optionText}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity style={MyStyles.optionButton}>
              <Icon name="cog-outline" size={20} />
              <Text style={MyStyles.optionText}>Settings</Text>
            </TouchableOpacity>
          </View>
    
          {/* Banner */}
          <View style={MyStyles.banner}>
            <Image source={{ uri: 'https://picsum.photos/400/200' }} style={MyStyles.bannerImage} />
          </View>
    
          {/* Danh mục */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={MyStyles.row}>
                <Chip icon="label" style={MyStyles.m}>All Results</Chip>
                {categories.map(c => (
                <Chip key={c.id} icon="label" style={MyStyles.m}>{c.name}</Chip>
                ))}
            </View>
          </ScrollView>
    
          {/* Danh sách sản phẩm */}
          {loading ? <ActivityIndicator /> : (
            <FlatList
            data={foods}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2} // <-- THÊM DÒNG NÀY
            columnWrapperStyle={{ justifyContent: 'space-between' }} // căn chỉnh 2 cột
            renderItem={({ item }) => {
              const defaultImage = "https://via.placeholder.com/400x300.png?text=No+Image";
              const imageUri = item.image ? item.image : defaultImage;
              const minPrice = item.prices && item.prices.length > 0
                ? Math.min(...item.prices.map(p => p.price))
                : 0;
          
              return (
                <View style={MyStyles.productCardGrid}>
                  <Image source={{ uri: imageUri }} style={MyStyles.productImage} />
                  <Text style={MyStyles.productName}>{item.name}</Text>
                  <Text style={MyStyles.productBrand}>Nhà hàng: {item.restaurant_name}</Text>
                  <Text style={MyStyles.productPrice}>{minPrice.toLocaleString("vi-VN")}₫</Text>
                </View>
              );
            }}
          />
          )}
        </SafeAreaView>
      );
}
export default Home;