import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';

// import dummyProducts from '~/assets/search.json';
import { Tables } from '~/types/supabase';
import { supabase } from '~/utils/supabase';

dayjs.extend(relativeTime);

// const products = dummyProducts.slice(0, 20);

export default function SearchResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState<Tables<'searches'> | null>(null);
  const [products, setProducts] = useState<Tables<'products'>[]>([]);

  useEffect(() => {
    fetchSearch();
    fetchProducts();
  }, [id]);

  const fetchSearch = () => {
    supabase
      .from('searches')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setSearch(data));
  };

  const fetchProducts = () => {
    supabase
      .from('product_search')
      .select('*, products(*)')
      .eq('search_id', id)
      .then(({ data, error }) => {
        setProducts(data?.map((d) => d.products).filter((p) => !!p) as Tables<'products'>[]);
      });
  };

  useEffect(() => {
    // Listen to inserts
    const subscription = supabase
      .channel('supabase_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'searches' },
        (payload) => {
          if (payload.new?.id === parseInt(id, 10)) {
            setSearch(payload.new);
            fetchProducts();
          }
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const startScraping = async () => {
    const { data, error } = await supabase.functions.invoke('scrape-start', {
      body: JSON.stringify({ record: search }),
    });
    console.log(data, error);
  };

  if (!search) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      <View className="m-2 gap-2 rounded bg-white p-2 shadow-sm">
        <Text className="text-xl font-semibold">{search.query}</Text>
        <Text>{dayjs(search.created_at).fromNow()}</Text>
        <Text>{search.status}</Text>
        <Button title="Start Scraping" onPress={startScraping} />
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.asin}
        contentContainerClassName="gap-2 p-2"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => Linking.openURL(item.url)}
            className="flex-row gap-2 bg-white p-3">
            <Image source={{ uri: item.image }} className="h-20 w-20" resizeMode="contain" />
            <Text className="flex-1" numberOfLines={4}>
              {item.name}
            </Text>
            <Text>$ {item.final_price}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
