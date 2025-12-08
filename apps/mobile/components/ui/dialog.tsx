import * as React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  type ModalProps,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { cn } from '@/lib/utils';

interface DialogProps extends Omit<ModalProps, 'children'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, ...props }) => {
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, scale, opacity]);

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
          className="flex-1 items-center justify-center bg-black/50 p-4"
          onPress={() => onOpenChange(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{
                transform: [{ scale }],
                opacity,
              }}
              className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            >
              {children}
            </Animated.View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
Dialog.displayName = 'Dialog';

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <View className={cn('flex flex-col space-y-1.5 text-center', className)}>
      {children}
    </View>
  );
};
DialogHeader.displayName = 'DialogHeader';

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
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
DialogTitle.displayName = 'DialogTitle';

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children }) => {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </Text>
  );
};
DialogDescription.displayName = 'DialogDescription';

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  return (
    <View className={cn('py-4', className)}>
      {children}
    </View>
  );
};
DialogContent.displayName = 'DialogContent';

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const DialogFooter: React.FC<DialogFooterProps> = ({ className, children }) => {
  return (
    <View className={cn('flex flex-row gap-2 justify-end pt-4', className)}>
      {children}
    </View>
  );
};
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter };
export type { DialogProps, DialogHeaderProps, DialogTitleProps, DialogDescriptionProps, DialogContentProps, DialogFooterProps };
