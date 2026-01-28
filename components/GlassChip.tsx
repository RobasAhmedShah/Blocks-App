import { BlurView } from "expo-blur";
import { Text, View } from "react-native";

// Glass Chip Component
export const GlassChip = ({
    text,
    accent = false,
  }: {
    text: string;
    accent?: boolean;
  }) => {
    return (
      <View
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: accent
            ? 'rgba(158, 220, 90, 0.45)'
            : 'rgba(255,255,255,0.18)',
          shadowColor: accent ? '#9EDC5A' : '#000',
          shadowOpacity: accent ? 0.35 : 0.15,
          shadowRadius: accent ? 10 : 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <BlurView
          intensity={accent ? 40 : 28}
          tint="dark"
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            backgroundColor: accent
              ? 'rgba(158, 220, 90, 0.18)'
              : 'rgba(255,255,255,0.10)',
          }}
        >
          {/* subtle top highlight */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.35)',
            }}
          />
  
          <Text
            style={{
              color: accent ? '#9EDC5A' : 'rgba(255,255,255,0.92)',
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}
          >
            {text}
          </Text>
        </BlurView>
      </View>
    );
  };
  