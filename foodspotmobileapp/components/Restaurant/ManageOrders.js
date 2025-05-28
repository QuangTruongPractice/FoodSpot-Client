import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';

const ManageOrders = ({ route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurants } = route.params || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user || !user.id || !restaurants || restaurants.length === 0) {
        Alert.alert('Error', 'User or restaurant data not available!');
        return;
      }
      try {
        let token = await AsyncStorage.getItem('access_token');
        let res = await authApis(token).get(endpoints['orders'], {
          params: { restaurant_id: restaurants[0].id },
        });
        setOrders(res.data.results || res.data);
      } catch (error) {
        console.error('Error loading orders:', error);
        Alert.alert('Error', 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user, restaurants]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      let token = await AsyncStorage.getItem('access_token');
      let res = await authApis(token).patch(endpoints['orders-info'](orderId), { status });
      setOrders(
        orders.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      Alert.alert('Success', `Order updated to ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status!');
      console.error(error);
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderItem}>
      <Text>Order ID: {item.id}</Text>
      <Text>Restaurant: {item.restaurant_name}</Text>
      <Text>Status: {item.status}</Text>
      <Button
        title="Accept"
        onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
        disabled={item.status !== 'PENDING'}
      />
      <Button
        title="Deliver"
        onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
        disabled={item.status !== 'ACCEPTED'}
      />
      <Button
        title="Cancel"
        onPress={() => handleUpdateStatus(item.id, 'CANCEL')}
        color="red"
        disabled={item.status === 'DELIVERED' || item.status === 'CANCEL'}
      />
    </View>
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={MyStyles.container}>
      <Text style={MyStyles.title}>Manage Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  orderItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
});

export default ManageOrders;