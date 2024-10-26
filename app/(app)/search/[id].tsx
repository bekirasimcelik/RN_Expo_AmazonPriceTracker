import Octicons from '@expo/vector-icons/Octicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Tables } from '~/types/supabase';
import * as Notifications from 'expo-notifications';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, Text, View } from 'react-native';

import { registerForPushNotificationsAsync, sendPushNotification } from '~/utils/notifications';
import { supabase } from '~/utils/supabase';

dayjs.extend(relativeTime);

export default function SearchResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState<Tables<'searches'> | null>(null);
  const [products, setProducts] = useState<Tables<'products'>[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

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
    const { data } = await supabase
      .from('searches')
      .update({ is_tracked: !search?.is_tracked })
      .eq('id', search?.id)
      .select()
      .single();
    setSearch(data);
  };

  const getProductLastPrices = async (product) => {
    const { data, error } = await supabase
      .from('product_snapshot')
      .select('*')
      .eq('asin', product.asin)
      .order('created_at', { ascending: false })
      .limit(2);
    console.log(error);
    return {
      ...product,
      snapshots: data,
    };
  };

  const priceDrops = async () => {
    const { data: productSearch, error: productSearchError } = await supabase
      .from('product_search')
      .select('*, products(*)')
      .eq('search_id', id);

    if (!productSearch) {
      return;
    }
    const products = await Promise.all(
      productSearch.map((ps) => getProductLastPrices(ps.products))
    );

    const priceDrops = products.filter(
      (product) =>
        product.snapshots.length === 2 &&
        product.snapshots[0].final_price < product.snapshots[1].final_price
    );

    const message = `
      There are ${priceDrops.length} price drops in your search!
    `;

    // Gönderilecek bildirim
    if (expoPushToken) {
      await sendPushNotification(expoPushToken, message);
    }

    console.log(message);
    console.log('drops: ', JSON.stringify(priceDrops, null, 2));
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

      <Button title="Test new price drops" onPress={priceDrops} />

      <FlatList
        data={products}
        keyExtractor={(item) => item.asin}
        contentContainerClassName="gap-2 p-2"
        renderItem={({ item }) => (
          <Link href={`/product/${item.asin}`} asChild>
            <Pressable className="flex-row gap-2 bg-white p-3">
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
