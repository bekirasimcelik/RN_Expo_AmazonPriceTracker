import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function Home() {
  const [search, setSearch] = useState('');

  const PerformSearch = () => {
    console.warn('Search', search);

    // Save this search in database

    // scrape amazon from this query

    router.push('/search');
  };
  return (
    <>
      <Stack.Screen options={{ title: 'Search' }} />
      <View className="flex-row gap-3 p-3">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search for a product"
          className="b flex-1 rounded border border-gray-300 bg-white p-3"
        />
        <Pressable onPress={PerformSearch} className="rounded bg-teal-500 p-3">
          <Text>Search</Text>
        </Pressable>
      </View>
    </>
  );
}
