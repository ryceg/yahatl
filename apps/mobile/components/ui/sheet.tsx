import * as React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  type ModalProps,
  type ViewStyle,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { cn } from '@/lib/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SheetProps extends Omit<ModalProps, 'children'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Sheet = React.forwardRef<View, SheetProps>(
  ({ open, onOpenChange, children, className, ...props }, ref) => {
    const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    React.useEffect(() => {
      if (open) {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      } else {
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    }, [open, translateY]);

    return (
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
        {...props}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => onOpenChange(false)}
          />
          <Animated.View
            ref={ref}
            style={{ transform: [{ translateY }] }}
            className={cn(
              'absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background',
              className
            )}
          >
            <View className="mx-auto mt-3 h-1 w-12 rounded-full bg-muted" />
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);
Sheet.displayName = 'Sheet';

interface SheetHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({ className, children }) => {
  return (
    <View className={cn('flex flex-col space-y-1.5 px-4 pt-4', className)}>
      {children}
    </View>
  );
};
SheetHeader.displayName = 'SheetHeader';

interface SheetTitleProps {
  className?: string;
  children: React.ReactNode;
}

const SheetTitle: React.FC<SheetTitleProps> = ({ className, children }) => {
  return (
    <Text
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-foreground',
        className
      )}
    >
      {children}
    </Text>
  );
};
SheetTitle.displayName = 'SheetTitle';

interface SheetDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const SheetDescription: React.FC<SheetDescriptionProps> = ({ className, children }) => {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </Text>
  );
};
SheetDescription.displayName = 'SheetDescription';

interface SheetContentProps {
  className?: string;
  children: React.ReactNode;
}

const SheetContent: React.FC<SheetContentProps> = ({ className, children }) => {
  return (
    <View className={cn('flex-1 px-4 py-4', className)}>
      {children}
    </View>
  );
};
SheetContent.displayName = 'SheetContent';

interface SheetFooterProps {
  className?: string;
  children: React.ReactNode;
}

const SheetFooter: React.FC<SheetFooterProps> = ({ className, children }) => {
  return (
    <View
      className={cn('flex flex-row gap-2 px-4 pb-8 pt-2', className)}
    >
      {children}
    </View>
  );
};
SheetFooter.displayName = 'SheetFooter';

export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter };
export type { SheetProps, SheetHeaderProps, SheetTitleProps, SheetDescriptionProps, SheetContentProps, SheetFooterProps };
