import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '~/context/AuthContext';

dayjs.extend(relativeTime);

import { supabase } from '~/utils/supabase';

export default function Home() {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const { user } = useAuth();

  const fetchHistory = () => {
    supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setHistory(data));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const PerformSearch = async () => {
    // Save this search in database
    const { data, error } = await supabase
      .from('searches')
      .insert({
        query: search,
        user_id: user.id,
      })
      .select()
      .single();
    if (data) {
      router.push(`/search/${data.id}`);
    }

    // scrape amazon from this query
  };
  return (
    <View className='bg-white flex-1'>
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

      <FlatList
        data={history}
        contentContainerClassName="p-3 gap-2"
        onRefresh={fetchHistory()}
        refreshing={false}
        renderItem={({ item }) => (
          <View className='border-b pb-2 border-gray-300 bg-white'>
            <Text className='font-semibold text-lg'>{item.query}</Text>
            <Text className='color-gray'>{dayjs(item.created_at).fromNow()}</Text>
          </View>
        )}
      />
    </View>
  );
}
