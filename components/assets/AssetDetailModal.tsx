import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { usePortfolio } from '@/services/usePortfolio';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ASSETS_CONSTANTS } from './constants';
import { getModalStats } from './utils';
import { SimpleLineGraph, LineGraphDataPoint } from '@/components/portfolio/SimpleLineGraph';
import { CustomModal } from '@/components/common/CustomModal';
import EmeraldLoader from '@/components/EmeraldLoader';

const { SCREEN_WIDTH, SCREEN_HEIGHT } = ASSETS_CONSTANTS;

// Token price trend data (sample data - can be replaced with real data)
const tokenPriceData: LineGraphDataPoint[] = [
  { date: new Date('2025-01-01'), value: 10 },
  { date: new Date('2025-01-02'), value: 18 },
  { date: new Date('2025-01-03'), value: 14 },
  { date: new Date('2025-01-04'), value: 22 },
  { date: new Date('2025-01-05'), value: 19 },
];

// Types
export interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  changeColor: string;
  icon: string;
}

interface AssetDetailModalProps {
  visible: boolean;
  investment: any;
  colors: any;
  isDarkColorScheme: boolean;
  selectedRange: string;
  onClose: () => void;
  onShare: () => void;
  onRangeChange: (range: string) => void;
}

// Sub-components
interface EnhancedModalStatCardProps {
  stat: StatCard;
  colors: any;
  isDarkColorScheme: boolean;
}

function EnhancedModalStatCard({ stat, colors, isDarkColorScheme }: EnhancedModalStatCardProps) {
  const getArrowIcon = () => {
    if (stat.changeType === 'up') return 'arrow-up';
    if (stat.changeType === 'down') return 'arrow-down';
    return 'remove';
  };

  return (
    <View 
      style={{
        backgroundColor: colors.card,
        width: (SCREEN_WIDTH - 56) / 2,
        borderColor: colors.border,
        borderWidth: 1,
      }}
      className="rounded-xl p-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-9 h-9 items-center justify-center">
          <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
        </View>
        {stat.changeType !== 'neutral' && (
          <View 
            style={{ 
              backgroundColor: stat.changeType === 'up' 
                ? 'rgba(22, 163, 74, 0.1)' 
                : 'rgba(220, 38, 38, 0.1)' 
            }}
            className="px-2 py-0.5 rounded-full flex-row items-center gap-0.5"
          >
            <Ionicons name={getArrowIcon()} size={12} color={stat.changeColor} />
            <Text style={{ color: stat.changeColor }} className="text-xs font-semibold">
              {stat.change}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
        {stat.label}
      </Text>
      <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
        {stat.value}
      </Text>
      {stat.changeType === 'neutral' && (
        <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
          {stat.change}
        </Text>
      )}
    </View>
  );
}

interface ModalDetailRowProps {
  label: string;
  value: string;
  icon: string;
  colors: any;
  highlight?: boolean;
  capitalize?: boolean;
}

function ModalDetailRow({ label, value, icon, colors, highlight, capitalize }: ModalDetailRowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View className="w-9 h-9 items-center justify-center">
          <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
          {label}
        </Text>
      </View>
      <Text 
        style={{ color: highlight ? colors.primary : colors.textPrimary }} 
        className={`text-base font-bold ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </Text>
    </View>
  );
}

interface ModalUpdateCardProps {
  news: {
    id: string;
    icon: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
  };
  colors: any;
}

function ModalUpdateCard({ news, colors }: ModalUpdateCardProps) {
  return (
    <TouchableOpacity 
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }}
      className="flex-row gap-3.5 rounded-xl p-4"
      activeOpacity={0.7}
    >
      <View className="w-11 h-11 items-center justify-center flex-shrink-0">
        <Ionicons name={news.icon as any} size={22} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text style={{ color: colors.textPrimary }} className="font-bold text-base mb-1">
          {news.title}
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-2" numberOfLines={2}>
          {news.description}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted }} className="text-xs">
            {news.time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Main Modal Component
export function AssetDetailModal({
  visible,
  investment,
  colors,
  isDarkColorScheme,
  selectedRange,
  onClose,
  onShare,
  onRangeChange,
}: AssetDetailModalProps) {
  // All hooks must be called before any conditional returns
  const router = useRouter();
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const { investments } = usePortfolio();

    
  
  // Early return after all hooks
  if (!visible || !investment) return null;

  const property = investment.property;
  const token = investment.propertyToken;
  const tokenColor = token?.color || colors.primary;
  const tokenName = token?.name || 'Standard Token';
  const tokenROI = token?.expectedROI || investment.roi;
  const tokenTotalTokens = token?.totalTokens || property.totalTokens;
  const modalStats = getModalStats(investment, colors, token);
  const newsData = property?.updates?.slice(0, 3).map((update: { title: string; type: string; description: string; date: string }) => ({
    id: update.title,
    icon: update.type === 'financial' ? 'cash-outline' : update.type === 'project' ? 'construct-outline' : 'people-outline',
    iconBg: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
    title: update.title,
    description: update.description,
    time: update.date,
  })) || [];
  const timeRanges = ASSETS_CONSTANTS.TIME_RANGES;
  
  // Get certificate path from investment (single certificate per property)
  const certificatePath = investment.certificatePath || null;
  
  if (certificatePath) {
    console.log(`[AssetDetailModal] Found certificate for property ${investment.property.id}: ${certificatePath}`);
  } else {
    console.log(`[AssetDetailModal] No certificate found for property ${investment.property.id}`);
  }
  
  
  // Handle PDF download/viewing
  const handleDownloadPDF = async (certificateUrl: string) => {
    try {
      setDownloadingDoc(certificateUrl);
      
      // Add cache-busting parameter to ensure we get the latest certificate
      // This is important because the certificate path is fixed and overwrites on update
      // The backend regenerates the certificate when tokens change, so we need to bypass cache
      const cacheBuster = `?t=${Date.now()}`;
      const urlWithCacheBust = certificateUrl.includes('?') 
        ? `${certificateUrl}&t=${Date.now()}`
        : `${certificateUrl}${cacheBuster}`;
      
      console.log(`[AssetDetailModal] Opening certificate with cache-busting: ${urlWithCacheBust}`);
      
      // First, try to open with device's default PDF viewer using deep linking
      const canOpen = await Linking.canOpenURL(urlWithCacheBust);
      
      if (canOpen) {
        try {
          // Try to open with OS default PDF viewer
          await Linking.openURL(urlWithCacheBust);
          return; // Successfully opened, exit function
        } catch (openError) {
          console.log('Failed to open with default viewer, trying Google Drive...');
          // Continue to fallback
        }
      }
      
      // Fallback: Use Google Drive viewer
      const encodedUrl = encodeURIComponent(urlWithCacheBust);
      const googleDriveViewerUrl = `https://drive.google.com/viewer?url=${encodedUrl}`;
      
      // Open in WebBrowser which will use Google Drive's viewer
      await WebBrowser.openBrowserAsync(googleDriveViewerUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        enableBarCollapsing: false,
        showTitle: true,
        toolbarColor: colors.primary,
      });
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      Alert.alert(
        'Error',
        'Unable to open the PDF. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingDoc(null);
    }
  };


  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      height={0.82}
      showDragHandle={true}
      enableSwipeToClose={true}
      enableBackdropPress={true}
      isDarkColorScheme={isDarkColorScheme}
      colors={colors}
      onScroll={(event) => {
        // Handle scroll if needed
      }}
    >
            <View className="px-5 pt-4 pb-6">
              {/* Hero Section */}
              <View className="rounded-2xl overflow-hidden mb-4 shadow-lg">
                <Image
                  source={{ uri: property.images[0] || property.image }}
                  style={{ width: '100%', height: 240 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                  className="absolute bottom-0 left-0 right-0 p-4"
                >
                  <Text style={{ color: '#fff' }} className="text-2xl font-bold mb-1">
                    {property.title}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location" size={16} color="#fff" />
                    <Text style={{ color: '#fff' }} className="text-sm">
                      {property.location}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Status and Actions Row */}
              <View className="flex-row items-center justify-between mb-6">
                <View
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(22, 163, 74, 0.15)' 
                      : 'rgba(22, 163, 74, 0.1)',
                    borderColor: colors.primary,
                  }}
                  className="px-3.5 py-2 rounded-full border flex-row items-center gap-1.5"
                >
                  <View 
                    style={{ backgroundColor: colors.primary }}
                    className="w-2 h-2 rounded-full"
                  />
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    Active
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={onShare}
                  style={{ backgroundColor: colors.muted }}
                  className="px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                  <Ionicons name="share-social" size={16} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                    Share
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Key Metrics Cards */}
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                  Performance
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {modalStats.map((stat, index) => (
                    <View {...({ key: index } as any)}>
                      <EnhancedModalStatCard 
                        stat={stat} 
                        colors={colors} 
                        isDarkColorScheme={isDarkColorScheme}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Token Price Trend */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 16,
                  }}
                >
                  Token Price Trend
                </Text>
                <SimpleLineGraph 
                  data={tokenPriceData}
                  lineColor={colors.primary}
                  gradientColor={colors.primary}
                />
              </View>

              {/* Investment Details Card */}
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                  Investment Details
                </Text>
                <View 
                  style={{ backgroundColor: colors.card }}
                  className="rounded-2xl p-4 gap-4"
                >
                  <ModalDetailRow 
                    label="Ownership Share"
                    value={`${((investment.tokens / property.totalTokens) * 100).toFixed(3)}%`}
                    icon="pie-chart"
                    colors={colors}
                    highlight
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
                    label="Tokens Owned"
                    value={investment.tokens.toFixed(3)}
                    icon="cube"
                    colors={colors}
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
                    label="Property Status"
                    value={property.status.replace('-', ' ')}
                    icon="checkmark-circle"
                    colors={colors}
                    capitalize
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
                    label="Annual Return (Est.)"
                    value={`$${(investment.monthlyRentalIncome * 12).toFixed(2)}`}
                    icon="trending-up"
                    colors={colors}
                    highlight
                  />
                </View>
              </View>

              {/* Payout History */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                    Payout History
                  </Text>
                  <View 
                    style={{ backgroundColor: colors.card }}
                    className="flex-row rounded-full p-1"
                  >
                    {timeRanges.map((range) => (
                      <TouchableOpacity
                        key={range}
                        onPress={() => onRangeChange(range)}
                        style={{ 
                          backgroundColor: selectedRange === range ? colors.primary : 'transparent',
                        }}
                        className="px-3 py-1.5 rounded-full"
                      >
                        <Text
                          style={{ 
                            color: selectedRange === range 
                              ? colors.primaryForeground 
                              : colors.textSecondary,
                          }}
                          className="text-xs font-semibold"
                        >
                          {range}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Chart Placeholder */}
                <View 
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    height: 200,
                  }}
                  className="rounded-2xl p-6 items-center justify-center"
                >
                  <Ionicons name="bar-chart" size={56} color={colors.textMuted} />
                  <Text style={{ color: colors.textPrimary }} className="mt-3 text-base font-semibold">
                    Payout Visualization
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="mt-1 text-sm">
                    {selectedRange} period data
                  </Text>
                </View>
              </View>

              {/* Latest Updates */}
              {newsData.length > 0 && (
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                    Latest Updates
                  </Text>
                  <View className="gap-3">
                    {newsData.map((news: { id: string; icon: string; iconBg: string; title: string; description: string; time: string }) => (
                      <View {...({ key: news.id } as any)}>
                        <ModalUpdateCard 
                          news={news} 
                          colors={colors}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Ownership Documents Section */}
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                  Ownership Documents
                </Text>
                <View 
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="rounded-2xl p-4"
                >
                  {certificatePath ? (
                    <View
                      style={{
                        backgroundColor: isDarkColorScheme 
                          ? 'rgba(22, 163, 74, 0.1)' 
                          : 'rgba(22, 163, 74, 0.05)',
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                      className="rounded-xl p-4"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View
                            style={{
                              backgroundColor: isDarkColorScheme
                                ? 'rgba(22, 163, 74, 0.2)'
                                : 'rgba(22, 163, 74, 0.15)',
                            }}
                            className="w-12 h-12 items-center justify-center rounded-xl"
                          >
                            <Ionicons name="document-text" size={24} color={colors.primary} />
                          </View>
                          <View className="flex-1">
                            <Text style={{ color: colors.textPrimary }} className="font-bold text-base">
                              Ownership Certificate
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">
                              Total Tokens: {investment.tokens.toFixed(3)}
                              {token && (
                                <>
                                  {'\n'}
                                  Token Type: {tokenName} ({token.tokenSymbol})
                                  {'\n'}
                                  Token ROI: {tokenROI}%
                                </>
                              )}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            backgroundColor: isDarkColorScheme
                              ? 'rgba(22, 163, 74, 0.2)'
                              : 'rgba(22, 163, 74, 0.1)',
                          }}
                          className="px-3 py-1.5 rounded-full"
                        >
                          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDownloadPDF(certificatePath)}
                        disabled={downloadingDoc === certificatePath}
                        style={{
                          backgroundColor: downloadingDoc === certificatePath 
                            ? colors.muted 
                            : colors.primary,
                          paddingVertical: 12,
                          borderRadius: 12,
                          width: '100%',
                          alignItems: 'center',
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: downloadingDoc === certificatePath ? 0 : 0.3,
                          shadowRadius: 4,
                          elevation: downloadingDoc === certificatePath ? 0 : 3,
                          opacity: downloadingDoc === certificatePath ? 0.6 : 1,
                        }}
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-center gap-2">
                          {downloadingDoc === certificatePath ? (
                            <>
                              <ActivityIndicator size="small" color={colors.primaryForeground} />
                              <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 15 }}>
                                Opening...
                              </Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="download-outline" size={18} color={colors.primaryForeground} />
                              <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 15 }}>
                                View Certificate
                              </Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="py-8 items-center justify-center">
                      <View
                        style={{
                          backgroundColor: isDarkColorScheme
                            ? 'rgba(107, 114, 128, 0.2)'
                            : 'rgba(107, 114, 128, 0.1)',
                        }}
                        className="w-16 h-16 items-center justify-center rounded-full mb-3"
                      >
                        <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
                      </View>
                      <Text style={{ color: colors.textPrimary }} className="font-semibold text-base mb-1">
                        No Documents Available
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
                        Ownership certificates will appear here once your investments are confirmed.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3 pt-2">
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: '/invest/[id]',
                      params: { id: property.id },
                    } as any);
                  }}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-row items-center justify-center gap-2.5 rounded-2xl py-4 shadow-lg"
                >
                  <Ionicons name="add-circle" size={24} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground }} className="text-base font-bold">
                    Increase Investment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: '/property/[id]',
                      params: { id: property.id },
                    } as any);
                  }}
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="flex-row items-center justify-center gap-2.5 rounded-2xl py-4"
                >
                  <Ionicons name="home" size={24} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                    View Property Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View className="h-8" />
    </CustomModal>
  );
}

