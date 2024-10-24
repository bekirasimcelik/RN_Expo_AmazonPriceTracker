import Octicons from '@expo/vector-icons/Octicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, Text, View } from 'react-native';

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

  const toggleIsTracked = async () => {
    if (!search?.id) {
      return;
    }
    await supabase
      .from('searches')
      .update({ is_tracked: !search?.is_tracked })
      .eq('id', search?.id)
      .select()
      .single();
  };

  if (!search) {
    return <ActivityIndicator />;
  }

  return (
    <View>
      <View className="m-2 flex-row items-center justify-between gap-2 rounded bg-white p-4 shadow-sm">
        <View>
          <Text className="text-xl font-semibold">{search.query}</Text>
          <Text>Scraped {dayjs(search.last_scraped_at).fromNow()}</Text>
          <Text>{search.status}</Text>
        </View>
        <Octicons
          onPress={toggleIsTracked}
          name={search.is_tracked ? 'bell-fill' : 'bell'}
          size={24}
          color="dimgray"
        />
      </View>

      <Button title="Start Scraping" onPress={startScraping} />

      <FlatList
        data={products}
        keyExtractor={(item) => item.asin}
        contentContainerClassName="gap-2 p-2"
        renderItem={({ item }) => (
          <Link href={`/product/${item.asin}`} asChild>
            <Pressable
              // onPress={() => Linking.openURL(item.url)}
              className="flex-row gap-2 bg-white p-3">
              <Image source={{ uri: item.image }} className="h-20 w-20" resizeMode="contain" />
              <Text className="flex-1" numberOfLines={4}>
                {item.name}
              </Text>
              <Text>$ {item.final_price}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
