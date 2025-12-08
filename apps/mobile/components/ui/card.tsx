import * as React from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<View, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </View>
    );
  }
);
Card.displayName = 'Card';

interface CardHeaderProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader = React.forwardRef<View, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-4', className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);
CardHeader.displayName = 'CardHeader';

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

const CardTitle = React.forwardRef<Text, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-card-foreground',
          className
        )}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const CardDescription = React.forwardRef<Text, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
CardDescription.displayName = 'CardDescription';

interface CardContentProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

const CardContent = React.forwardRef<View, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View ref={ref} className={cn('p-4 pt-0', className)} {...props}>
        {children}
      </View>
    );
  }
);
CardContent.displayName = 'CardContent';

interface CardFooterProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

const CardFooter = React.forwardRef<View, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('flex flex-row items-center p-4 pt-0', className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps };
