import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';

const ManageMenus = ({ route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurants } = route.params || {};
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    time_serve: '',
  });

  useEffect(() => {
    const loadMenus = async () => {
      if (!user || !restaurants || restaurants.length === 0) {
        Alert.alert('Error', 'No restaurant associated with user!');
        return;
      }
      try {
        let token = await AsyncStorage.getItem('access_token');
        let res = await authApis(token).get(endpoints['menus'], {
          params: { restaurant_id: restaurants[0].id },
        });
        setMenus(res.data);
      } catch (error) {
        console.error('Error loading menus:', error);
        Alert.alert('Error', 'Failed to load menus.');
      } finally {
        setLoading(false);
      }
    };
    loadMenus();
  }, [user, restaurants]);

  const handleAddMenu = async () => {
    if (!newMenu.name || !newMenu.time_serve) {
      Alert.alert('Error', 'Name and Time Serve are required!');
      return;
    }
    try {
      let token = await AsyncStorage.getItem('access_token');
      let res = await authApis(token).post(endpoints['menus'], {
        ...newMenu,
        restaurant: restaurants[0].id,
      });
      setMenus([...menus, res.data]);
      setNewMenu({ name: '', description: '', time_serve: '' });
      Alert.alert('Success', 'Menu added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add menu!');
      console.error(error);
    }
  };

  const handleUpdateMenu = async (menuId, updatedMenu) => {
    try {
      let token = await AsyncStorage.getItem('access_token');
      let res = await authApis(token).patch(endpoints['menus-details'](menuId), updatedMenu);
      setMenus(menus.map((menu) => (menu.id === menuId ? res.data : menu)));
      Alert.alert('Success', 'Menu updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update menu!');
      console.error(error);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    try {
      let token = await AsyncStorage.getItem('access_token');
      await authApis(token).delete(endpoints['menus-details'](menuId));
      setMenus(menus.filter((menu) => menu.id !== menuId));
      Alert.alert('Success', 'Menu deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete menu!');
      console.error(error);
    }
  };

  const renderMenu = ({ item }) => (
    <View style={styles.menuItem}>
      <Text>Name: {item.name}</Text>
      <Text>Description: {item.description}</Text>
      <Text>Time Serve: {item.time_serve}</Text>
      <Button
        title="Update"
        onPress={() =>
          handleUpdateMenu(item.id, {
            name: item.name + ' Updated',
            description: item.description,
            time_serve: item.time_serve,
          })
        }
      />
      <Button title="Delete" onPress={() => handleDeleteMenu(item.id)} color="red" />
    </View>
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={MyStyles.container}>
      <Text style={MyStyles.title}>Manage Menus</Text>
      <TextInput
        style={MyStyles.input}
        placeholder="Menu Name"
        value={newMenu.name}
        onChangeText={(text) => setNewMenu({ ...newMenu, name: text })}
      />
      <TextInput
        style={MyStyles.input}
        placeholder="Description"
        value={newMenu.description}
        onChangeText={(text) => setNewMenu({ ...newMenu, description: text })}
      />
      <TextInput
        style={MyStyles.input}
        placeholder="Time Serve (MORNING/NOON/EVENING/NIGHT)"
        value={newMenu.time_serve}
        onChangeText={(text) => setNewMenu({ ...newMenu, time_serve: text })}
      />
      <Button title="Add Menu" onPress={handleAddMenu} />
      <FlatList
        data={menus}
        renderItem={renderMenu}
        keyExtractor={(item) => item.id.toString()}
        style={{ marginTop: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
});

export default ManageMenus;