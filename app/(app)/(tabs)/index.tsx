import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '~/contexts/AuthContext';
import { supabase } from '~/utils/supabase';

dayjs.extend(relativeTime);

export default function Home() {
  const [search, setSearch] = useState();
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
    console.warn('search: ', search);

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
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Search' }} />

      <View className="flex-row gap-3 p-3">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search for a product"
          className="flex-1 rounded border border-gray-300 bg-white p-3"
        />

        <Pressable onPress={PerformSearch} className="rounded bg-teal-500 p-3">
          <Text>Search</Text>
        </Pressable>
      </View>
      {/* <Link href="/(auth)/login">Open Auth Screen</Link> */}
      <FlatList
        data={history}
        onRefresh={fetchHistory}
        refreshing={false}
        contentContainerClassName="p-3 gap-2"
        renderItem={({ item }) => (
          <Link href={`/search/${item.id}`} asChild>
            <Pressable className="border-b border-gray-200 pb-2">
              <Text className="text-lg font-semibold">{item.query}</Text>
              <Text className="color-gray">{dayjs(item.created_at).fromNow()}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
