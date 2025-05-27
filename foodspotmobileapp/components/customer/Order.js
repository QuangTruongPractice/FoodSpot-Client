import { Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { checkToken, loadOrder } from "../../configs/Data";
import styles from "../../styles/OrderStyles";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const nav = useNavigation();

  const loadOrders = async () => {
    if (page <= 0) return;

    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = await checkToken();
      const res = await loadOrder(token, { page });

      if (isFirstPage) {
        setOrders(res.results);
      } else {
        setOrders((prev) => [...prev, ...res.results]);
      }

      if (res.next === null) setPage(0);
    } catch (ex) {
      console.error(ex);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => nav.navigate("OrderInfo", { orderId: item.id })}
      style={styles.card}
    >
      <Text style={styles.cardTitle}>
        Nhà hàng: {item.restaurant_name} #{item.id}
      </Text>
      <Text>Ngày đặt: {item.ordered_date}</Text>
      <Text>Phí ship: {item.shipping_fee.toLocaleString()} VND</Text>
      <Text>Tổng tiền: {item.total.toLocaleString()} VND</Text>
      <Text>Trạng thái: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={() => {
            if (!loadingMore && page > 0) setPage(page + 1);
          }}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Không có đơn hàng nào.</Text>
          )}
          ListFooterComponent={loadingMore ? <ActivityIndicator size={30} /> : null}
        />
      )}
    </View>
  );
};

export default Order;
