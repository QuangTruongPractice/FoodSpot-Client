import { Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { checkToken, loadOrder } from "../../configs/Data";
import styles from "../../styles/OrderStyles";

const TABS = ["Delivered", "Accepted", "Pending", "Fail"];

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Delivered");
  const nav = useNavigation();

  const loadOrders = async () => {
    if (page <= 0) return;
    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);

    const token = await checkToken(nav);
    if (!token) return;

    try {
      const res = await loadOrder(token, { page });
      const newOrders = isFirstPage ? res.results : [...orders, ...res.results];
      setOrders(newOrders);
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

  useEffect(() => {
    filterOrdersByTab();
  }, [orders, activeTab]);

  const filterOrdersByTab = () => {
    let filtered = [];
    switch (activeTab) {
      case "Delivered":
        filtered = orders.filter((o) => o.status === "DELIVERED");
        break;
      case "Accepted":
        filtered = orders.filter((o) => o.status === "ACCEPTED");
        break;
      case "Pending":
        filtered = orders.filter(
          (o) =>
            o.status === "PENDING" &&
            (
              o.payment_method === "COD" ||
              (o.payment_method === "MOMO" && o.payment_status === "SUCCESS")
            )
        );
        break;
      case "Fail":
        filtered = orders.filter(
          (o) => o.payment_method === "MOMO" && o.payment_status === "FAIL"
        );
        break;
      default:
        filtered = orders;
    }
    setFilteredOrders(filtered);
  };

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
      <Text>Phương thức thanh toán: {item.payment_method}</Text>
      <Text>Trạng thái thanh toán: {item.payment_status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              padding: 8,
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: "#007bff"
            }}
          >
            <Text style={{ fontWeight: activeTab === tab ? "bold" : "normal" }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredOrders}
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
