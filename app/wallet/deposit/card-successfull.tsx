import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Clipboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { useWallet } from "@/services/useWallet";
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get("window");

export default function DepositConfirmationLight() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { transactions } = useWallet();
  const { 
    amount, 
    method, 
    cardLast4,
    returnTo,
    returnPropertyId,
    returnTokenCount,
    returnTotalAmount,
    returnTransactionFee,
    returnTotalInvestment,
  } = useLocalSearchParams<{
    amount?: string;
    method?: string;
    cardLast4?: string;
    returnTo?: string;
    returnPropertyId?: string;
    returnTokenCount?: string;
    returnTotalAmount?: string;
    returnTransactionFee?: string;
    returnTotalInvestment?: string;
  }>();

  // Get the latest deposit transaction
  const latestDeposit = useMemo(() => {
    const depositTransactions = transactions.filter(tx => tx.type === 'deposit');
    return depositTransactions.length > 0 ? depositTransactions[0] : null;
  }, [transactions]);

  // Use params if available, otherwise fall back to latest transaction
  const depositAmount = amount ? parseFloat(amount) : (latestDeposit?.amount || 0);
  const depositMethod = method || latestDeposit?.description?.replace('Deposit via ', '') || 'Debit Card';
  const transactionId = latestDeposit?.id || `tx-${Date.now()}`;
  const depositDate = latestDeposit?.date ? new Date(latestDeposit.date) : new Date();

  // Format date and time
  const formattedDate = depositDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = depositDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Format card number display
  const getMethodDisplay = () => {
    if (depositMethod === 'Debit Card' && cardLast4) {
      return `Debit Card **** ${cardLast4}`;
    }
    return depositMethod;
  };

  const handleCopyTransactionId = () => {
    Clipboard.setString(transactionId);
    Alert.alert('Copied!', 'Transaction ID copied to clipboard');
  };

  // Truncate transaction ID if too long (max 10 characters + ...)
  const displayTransactionId = transactionId.length > 10 
    ? `${transactionId.substring(0, 10)}...` 
    : transactionId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')}>
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: 'bold',
          letterSpacing: -0.5,
          paddingRight: 32,
        }}>
          Confirmation
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        {/* Check Icon */}
        <View style={{ alignItems: 'center'}}>
          {/* <Ionicons name="checkmark" size={32} color={colors.primaryForeground} /> */}
          <LottieView
            source={require("@/assets/Checked.json")}
            autoPlay
            loop={false}
            style={{ width: 220, height: 220,marginBottom: -20 }}
          />
        </View>

        {/* Title & Description */}
        <Text style={{
          color: colors.primary,
          fontSize: 30,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 36,
        }}>
          Deposit Confirmed!
        </Text>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 8,
        }}>
          Your funds of ${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} are now available.
        </Text>

        {/* Info Card */}
        <View style={{
          marginTop: 32,
          width: '100%',
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 24,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <InfoRow 
            label="Amount Deposited" 
            value={`$${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`} 
            bold 
            colors={colors} 
          />
          <Divider colors={colors} />
          <InfoRow
            label="Deposit Method"
            value={getMethodDisplay()}
            bold={false}
            colors={colors}
          />
          <Divider colors={colors} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Transaction ID</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{displayTransactionId}</Text>
              <TouchableOpacity onPress={handleCopyTransactionId}>
                <Ionicons name="copy-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <Divider colors={colors} />
          <InfoRow
            label="Date & Time"
            value={`${formattedDate}, ${formattedTime}`}
            bold={false}
            colors={colors}
          />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      }}>
        <View style={{ maxWidth: 448, width: '100%', alignSelf: 'center', alignItems: 'center', gap: 12 }}>
          {/* If returnTo exists, show "Continue Investment" button, otherwise show default buttons */}
          {returnTo && returnPropertyId ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  // Navigate back to investment screen with all the preserved params
                  router.replace({
                    pathname: returnTo as any,
                    params: {
                      id: returnPropertyId,
                      tokenCount: returnTokenCount || '',
                      totalAmount: returnTotalAmount || '',
                      transactionFee: returnTransactionFee || '',
                      totalInvestment: returnTotalInvestment || '',
                    },
                  } as any);
                }}
                style={{ width: '100%', borderRadius: 9999, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primarySoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 9999 }}
                >
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>
                      Continue Investment
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/wallet')}
                style={{
                  width: '100%',
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                  View Wallet
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/wallet')}
                style={{ width: '100%', borderRadius: 9999, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primarySoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 9999 }}
                >
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>
                      View Wallet
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/home')}
                style={{
                  width: '100%',
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                  Return to Home
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>

  );
}

function InfoRow({
  label,
  value,
  bold,
  colors,
}: {
  label: string;
  value: string;
  bold?: boolean;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
      <Text style={{ color: colors.textMuted, fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          textAlign: 'right',
          color: bold ? colors.textPrimary : colors.textSecondary,
          fontWeight: bold ? 'bold' : 'normal',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}