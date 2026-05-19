import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
} from 'react-native';
import React from 'react';
import RNModal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONT_FAMILY, LIGHT_BLUE, SECONDARY_COLOR } from '../util/colors';
import UniversalModal from './UniversalModal';
interface VenueModalProps {
  visible: boolean;
  onDismiss: () => void;
  venues?: any[];
  charge?: any;
}

const VenueModal:React.FC<VenueModalProps> = ({visible, onDismiss, venues, charge}) => {
  return (
    <UniversalModal
      visible={visible}
     
      setVisible={onDismiss}
    
      isFull={true}
      title="Venue Details">
 

        <FlatList
          data={venues || []}
          style={{flexGrow: 0}}
          renderItem={({item, index}) => (
            <View style={styles.card}>
              <Text style={[styles.name, {fontFamily: FONT_FAMILY.normal}]}>
                Venue {index + 1}.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={styles.name}>{item?.name}</Text>
                <Text style={styles.name}>Charge:{Number(item?.rate).toFixed(2)}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={styles.name}>
                  {
                    item.sessions?.find(
                      session => session.id == item?.sessionID,
                    )?.name
                  }
                </Text>
                <Text style={styles.name}>
                  GST({item.GSTper}):{' '}
                  <Text style={{color: SECONDARY_COLOR}}>
                    {(parseInt(item.GSTper) * parseInt(item.rate)/ 100).toFixed(2) }
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text style={styles.name}>
                  Capacity:{' '}
                  <Text style={{color: SECONDARY_COLOR}}>{item.capacity}</Text>
                </Text>
                <Text style={[styles.name]}>
                  Security deposit:{' '}
                  <Text style={{color: SECONDARY_COLOR}}>
                    ₹{parseFloat(item.security_deposit).toFixed(2)}
                  </Text>
                </Text>
              </View>
              <Text
                style={[
                  styles.name,
                  {fontFamily: FONT_FAMILY.normal, alignSelf: 'flex-end'},
                ]}>
                Sub total:{' '}
                <Text
                  style={{
                    color: SECONDARY_COLOR,
                    fontFamily: FONT_FAMILY.bold,
                  }}>
                  ₹{parseFloat(item.totalWithGST).toFixed(2)}
                </Text>
              </Text>
            </View>
          )}
          keyExtractor={item => item?.id?.toString()}
        />

        <View>
          {venues.every(item => item.totalWithGST) && (
            <View
              style={{
                margin: 10,
                padding: 10,
                borderRadius: 8,
                backgroundColor: LIGHT_BLUE,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  color: 'black',
                  fontFamily: FONT_FAMILY.bold,
                }}>
                Amount to be paid:
              </Text>
              <Text
                style={{
                  color: SECONDARY_COLOR,
                  fontFamily: FONT_FAMILY.bold,
                }}>
                ₹
                {venues
                  ?.reduce((sum, venue) => {
                    const rate = parseFloat(venue.rate) || 0;
                    const gst = parseFloat(venue.GSTper) || 0;
                    const surcharge = parseFloat(
                      venue.sercharge || venue.surcharge || 0,
                    );

                    // Base + surcharge
                    const baseTotal = rate + surcharge;

                    // Apply GST
                    const totalWithGST = baseTotal + (baseTotal * gst) / 100;

                    return sum + totalWithGST;
                  }, 0)
                  .toFixed(2)}
              </Text>
            </View>
          )}
        </View>
    </UniversalModal>
  );
};

export default VenueModal;

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: 'white',

    borderRadius: 10,
  },
  name: {
    fontFamily: FONT_FAMILY.bold,
    color: 'black',
  },
  sessionText: {
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'lightgray',
  },
  buttonText: {
    fontFamily: FONT_FAMILY.bold,
    color: 'black',
    marginLeft: 5,
  },
  input: {
    margin: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'lightgray',
    padding: 10,
    color: 'black',
    fontFamily: FONT_FAMILY.normal,
  },
  itemContainerStyle: {
    color: 'grey',
  },
  itemTextStyle: {
    color: 'black',
    fontFamily: FONT_FAMILY.normal,
  },
  searchContainer: {
    margin: 10,
    marginHorizontal: 25,
  },
  placeholderStyle: {color: 'grey'},
  card: {
    margin: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
  },
});
