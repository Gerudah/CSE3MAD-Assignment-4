import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { StyleSheet, View } from 'react-native';

const adUnitId = TestIds.BANNER;

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          networkExtras:{
            collapsible: 'bottom',
          }
        }}

      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
});
