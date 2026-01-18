import { useMemo } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { type Theme } from '../../utils/theme';

interface PaginationDotsProps {
  totalSteps: number;
  currentStepIndex: number; // -1 for intro, 0...N for steps
  onDotPress: (index: number) => void;
  style?: ViewStyle;
}

function PaginationDots({
  totalSteps,
  currentStepIndex,
  onDotPress,
  style,
}: PaginationDotsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Adjust currentStepIndex to 0-based index for the dots (intro = 0, steps = 1...N)
  const activeIndex = currentStepIndex + 1;

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => onDotPress(index - 1)}
          style={({ pressed }) => [
            styles.dot,
            index === activeIndex ? styles.activeDot : styles.inactiveDot,
            pressed && styles.pressed,
          ]}
          accessibilityLabel={`Ir para o painel ${index + 1}`}
          accessibilityRole="button"
        />
      ))}
    </View>
  );
}

export default PaginationDots;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingTop: 8,
      paddingBottom: 8, // Increased bottom padding to space out from buttons
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    activeDot: {
      backgroundColor: theme.text.contrast || '#FFFFFF',
      width: 24, // Highlight active dot by making it wider
    },
    inactiveDot: {
      backgroundColor: theme.text.secondary || '#666666',
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 1.1 }],
    },
  });
