import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useEffect, useState } from "react";
import { Chip, Searchbar } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import Cart from "./Cart";

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [q, setQ] = useState("");
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [cateId, setCateId] = useState(null);
    const nav = useNavigation();

    const loadCates = async () => {
        try {
            let res = await Apis.get(endpoints['foods-category']);
            setCategories(res.data.results);
        } catch (ex) {
            console.error(ex);
        }
    };

    const loadFoods = async () => {
        if (page <= 0) return;

        const isFirstPage = page === 1;
        if (isFirstPage) setLoading(true);
        else setLoadingMore(true);

        try {
            let url = `${endpoints['foods']}?page=${page}`;
            if (q) {
              url = `${url}&food_category=${q}`;
            }

            if (cateId) {
                url = `${url}&category_id=${cateId}`;
            }
            console.info(url)

            let res = await Apis.get(url);
            if (isFirstPage) {
                setFoods(res.data.results);
            } else {
                setFoods(prev => [...prev, ...res.data.results]);
            }

            if (res.data.next === null) setPage(0);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadCates();
    }, []);

    useEffect(() => {
        loadFoods();
    }, [page]);

    useEffect(() => {
        setFoods([]);
        setPage(1); // Khi tìm kiếm hoặc lọc, về page 1
    }, [q, cateId]);

    return (
        <SafeAreaView style={[MyStyles.container, MyStyles.p]}>
            {/* Search */}
            <View style={[MyStyles.row, MyStyles.searchBox]}>
                <Searchbar
                    placeholder="Search for foods..."
                    onChangeText={text => setQ(text)}
                    value={q}
                    style={{ flex: 1 }}
                />
                <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => nav.navigate(Cart)}>
                    <Icon name="cart-outline" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Options */}
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

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={MyStyles.cate}>
                    <TouchableOpacity onPress={() => setCateId(null)}>
                        <Chip style={MyStyles.m} icon="label">All Result</Chip>
                    </TouchableOpacity>
                    {categories.map(c => (
                        <TouchableOpacity key={`Cate${c.id}`} onPress={() => setCateId(c.id)}>
                            <Chip style={MyStyles.m} icon="label">{c.name}</Chip>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Product list */}
            {loading ? <ActivityIndicator size="large" /> : (
                <FlatList
                    data={foods}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    renderItem={({ item }) => {
                        const defaultImage = "https://picsum.photos/400/200";
                        const imageUri = item.image || defaultImage;
                        const minPrice = item.prices?.length > 0
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
                    ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, fontSize: 16 }}>Không có sản phẩm nào.</Text>}
                    onEndReachedThreshold={0.2}
                    onEndReached={() => {
                        if (!loadingMore && page > 0) setPage(prev => prev + 1);
                    }}
                />
            )}
        </SafeAreaView>
    );
};

export default Home;
