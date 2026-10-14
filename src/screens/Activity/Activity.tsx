import React, {  useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import Header from '../../components/Header';
import BookingHeroCard from '../../components/booking/BookingHeroCard';
import DetailSection from '../../components/booking/DetailSection';
import NewButton from '../../components/Button';
import {
  usePlayersQuery,
  useSlots,
} from '../../services/Activity/FacilityService';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { AppStackParamList } from '../../navigation/AppDrawer';
import { FONT_FAMILY } from '../../util/colors';
import { javascriptPost } from '../../util/api';
import { ENDPOINT } from '../../util/constant';
import LinearGradient from 'react-native-linear-gradient';
import EmptyStateCard from '../../components/booking/EmptyStateCard';
import { Dropdown } from 'react-native-element-dropdown';
import DatePickerComponent from '../../components/DatePicker';
import moment from 'moment';

type Props = NativeStackScreenProps<AppStackParamList, 'Activity'>;

const Counter = ({ title, value, min, max, onAdd, onRemove }: any) => {
  const disableMinus = value <= min;
  const disablePlus = value >= max;
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.counterCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.counterTitle, { color: colors.text }]}>{title}</Text>

      <View style={[styles.counterRow, { borderColor: colors.border }]}>
        <Pressable
          disabled={disableMinus}
          style={[styles.counterButton, disableMinus && { opacity: 0.4 }]}
          onPress={onRemove}
        >
          <Text style={[styles.counterButtonText, { color: colors.text }]}>
            −
          </Text>
        </Pressable>

        <Text style={[styles.counterValue, { color: colors.text }]}>
          {value}
        </Text>

        <Pressable
          disabled={disablePlus}
          style={[styles.counterButton, disablePlus && { opacity: 0.4 }]}
          onPress={onAdd}
        >
          <Text style={[styles.counterButtonText, { color: colors.text }]}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const Activity: React.FC<Props> = ({ route, navigation }) => {
  const facility = route?.params?.facility || (route as any)?.params?.facility;

  const auth = useSelector((state: any) => state.auth);
  const [loading, setLoading] = useState(false);
  const { colors, resolvedMode } = useAppTheme();

  const { slotsQuery } = useSlots(facility?.id, auth?.token);
  const activity = slotsQuery?.data?.data;
  
  const frequencies = activity?.frequencies || [];
   const [startDate, setStartDate] = useState<string>("");
  const [selectedFrequency, setSelectedFrequency] = useState<any>(null);

  const [booking, setBooking] = useState<any[]>([]);
  
  const { playersQuery } = usePlayersQuery(auth, false, false, false);

  const allGuests = playersQuery?.data?.data || [];
const member = playersQuery?.data?.member;
const spouse = playersQuery?.data?.spouse;
console.log( activity?.min_booking_days, '---------------------- spouse ---------------------');
const dependents = playersQuery?.data?.dependents || [];

  const gst = Number(activity?.tax?.value || 0);

  const subtotal = useMemo(() => {
    return booking.reduce(
      (sum, item) => sum + item.qty * item.amount,

      0,
    );
  }, [booking]);

const gstAmount = useMemo(() => {
  return (subtotal * gst) / 100;
}, [subtotal, gst]);

const total = subtotal + gstAmount;

const handleContinue = async () => {
  try {
    if (!selectedFrequency) {
      Alert.alert('Plan Required', 'Please select a plan.');
      return;
    }

     if (!startDate) {
      Alert.alert('Package Date Required', 'Please select a valid date.');
      return;
    }

    // Selected occupants only
    const selectedBooking = booking.filter((item: any) => item.qty > 0);

    if (!selectedBooking.length) {
      Alert.alert(
        'Booking Required',
        'Please select at least one participant.',
      );
      return;
    }

    // Validate Guest Selection
  for (const item of selectedBooking) {

  // Skip if no quantity
  if (item.qty <= 0) continue;

  // Player count should match quantity
  if (item.players.length !== item.qty) {
    Alert.alert(
      `${item.occupant} Required`,
      `Please select all ${item.occupant.toLowerCase()}s.`
    );
    return;
  }

  // Every player should be selected
  const hasEmpty = item.players.some((player: any) => !player);

  if (hasEmpty) {
    Alert.alert(
      `${item.occupant} Required`,
      `Please select all ${item.occupant.toLowerCase()}s.`
    );
    return;
  }
}

    setLoading(true);

  const payload = {
  activity_id: activity.id,
  frequency_id: selectedFrequency.id,
  package_start_date: startDate,

  booking: selectedBooking.map((item: any) => ({
    charge_id: item.charge_id,
    occupant_id: item.occupant_id,
    qty: item.qty,

    players: item.players.map((player: any) => ({
      member_id:
        player.member_id ??
        player.MemberID ??
        null,

      guest_id:
        player.id ?? null,

      name:
        player.display_name ??
        player.DisplayName ??
        player.name,

      mobile: player.mobile ?? null,
    })),
  })),
};

    const response = await javascriptPost({
      path: ENDPOINT.book_facilities,
      Token: auth.token,
      body: payload,
    });

    if (!response.status) {
      Alert.alert('Error', response.message);
      return;
    }

    navigation.navigate('UniversalPayment', {
      type: 'Activity',
      orderData: response.data,
    });
  } catch (e: any) {
    Alert.alert(
      'Booking Failed',
      e?.response?.data?.message ?? e.message,
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Header title={activity?.activity_name || 'Activity Booking'}>
        <Pressable
          style={[
            styles.headerAction,
            { borderColor: `${colors.onPrimary}35` },
          ]}
          onPress={() => navigation.navigate('Players')}
        >
          <Text style={[styles.headerActionLabel, { color: colors.onPrimary }]}>
            My Guests
          </Text>
        </Pressable>
      </Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        <BookingHeroCard
          title={activity?.activity_name}
          subtitle={activity?.description}
          status={frequencies.length ? 'Available' : 'Closed'}
          statusTone={frequencies.length ? 'success' : 'warning'}
        />

        {frequencies.length > 0 ? (
          <LinearGradient
            colors={
              resolvedMode === 'dark'
                ? ['#020617', '#0F172A', '#1E293B']
                : ['#1E293B', '#334155', '#475569']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View
              style={{
                paddingHorizontal: 18,
                marginVertical: 20,
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
           {frequencies.map((item: any) => {
  const selected = selectedFrequency?.id === item.id;
  const memberCharge =
    item.occupants.find((o: any) => o.occupant_id === 1) ||
    item.occupants[0];

  return (
    <Pressable
      key={item.id}
      onPress={() => {
        setSelectedFrequency(item,);

        setBooking(
          item.occupants.map((o: any) => ({
         
            charge_id: o.charge_id,
            occupant_id: o.occupant_id,
            occupant: o.name,
            amount: Number(o.amount),
            max_persons: Number(o.max_persons),
            qty: 0,
            players: [],
          })),
        );
      }}
      style={[
        styles.membershipCard,
        {
          backgroundColor: selected
            ? colors.background
            : colors.surface,
          borderColor: selected
            ? colors.primary
            : colors.border,
        },
      ]}
    >
      <View style={styles.membershipTop}>
        <View>
          <Text
            style={[
              styles.membershipTitle,
              {
                color: selected
                  ? colors.text
                  : colors.text,
              },
            ]}
          >
            {item.type}
          </Text>

          <Text
            style={[
              styles.membershipSubtitle,
              {
                color: selected
                  ? colors.text
                  : colors.textMuted,
              },
            ]}
          >
            Valid for {item.days}{' '}
            {item.days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        <View
          style={[
            styles.radioCircle,
            {
              borderColor: selected
                ? colors.text
                : colors.border,
            },
          ]}
        >
          {selected && (
            <View
              style={[
                styles.radioInner,
                {
                  backgroundColor:
                    colors.text,
                },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.membershipDivider} />

      <View style={styles.membershipBottom}>
        <View>
          <Text
            style={[
              styles.priceTitle,
              {
                color: selected
                  ? colors.text
                  : colors.textMuted,
              },
            ]}
          >
            Starting From
          </Text>

          <Text
            style={[
              styles.membershipPrice,
              {
                color: selected
                  ? colors.text
                  : colors.text,
              },
            ]}
          >
            ₹ {memberCharge?.amount ?? 0}
          </Text>
        </View>

        <View
          style={[
            styles.validityChip,
            {
              backgroundColor: selected
                ? 'rgba(255,255,255,0.18)'
                : '#EEF5FF',
            },
          ]}
        >
          <Text
            style={[
              styles.validityText,
              {
                color: selected
                  ? colors.text
                  : colors.primary,
              },
            ]}
          >
            {item.days} {item.days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
})}
            </View>
          </LinearGradient>
        ) : (
          <EmptyStateCard
            title={'No Active slots available for this activity.'}
            description={
              'Please check back later or contact support for assistance.'
            }
          />
        )}

        {selectedFrequency && (
          <DetailSection
            title="Booking Details"
            subtitle="Choose number of members and dependents"
          >
            <View
              style={{
                marginTop: 10,
                // flexDirection: 'row',
                // justifyContent: 'space-between',
              }}
            >
            <DatePickerComponent
            placeholder='Please select package start date'
         minDate={moment()
    .add(activity?.min_booking_days , 'days')
    .toDate()}
  maxDate={moment()
    .add(activity?.max_booking_days , 'days')
    .toDate()}
            stateDate={setStartDate}
            // setResetDate={}
            />
              <View style={{ marginTop: 10 }}>
                {booking.map((item: any, index: number) => 
                 {

  // Hide spouse if no spouse exists
  if (item.occupant_id === 2 && !spouse) {
    return null;
  }

  // Hide dependent if no dependents exist
  if (
    item.occupant_id === 3 &&
    (!dependents || dependents.length === 0)
  ) {
    return null;
  }
  return(
                  <View key={item.charge_id} style={{ marginBottom: 15 }}>
                    <Counter
                      title={`${item.occupant} (₹${item.amount})`}
                      value={item.qty}
                      min={0}
                      max={item.max_persons}
                      onAdd={() => {
                        const temp = [...booking];

                        if (temp[index].qty < temp[index].max_persons) {
                          temp[index].qty++;

                          // if (temp[index].occupant_id === 4) {
                          //   temp[index].players.push(null);
                          // }
switch (temp[index].occupant_id) {
    case 1: // Member
        temp[index].players = member ? [member] : [];
        break;

    case 2: // Spouse
        temp[index].players = spouse ? [spouse] : [];
        break;

    case 3: // Dependent
        temp[index].players.push(null);
        break;

    case 4: // Guest
        temp[index].players.push(null);
        break;
}
                          setBooking(temp);
                        }
                      }}
                      onRemove={() => {
                        const temp = [...booking];

                        const min = 0;

                        if (temp[index].qty > min) {
                          temp[index].qty--;

                          // if (temp[index].occupant_id === 4) {
                          //   temp[index].players.pop();
                          // }
switch (temp[index].occupant_id) {

    case 3:
    case 4:
        temp[index].players.pop();
        break;

    case 1:
        if (temp[index].qty === 0) {
            temp[index].players = [];
        }
        break;

    case 2:
        if (temp[index].qty === 0) {
            temp[index].players = [];
        }
        break;
}
                          setBooking(temp);
                        }
                      }}
                    />

{item.occupant_id === 3 && item.qty > 0 && (
  <View style={{ marginTop: 10 }}>
    {Array.from({ length: item.qty }).map((_, dependentIndex) => (
      <View
        key={dependentIndex}
        style={{ marginBottom: 12 }}
      >
        <Text
          style={{
            marginBottom: 6,
            color: colors.text,
            fontWeight: '600',
          }}
        >
          Dependent {dependentIndex + 1}
        </Text>

        <Dropdown
          data={dependents.filter(
            dependent =>
              !item.players.some(
                (p: any) => p?.member_id === dependent.member_id,
              ) ||
              item.players[dependentIndex]?.member_id === dependent.member_id,
          )}
          labelField="display_name"
          valueField="member_id"
          value={item.players[dependentIndex]?.member_id ?? null}
          placeholder={`Select Dependent ${dependentIndex + 1}`}
          search
          maxHeight={250}
          searchPlaceholder="Search Dependent..."
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          placeholderStyle={{
            color: colors.placeholder,
          }}
          selectedTextStyle={{
            color: colors.text,
          }}
          onChange={dependent => {
            const temp = [...booking];

            temp[index].players[dependentIndex] = dependent;

            setBooking(temp);
          }}
        />
      </View>
    ))}

    <Text
      style={{
        marginTop: 6,
        fontSize: 12,
        color: colors.textMuted,
      }}
    >
      Select your dependent(s).
    </Text>
  </View>
)}
                    {item.occupant_id === 4 && item.qty > 0 && (
                      <View
                        style={{
                          marginTop: 10,
                        }}
                      >
                        {Array.from({
                          length: item.qty,
                        }).map((_, guestIndex) => (
                          <View
                            key={guestIndex}
                            style={{
                              marginBottom: 12,
                            }}
                          >
                            <Text
                              style={{
                                marginBottom: 6,
                                color: colors.text,
                                fontWeight: '600',
                              }}
                            >
                              Guest {guestIndex + 1}
                            </Text>

                            <Dropdown
                              data={allGuests.filter(
                                guest =>
                                  !item.players.some(
                                    (g: any) => g?.id === guest.id,
                                  ) ||
                                  item.players[guestIndex]?.id === guest.id,
                              )}
                              labelField="name"
                              valueField="id"
                              value={item.players[guestIndex]?.id ?? null}
                              placeholder={`Select Guest ${guestIndex + 1}`}
                              search
                              maxHeight={250}
                              searchPlaceholder="Search Guest..."
                              style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 12,
                              }}
                              placeholderStyle={{
                                color: colors.placeholder,
                              }}
                              selectedTextStyle={{
                                color: colors.text,
                              }}
                              onChange={guest => {
                                const temp = [...booking];

                                temp[index].players[guestIndex] = guest;

                                setBooking(temp);
                              }}
                            />
                          </View>
                        ))}

                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: colors.textMuted,
                          }}
                        >
                          Select guests from your saved players.
                        </Text>
                      </View>
                    )}
                  </View>
                )})}
              </View>
            </View>
          </DetailSection>
        )}
{selectedFrequency && (
  <DetailSection
    title="Booking Summary"
    subtitle="Review before proceeding"
  >
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Plan */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.text }]}>
          Plan
        </Text>

        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {selectedFrequency.type}
        </Text>
      </View>

      {/* Occupants */}
      {/* {booking
        .filter(item => item.qty > 0)
        .map(item => (
          <View
            key={item.charge_id}
            style={styles.summaryRow}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.text },
              ]}
            >
              {item.occupant} × {item.qty}
            </Text>

            <Text
              style={[
                styles.summaryValue,
                { color: colors.text },
              ]}
            >
              ₹ {(item.qty * item.amount).toFixed(2)}
            </Text>
          </View>
        ))} */}
{/* Occupants */}
{booking
  .filter(item => item.qty > 0)
  .map(item => (
    <View
      key={item.charge_id}
      style={{
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
    >
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryLabel,
            { color: colors.text },
          ]}
        >
          {item.occupant} × {item.qty}
        </Text>

        <Text
          style={[
            styles.summaryValue,
            { color: colors.text },
          ]}
        >
          ₹ {(item.qty * item.amount).toFixed(2)}
        </Text>
      </View>

      {/* Selected Players */}
      {item.players?.length > 0 &&
        item.players.map((player: any, playerIndex: number) => (
          player && (
            <View
              key={playerIndex}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 4,
                paddingLeft: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                }}
              >
                • {player.display_name || player.DisplayName || player.name}
              </Text>

              {/* <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                }}
              >
                {player.member_id ||
                  player.MemberID ||
                  player.id}
              </Text> */}
            </View>
          )
        ))}
    </View>
  ))}
      {/* Subtotal */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.text }]}>
          Subtotal
        </Text>

        <Text style={[styles.summaryValue, { color: colors.text }]}>
          ₹ {subtotal.toFixed(2)}
        </Text>
      </View>

      {/* GST */}
      {gst > 0 && (
        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: colors.text },
            ]}
          >
            {activity?.tax?.type}
          </Text>

          <Text
            style={[
              styles.summaryValue,
              { color: colors.text },
            ]}
          >
            ₹ {gstAmount.toFixed(2)}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.summaryDivider,
          {
            backgroundColor: colors.border,
          },
        ]}
      />

      {/* Total */}
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.totalLabel,
            {
              color: colors.text,
            },
          ]}
        >
          Total
        </Text>

        <Text
          style={[
            styles.totalAmount,
            {
              color: colors.success,
            },
          ]}
        >
          ₹ {total.toFixed(2)}
        </Text>
      </View>
    </View>
  </DetailSection>
)}
      </ScrollView>

      {selectedFrequency && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View>
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: FONT_FAMILY.normal,
              }}
            >
              Total Amount
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 24,

                fontFamily: FONT_FAMILY.bold,
              }}
            >
              ₹ {total.toFixed(2)}
            </Text>
          </View>

          <NewButton
            loading={loading}
            text="Pay Now"
            onPress={() => {
              handleContinue();
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAction: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems:'center'
  },
  headerActionLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.semiBold,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  gradient: {
    // padding: 22,
    marginBottom: 20,
    borderRadius: 18,
    marginHorizontal:20
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },

  infoLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.normal,
  },

  infoValue: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.semiBold,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    padding: 18,
    marginBottom: 14,
  },

  planTitle: {
    fontSize: 17,
    fontFamily: FONT_FAMILY.bold,
  },

  planDays: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: FONT_FAMILY.normal,
  },

  planPrice: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.bold,
  },

  counterCard: {
    flex: 1,
    borderRadius: 18,
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  counterTitle: {
    // fontSize: 15,
    // marginBottom: 15,
    fontFamily: FONT_FAMILY.semiBold,
  },

  counterRow: {
    // flex: 0.5,
    minWidth: '40%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f03b',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  membershipCard: {
    borderRadius: 24,

    borderWidth: 2,

    padding: 20,

    marginBottom: 18,

    elevation: 2,
  },

  membershipTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  membershipTitle: {
    fontSize: 19,

    fontFamily: FONT_FAMILY.bold,
  },

  membershipSubtitle: {
    marginTop: 6,

    fontSize: 13,

    fontFamily: FONT_FAMILY.normal,
  },

  membershipDivider: {
    height: 1,

    backgroundColor: '#ECECEC',

    marginVertical: 18,
  },

  membershipBottom: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  membershipPrice: {
    marginTop: 4,

    fontSize: 30,

    fontFamily: FONT_FAMILY.bold,
  },

  priceTitle: {
    fontSize: 12,

    fontFamily: FONT_FAMILY.normal,
  },

  radioCircle: {
    width: 28,

    height: 28,

    borderRadius: 14,

    borderWidth: 2,

    justifyContent: 'center',

    alignItems: 'center',
  },

  radioInner: {
    width: 14,

    height: 14,

    borderRadius: 7,
  },

  validityChip: {
    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 30,
  },

  validityText: {
    fontSize: 12,

    fontFamily: FONT_FAMILY.bold,
  },
  counterButton: {
    // width: 46,
    // height: 46,
    // borderRadius: 23,
    // backgroundColor: '#1565C0',

    justifyContent: 'center',
    alignItems: 'center',
  },

  counterButtonText: {
    color: '#1565C0',
    fontSize: 24,
    fontFamily: FONT_FAMILY.bold,
  },

  counterValue: {
    fontSize: 28,
    fontFamily: FONT_FAMILY.bold,
  },

  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
playerCard:{
  backgroundColor:'red',
  marginHorizontal:10

},
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONT_FAMILY.normal,
  },

  summaryValue: {
    fontSize: 15,
    color: '#111',
    fontFamily: FONT_FAMILY.semiBold,
  },

  summaryDivider: {
    height: 1,
    marginVertical: 16,
  },

  totalLabel: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },

  totalAmount: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.bold,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    borderTopWidth: 1,

    paddingHorizontal: 18,
    paddingVertical: 14,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default Activity;
