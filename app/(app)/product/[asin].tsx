import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Tables } from '~/types/supabase';
import { supabase } from '~/utils/supabase';

export default function ProductDetailScreen() {
  const [product, setProduct] = useState<Tables<'products'> | null>(null);

  const { asin } = useLocalSearchParams<{ asin: string }>();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('asin', asin)
      .single()
      .then(({ data }) => setProduct(data));
  }, []);

  if (!product) {
    return <Text>Product Not found</Text>;
  }
  return (
    <View
      // onPress={() => Linking.openURL(item.url)}
      className="flex-row gap-2 bg-white p-3">
      <Image source={{ uri: product.image }} className="h-20 w-20" resizeMode="contain" />
      <Text className="flex-1" numberOfLines={4}>
        {product.name}
      </Text>
      <Text>$ {product.final_price}</Text>
    </View>
  );
}
