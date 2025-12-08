import * as React from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  className?: string;
  containerClassName?: string;
  label?: string;
  error?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, containerClassName, label, error, ...props }, ref) => {
    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text className="mb-2 text-sm font-medium text-foreground">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground',
            'placeholder:text-muted-foreground',
            error && 'border-destructive',
            props.editable === false && 'opacity-50',
            className
          )}
          placeholderTextColor="#71717a"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-destructive">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
