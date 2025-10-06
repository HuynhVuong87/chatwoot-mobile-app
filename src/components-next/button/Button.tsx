import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';

type ButtonProps = {
  isDestructive?: boolean;
  text: string;
  handlePress?: () => void;
  variant?: 'primary' | 'secondary' | 'red';
  disabled?: boolean;
};

const getButtonStyles = (variant: string, pressed: boolean) => {
  const baseStyles = 'py-[11px] flex items-center justify-center rounded-[13px]';
  let variantStyles = 'bg-gray-50';
  let pressedStyles = pressed ? 'bg-gray-100' : '';

  if (variant === 'primary') {
    variantStyles = 'bg-blue-800';
    pressedStyles = 'opacity-95';
  } else if (variant === 'red') {
    variantStyles = 'bg-red-800';
    pressedStyles = 'opacity-95';
  }

  return tailwind.style(baseStyles, variantStyles, pressedStyles);
};

const getTextStyles = (variant: string, isDestructive: boolean) => {
  const baseStyles = 'text-base font-medium tracking-[0.16px] leading-[22px]';
  let colorStyles = 'text-gray-950';

  if (variant === 'primary' || variant === 'red') {
    colorStyles = isDestructive ? 'text-tomato-800' : 'text-white';
  } else {
    colorStyles = isDestructive ? 'text-ruby-800' : 'text-gray-950';
  }

  return tailwind.style(baseStyles, colorStyles);
};

export const Button = ({
  text,
  isDestructive = false,
  handlePress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const haptic = useHaptic(isDestructive ? 'medium' : 'selection');

  const handleButtonPress = useCallback(() => {
    if (!disabled) {
      haptic?.();
      handlePress?.();
    }
  }, [disabled, handlePress, haptic]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handleButtonPress}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => getButtonStyles(variant, pressed)}
        {...handlers}>
        <Animated.Text style={getTextStyles(variant, isDestructive)}>{text}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
};
