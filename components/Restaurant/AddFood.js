import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';

const AddFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurants } = route.params || {};
  const [foodData, setFoodData] = useState({
    name: '',
    description: '',
    food_category: '',
  });

  const handleAddFood = async () => {
    if (!foodData.name || !foodData.food_category) {
      Alert.alert('Error', 'Name and Category are required!');
      return;
    }
    try {
      let token = await AsyncStorage.getItem('access_token');
      let res = await authApis(token).post(endpoints['foods'], {
        ...foodData,
        restaurant: restaurants[0]?.id, // Sử dụng restaurant_id đầu tiên
      });
      Alert.alert('Success', 'Food added successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add food!');
      console.error(error);
    }
  };

  return (
    <View style={MyStyles.container}>
      <Text style={MyStyles.title}>Add New Food</Text>
      <TextInput
        style={MyStyles.input}
        placeholder="Food Name"
        value={foodData.name}
        onChangeText={(text) => setFoodData({ ...foodData, name: text })}
      />
      <TextInput
        style={MyStyles.input}
        placeholder="Description"
        value={foodData.description}
        onChangeText={(text) => setFoodData({ ...foodData, description: text })}
      />
      <TextInput
        style={MyStyles.input}
        placeholder="Category ID"
        value={foodData.food_category}
        onChangeText={(text) => setFoodData({ ...foodData, food_category: text })}
      />
      <Button title="Add Food" onPress={handleAddFood} />
    </View>
  );
};

export default AddFood;