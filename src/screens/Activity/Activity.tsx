import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import NewButton from '../../components/Button';
import DatePickerComponent from '../../components/DatePicker';
import UniversalModal from '../../components/UniversalModal';
import BookingHeroCard from '../../components/booking/BookingHeroCard';
import DetailSection from '../../components/booking/DetailSection';
import EmptyStateCard from '../../components/booking/EmptyStateCard';
import AppAlertModal from '../../components/feedback/AppAlertModal';
import { useAppAlert } from '../../hooks/useAppAlert';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { useSlots } from '../../services/Activity/FacilityService';
import { AppStackParamList } from '../../navigation/AppDrawer';
import { FONT_FAMILY } from '../../util/colors';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
type Props = NativeStackScreenProps<AppStackParamList, 'Activity'>;

const Activity: React.FC<Props> = ({ route, navigation }) => {
  const params = route as any;
  const facility = params?.params?.facility || route?.params?.facility;
  const auth = useSelector((state: any) => state.auth);
  const { colors } = useAppTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const [tempStartDate, setTempStartDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [session, setSession] = useState<any>({ id: 0 });
  const [visible, setVisible] = useState(false);

  const { slotsQuery, sessionsQuery } = useSlots(
    facility?.id,
    session?.id,
    tempStartDate,
    auth?.token,
  );

  const dateOptions = slotsQuery?.data?.dateOptions || [];
  const slotRows = slotsQuery?.data?.data || [];
  const inventory = Number(facility?.inventory || 0);

  const analytics = useMemo(() => {
    let totalCells = 0;
    let available = 0;
    let booked = 0;
    let past = 0;

    slotRows.forEach((time: any) => {
      dateOptions.forEach((day: any) => {
        totalCells += 1;
        const slotBookingsOnDay = (time?.booking_data || []).filter(
          (booking: any) => booking?.slot_date === day?.session_date,
        );
        const isFullyBooked = slotBookingsOnDay.length >= inventory;
        const fullDateTime = moment(
          `${day?.session_date} ${time?.label}`,
          'YYYY-MM-DD hh:mm A',
        );
        const isPast = fullDateTime.isBefore(moment());

        if (isPast) {
          past += 1;
        } else if (isFullyBooked) {
          booked += 1;
        } else {
          available += 1;
        }
      });
    });

    return { totalCells, available, booked, past };
  }, [dateOptions, inventory, slotRows]);

  const selectSlot = (day: any, time: any) => {
    setSelectedSlots(prev => {
      const exists = prev.find(
        slot => slot?.time?.id === time?.id && slot?.day?.id === day?.id,
      );

      if (exists) {
        return prev.filter(
          slot => !(slot?.day?.id === day?.id && slot?.time?.id === time?.id),
        );
      }

      return [...prev, { day, time }];
    });
  };

  const renderCell = (day: any, time: any) => {
    const slotBookingsOnDay = (time?.booking_data || []).filter(
      (booking: any) => booking?.slot_date === day?.session_date,
    );
    const isFullyBooked = slotBookingsOnDay.length >= inventory;
    const fullDateTime = moment(
      `${day?.session_date} ${time?.label}`,
      'YYYY-MM-DD hh:mm A',
    );
    const isPast = fullDateTime.isBefore(moment());
    const isSelected = selectedSlots.some(
      item => item?.time?.id === time?.id && item?.day?.id === day?.id,
    );
    const slotsLeft = Math.max(0, inventory - slotBookingsOnDay.length);

    let tone = {
      backgroundColor: colors.surfaceAlt,
      textColor: colors.text,
      subtitleColor: colors.textMuted,
    };

    if (isPast) {
      tone = {
        backgroundColor: `${colors.textMuted}22`,
        textColor: colors.textMuted,
        subtitleColor: colors.textMuted,
      };
    } else if (isFullyBooked) {
      tone = {
        backgroundColor: `${colors.danger}16`,
        textColor: colors.danger,
        subtitleColor: colors.danger,
      };
    } else if (isSelected) {
      tone = {
        backgroundColor: colors.secondary,
        textColor: colors.onPrimary,
        subtitleColor: colors.onPrimary,
      };
    }

    return (
      <Pressable
        disabled={isPast || isFullyBooked}
        onPress={() => selectSlot(day, time)}
        style={[
          styles.slotCell,
          {
            backgroundColor: tone.backgroundColor,
            borderColor: isSelected ? colors.secondary : colors.border,
          },
        ]}
      >
        <Text style={[styles.slotPrice, { color: tone.textColor }]}>
          Rs. {Number(facility?.charge || 0).toFixed(0)}
        </Text>
        <Text style={[styles.slotLeft, { color: tone.subtitleColor }]}>
          {isPast ? 'Past' : isFullyBooked ? 'Booked' : `${slotsLeft} left`}
        </Text>
      </Pressable>
    );
  };

  const handleProceed = () => {
    if (!selectedSlots.length) {
      showAlert({
        title: 'No slot selected',
        message: 'Please select at least one activity slot before continuing.',
        tone: 'warning',
      });
      return;
    }

    (navigation as any).navigate('ChoosePlayer', {
      slots: selectedSlots,
      facility,
      session,
    });
  };

  const renderLoadingGrid = () => (
    <View style={styles.loadingGrid}>
      {[1, 2, 3, 4].map(row => (
        <View key={row} style={styles.loadingRow}>
          {[1, 2, 3, 4, 5].map(col => (
            <ShimmerPlaceholder
              key={`${row}-${col}`}
              width={78}
              height={66}
              shimmerStyle={styles.loadingCell}
            />
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Activity Booking">
        <Pressable
          style={[styles.headerAction, { borderColor: `${colors.onPrimary}35` }]}
          onPress={() =>
            navigation.navigate('MyBookings', {
              url: ['Activity'],
              toggle: 'Activity',
            } as any)
          }
        >
          <Text style={[styles.headerActionLabel, { color: colors.onPrimary }]}>
            My Bookings
          </Text>
        </Pressable>
      </Header>

      <ScrollView contentContainerStyle={styles.content}>
        <BookingHeroCard
          eyebrow="Slot Selection"
          title={facility?.name || 'Activity'}
          subtitle={`Book between ${facility?.min_days || 0} and ${facility?.max_days || 0} days in advance.`}
          status={selectedSlots.length ? 'Slots selected' : 'Choose slots'}
          statusTone={selectedSlots.length ? 'success' : 'warning'}
          meta={[
            { label: 'Charge', value: `Rs. ${Number(facility?.charge || 0).toFixed(2)}` },
            { label: 'Inventory', value: String(inventory) },
            { label: 'Selected', value: String(selectedSlots.length), tone: 'success' },
          ]}
        />

        <DetailSection
          title="Schedule Filters"
          subtitle="Choose the first booking date and narrow the table by session."
          delay={40}
        >
          <View style={styles.filterRow}>
            <View style={styles.filterBlock}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Start date</Text>
              <DatePickerComponent
                placeholder={moment(tempStartDate).format('DD-MMMM-YYYY')}
                minDate={moment().add(parseInt(facility?.min_days || 0, 10), 'days').toDate()}
                maxDate={moment()
                  .add(parseInt((facility?.max_days || 0) - 4, 10), 'days')
                  .toDate()}
                stateDate={date => setTempStartDate(date)}
              />
            </View>
            <View style={styles.filterBlock}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Session</Text>
              <Dropdown
                style={[
                  styles.dropdown,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                placeholderStyle={{ color: colors.textMuted, fontFamily: FONT_FAMILY.normal }}
                selectedTextStyle={{ color: colors.text, fontFamily: FONT_FAMILY.semiBold }}
                containerStyle={{
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                itemTextStyle={{ color: colors.text, fontFamily: FONT_FAMILY.normal }}
                data={[{ id: 0, name: 'All Sessions' }, ...(sessionsQuery?.data?.data || [])]}
                maxHeight={280}
                labelField="name"
                valueField="id"
                placeholder="Select session"
                value={session?.id ?? 0}
                onChange={item => setSession(item)}
              />
            </View>
          </View>
        </DetailSection>

        <DetailSection
          title="Availability Snapshot"
          subtitle="Live slot colors help you distinguish available, booked, past, and selected cells."
          delay={70}
        >
          <View style={styles.legendRow}>
            {[
              { label: 'Available', color: colors.surfaceAlt, text: colors.text },
              { label: 'Selected', color: colors.secondary, text: colors.onPrimary },
              { label: 'Booked', color: `${colors.danger}16`, text: colors.danger },
              { label: 'Past', color: `${colors.textMuted}22`, text: colors.textMuted },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.analyticsRow}>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>
                {analytics.available}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textMuted }]}>
                Available
              </Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>
                {analytics.booked}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textMuted }]}>
                Booked
              </Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>
                {analytics.past}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textMuted }]}>
                Past
              </Text>
            </View>
          </View>
        </DetailSection>

        <DetailSection
          title="Slot Matrix"
          subtitle="Tap any available cell to add or remove it from your activity cart."
          delay={100}
        >
          {slotsQuery.isLoading ? (
            renderLoadingGrid()
          ) : !slotRows.length || !dateOptions.length ? (
            <EmptyStateCard
              title="No slots found"
              description="There are no slot rows available for the chosen date and session."
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.matrixHeaderRow}>
                  <View
                    style={[
                      styles.timeHeaderCell,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.timeHeaderText, { color: colors.textMuted }]}>
                      Time
                    </Text>
                  </View>
                  {dateOptions.map((day: any) => (
                    <View
                      key={day?.id}
                      style={[
                        styles.dayHeaderCell,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.dayHeaderDate, { color: colors.text }]}>
                        {day?.date}
                      </Text>
                      <Text style={[styles.dayHeaderDay, { color: colors.textMuted }]}>
                        {day?.day}
                      </Text>
                    </View>
                  ))}
                </View>

                {slotRows.map((time: any, rowIndex: number) => (
                  <View key={rowIndex} style={styles.matrixBodyRow}>
                    <View
                      style={[
                        styles.timeCell,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Icon
                        name={
                          time?.session_id === 1
                            ? 'weather-sunny'
                            : time?.session_id === 2
                            ? 'white-balance-sunny'
                            : 'weather-night'
                        }
                        color={
                          time?.session_id === 1
                            ? colors.warning
                            : time?.session_id === 2
                            ? colors.danger
                            : colors.text
                        }
                        size={18}
                      />
                      <Text style={[styles.timeCellText, { color: colors.text }]}>
                        {time?.label}
                      </Text>
                    </View>
                    {dateOptions.map((day: any) => (
                      <View
                        key={`${time?.id}-${day?.id}`}
                        style={[
                          styles.matrixCellWrap,
                          { borderColor: colors.border },
                        ]}
                      >
                        {renderCell(day, time)}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </DetailSection>
      </ScrollView>

      {selectedSlots.length ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <Pressable style={styles.footerMetaWrap} onPress={() => setVisible(true)}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>
              {selectedSlots.length} {selectedSlots.length > 1 ? 'slots' : 'slot'} selected
            </Text>
            <Text style={[styles.footerSubtitle, { color: colors.textMuted }]}>
              Tap to review dates and times
            </Text>
          </Pressable>
          <NewButton text="Choose Players" onPress={handleProceed} />
        </View>
      ) : null}

      <UniversalModal
        visible={visible}
        title={`${selectedSlots.length} ${selectedSlots.length > 1 ? 'Slots' : 'Slot'} Selected`}
        setVisible={setVisible}
      >
        <View style={styles.modalBody}>
          {selectedSlots.map((slot: any, index: number) => (
            <View
              key={`${slot?.day?.id}-${slot?.time?.id}-${index}`}
              style={[
                styles.modalCard,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalCardTitle, { color: colors.text }]}>
                  {facility?.name}
                </Text>
                <Text style={[styles.modalCardMeta, { color: colors.textMuted }]}>
                  {slot?.time?.label}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.modalDate, { color: colors.text }]}>
                  {moment(slot?.day?.session_date).format('DD MMM YYYY')}
                </Text>
                <Text style={[styles.modalSlotsPill, { color: colors.onPrimary }]}>
                  1 Slot
                </Text>
              </View>
            </View>
          ))}
        </View>
      </UniversalModal>

      <AppAlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel={alertState.secondaryLabel}
        onDismiss={hideAlert}
        onPrimaryPress={() => {
          hideAlert();
          alertState.onPrimaryPress?.();
        }}
        onSecondaryPress={() => {
          hideAlert();
          alertState.onSecondaryPress?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  headerAction: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerActionLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.semiBold,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterBlock: {
    flex: 1,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontFamily: FONT_FAMILY.semiBold,
  },
  dropdown: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    margin: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 10,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.normal,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  analyticsCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
  },
  analyticsValue: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
  },
  analyticsLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONT_FAMILY.normal,
  },
  loadingGrid: {
    gap: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  loadingCell: {
    borderRadius: 16,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
  },
  timeHeaderCell: {
    width: 94,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  timeHeaderText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.semiBold,
  },
  dayHeaderCell: {
    width: 92,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dayHeaderDate: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  dayHeaderDay: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONT_FAMILY.normal,
  },
  matrixBodyRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  timeCell: {
    width: 94,
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  timeCellText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONT_FAMILY.semiBold,
  },
  matrixCellWrap: {
    width: 92,
    minHeight: 76,
    borderRadius: 16,
    marginRight: 8,
  },
  slotCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  slotPrice: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.semiBold,
  },
  slotLeft: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FONT_FAMILY.normal,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerMetaWrap: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  footerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONT_FAMILY.normal,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCardTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.semiBold,
  },
  modalCardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONT_FAMILY.normal,
  },
  modalDate: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.semiBold,
  },
  modalSlotsPill: {
    marginTop: 8,
    backgroundColor: '#151831',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontFamily: FONT_FAMILY.semiBold,
  },
});

export default Activity;
