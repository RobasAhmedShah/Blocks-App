import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Property } from '@/types/property';
import { KeyboardDismissButton } from '@/components/common/KeyboardDismissButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyInvestmentCalculatorProps {
  property: Property;
  colors: any;
  isDarkColorScheme: boolean;
  onInvest?: (investmentAmount: number) => void;
}

const formatCurrency = (value: string | number) => {
  const num = parseFloat(value as string);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatPercentage = (value: string | number) => {
  const num = parseFloat(value as string);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export function PropertyInvestmentCalculator({
  property,
  colors,
  isDarkColorScheme,
  onInvest,
}: PropertyInvestmentCalculatorProps) {
  const initialInvestment = property.minInvestment || 2000;
  const initialAppreciation = property.estimatedROI || 6;
  const initialRentalYield = property.estimatedYield || 5.85;

  // Use numbers directly to avoid string conversion glitches
  const [investmentAmount, setInvestmentAmount] = useState<number>(initialInvestment);
  const [annualAppreciation, setAnnualAppreciation] = useState<number>(initialAppreciation);
  const [rentalYield, setRentalYield] = useState<number>(initialRentalYield);
  const [investmentPeriod, setInvestmentPeriod] = useState<number>(5);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Memoized calculations to prevent recalculation on every render
  const calculations = useMemo(() => {
    const capitalAppreciation = investmentAmount * Math.pow(1 + annualAppreciation / 100, investmentPeriod) - investmentAmount;

    let rentalIncome = 0;
    for (let year = 1; year <= investmentPeriod; year++) {
      const yearlyRental = investmentAmount * Math.pow(1 + annualAppreciation / 100, year - 1) * (rentalYield / 100);
      rentalIncome += yearlyRental;
    }

    const totalReturn = capitalAppreciation + rentalIncome;
    const finalValue = investmentAmount + totalReturn;
    const roiPercentage = (totalReturn / investmentAmount) * 100;

    return {
      capitalAppreciation: capitalAppreciation.toFixed(2),
      rentalIncome: rentalIncome.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      finalValue: finalValue.toFixed(2),
      roiPercentage: roiPercentage.toFixed(2),
    };
  }, [investmentAmount, annualAppreciation, rentalYield, investmentPeriod]);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleInvestmentChange = useCallback((value: number) => {
    setInvestmentAmount(Math.round(value));
  }, []);

  const handleAppreciationChange = useCallback((value: number) => {
    setAnnualAppreciation(parseFloat(value.toFixed(1)));
  }, []);

  const handleRentalChange = useCallback((value: number) => {
    setRentalYield(parseFloat(value.toFixed(2)));
  }, []);

  const handlePeriodChange = useCallback((value: number) => {
    setInvestmentPeriod(Math.round(value));
  }, []);

  const openEditModal = useCallback((field: string, currentValue: number) => {
    setEditingField(field);
    setEditValue(currentValue.toString());
    setModalVisible(true);
  }, []);

  const saveEdit = useCallback(() => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) return;

    switch (editingField) {
      case 'investment':
        if (numValue >= 0) setInvestmentAmount(numValue);
        break;
      case 'appreciation':
        if (numValue >= 0 && numValue <= 100) setAnnualAppreciation(numValue);
        break;
      case 'rental':
        if (numValue >= 0 && numValue <= 50) setRentalYield(numValue);
        break;
      case 'period':
        if (numValue >= 1 && numValue <= 50) setInvestmentPeriod(numValue);
        break;
    }

    setModalVisible(false);
    setEditingField(null);
    Keyboard.dismiss();
  }, [editValue, editingField]);

  const handleInvest = useCallback(() => {
    if (onInvest) {
      onInvest(investmentAmount);
    }
  }, [investmentAmount, onInvest]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <KeyboardDismissButton inputAccessoryViewID="calculatorInputAccessory" />
      <ScrollView
        style={{ flex: 1, }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="never"
        scrollEnabled={true}
      >
        <View style={{ padding: 6 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>
              Investment Calculator
            </Text>
          </View>

          <View style={{ marginBottom: 32 }}>
            {/* Investment Amount */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                  Investment Amount
                </Text>
                <TouchableOpacity
                  onPress={() => openEditModal('investment', investmentAmount)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: colors.muted,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    ${formatCurrency(investmentAmount)}
                  </Text>
                </TouchableOpacity>
              </View>

              <Slider
                style={{ width: SCREEN_WIDTH - 80, height: 40 }}
                minimumValue={0}
                maximumValue={50000}
                value={investmentAmount}
                onValueChange={handleInvestmentChange}
                step={1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Annual Appreciation */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                  Annual Appreciation
                </Text>
                <TouchableOpacity
                  onPress={() => openEditModal('appreciation', annualAppreciation)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: colors.muted,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {formatPercentage(annualAppreciation)}%
                  </Text>
                </TouchableOpacity>
              </View>

              <Slider
                style={{ width: SCREEN_WIDTH - 80, height: 40 }}
                minimumValue={0}
                maximumValue={30}
                value={annualAppreciation}
                onValueChange={handleAppreciationChange}
                step={0.5}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Rental Yield */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                  Rental Yield
                </Text>
                <TouchableOpacity
                  onPress={() => openEditModal('rental', rentalYield)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: colors.muted,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {formatPercentage(rentalYield)}%
                  </Text>
                </TouchableOpacity>
              </View>

              <Slider
                style={{ width: SCREEN_WIDTH - 80, height: 40 }}
                minimumValue={0}
                maximumValue={15}
                value={rentalYield}
                onValueChange={handleRentalChange}
                step={0.1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Investment Period */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                  Investment Period
                </Text>
                <TouchableOpacity
                  onPress={() => openEditModal('period', investmentPeriod)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: colors.muted,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {formatCurrency(investmentPeriod)} years
                  </Text>
                </TouchableOpacity>
              </View>

              <Slider
                style={{ width: SCREEN_WIDTH - 80, height: 40 }}
                minimumValue={1}
                maximumValue={30}
                value={investmentPeriod}
                onValueChange={handlePeriodChange}
                step={1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>
          </View>

          <View style={{ gap: 12, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                Expected Final Value
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>
                ${formatCurrency(calculations.finalValue)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                  Total Return
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  ${formatCurrency(calculations.totalReturn)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                  ROI
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  {formatPercentage(calculations.roiPercentage)}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                  Rental Income
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                  ${formatCurrency(calculations.rentalIncome)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                  Capital Gain
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                  ${formatCurrency(calculations.capitalAppreciation)}
                </Text>
              </View>
            </View>
          </View>

          {onInvest && (
            <TouchableOpacity
              onPress={handleInvest}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                Invest ${formatCurrency(investmentAmount)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 300,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
              Edit Value
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                marginBottom: 16,
                color: colors.textPrimary,
                backgroundColor: colors.background,
              }}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="Enter value"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={saveEdit}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEdit}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}