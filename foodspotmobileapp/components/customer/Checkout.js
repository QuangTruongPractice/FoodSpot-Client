import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApis,endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { reverseGeocode, calculateDistance } from '../../configs/Map';
import { loadRestaurantDetails } from '../../configs/Data';
import styles from "../../styles/CheckoutStyles";

const Checkout = ({ navigation, route }) => {
  const [cartData, setCartData] = useState(() => route.params?.cart || []);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [displayAddress, setDisplayAddress] = useState(''); // Địa chỉ sau reverse
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const nav = useNavigation();

  useEffect(() => {
    const addr = route.params?.address;
    if (addr) {
      setSelectedAddress(addr);
      fetchFormattedAddress(addr.latitude, addr.longitude);
      updateShippingFees(addr);
    }
  }, [route.params?.address]);

  const total = cartData.reduce((sum, store) =>
    sum + store.total_price + (store.shipping_fee || 0), 0
  );

  const fetchFormattedAddress = async (lat, lng) => {
    try {
      const address = await reverseGeocode(lat, lng);
      setDisplayAddress(address);
    } catch (err) {
      console.error(err);
      setDisplayAddress("Không xác định");
    }
  };

  const updateShippingFees = async (addr) => {
    if (!addr) return;
  
    const updatedCart = await Promise.all(cartData.map(async (store) => {
      const res = await loadRestaurantDetails(store.restaurant);

      const distanceData = await calculateDistance(
        addr.latitude,
        addr.longitude,
        res.address.latitude,
        res.address.longitude
      );

      let shippingFee = 0;
  
      if (distanceData) {
        const distanceInKm = (distanceData.distance / 1000).toFixed(1);
        if (distanceInKm >= 1) {
          shippingFee = Math.round(distanceInKm * res.shipping_fee_per_km);
        }
        return {
          ...store,
          shipping_fee: shippingFee,
          distance_km: distanceInKm
        };
      } else {
        return {
          ...store,
          shipping_fee: 0,
          distance_km: 'Không xác định'
        };
      }
    }));
  
    setCartData(updatedCart);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    try {
      const token = await checkToken(nav);
      for (const store of cartData) {
        const orderData = {
          sub_cart_id: store.id,
          payment_method: paymentMethod,
          ship_fee: store.shipping_fee,
          total_price: store.total_price + store.shipping_fee,
          ship_address_id: selectedAddress.id || 'Không xác định'
        };
        //Tạo order
        const checkoutRes = await authApis(token).post(endpoints["checkout"], orderData);
        const orderId = checkoutRes.data?.order_id;
        if (paymentMethod === "COD") {
          Alert.alert('Đặt hàng thành công', `Phương thức: ${paymentMethod}`);
        }
        if (paymentMethod === "MOMO") {
          const res = await authApis(token).post(endpoints["momo-payment"], {
            amount: total,
            order_id: orderId
          });
          const momoRes = res.data;
          if (momoRes && momoRes.payUrl) {
            // Mở trang thanh toán MOMO (hoặc WebView)
            Linking.openURL(momoRes.payUrl);
          } else {
            Alert.alert("Lỗi thanh toán MOMO", "Không nhận được URL thanh toán");
          }
        }
      }
      nav.navigate("Cart"); // hoặc reset giỏ hàng, đưa về trang chính
  
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại sau.");
    }
  };

  const formatCurrency = (num) => {
    return `${num.toLocaleString('vi-VN')}đ`;
  };

  const renderCartItem = (item) => (
    <View style={styles.itemContainer}>
      <Text style={styles.storeName}>{item.restaurant_name}</Text>
      {item.sub_cart_items.map((product, index) => (
        <View key={index} style={styles.productRow}>
          <Text numberOfLines={1} style={{ flex: 1 }}>{product.food.name}</Text>
          <Text style={styles.productQuantity}>x{product.quantity}</Text>
          <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        </View>
      ))}
      <View style={styles.productRow}>
        <Text numberOfLines={1} style={{ flex: 1 }}>
          Phí vận chuyển ({item.distance_km ?? '---'} km)
        </Text>
        <Text style={styles.productPrice}>{formatCurrency(item.shipping_fee || 0)}</Text>
      </View>
    </View>
  );

  
  return (
    <ScrollView style={styles.container}>
      {/* Địa chỉ */}
      <TouchableOpacity
        style={styles.addressBox}
        onPress={() => navigation.navigate('Address', { 
          selectMode: true,
          cart: cartData 
        })}
      >
        <Ionicons name="location-outline" size={20} />
        {selectedAddress ? (
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text>{selectedAddress.name} ({selectedAddress.phone})</Text>
            <Text numberOfLines={2} style={{ color: '#444' }}>
              {displayAddress || 'Đang lấy địa chỉ...'}
            </Text>
          </View>
        ) : (
          <Text style={{ marginLeft: 10, color: '#888' }}>Chọn địa chỉ giao hàng</Text>
        )}
        <Ionicons name="chevron-forward-outline" size={20} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* Giỏ hàng */}
      <FlatList
        data={cartData}
        renderItem={({ item }) => renderCartItem(item)}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={false}
      />

      {/* Phương thức thanh toán */}
      <View style={styles.paymentBox}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        {['COD', 'MOMO'].map((method) => (
          <TouchableOpacity
            key={method}
            style={styles.radioOption}
            onPress={() => setPaymentMethod(method)}
          >
            <Ionicons
              name={paymentMethod === method ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#f33"
            />
            <Text style={{ marginLeft: 10 }}>
              {method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Ví MOMO'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tổng và đặt hàng */}
      <View style={styles.footer}>
        <Text style={styles.totalText}>Tổng: {formatCurrency(total)}</Text>
        <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
          <Text style={styles.orderButtonText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Checkout;