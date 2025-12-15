import { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();

  // Clear error when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = await login(email.trim(), password);

    if (success) {
      router.replace('/(tabs)/planner');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 items-center justify-center bg-background p-4"
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <View className="items-center mb-4">
            <Text className="text-3xl font-bold text-primary">YAHATL</Text>
            <Text className="text-sm text-muted-foreground">
              Yet Another Home Assistant Todo List
            </Text>
          </View>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            onSubmitEditing={handleLogin}
          />

          {error && (
            <Text className="text-sm text-destructive">{error}</Text>
          )}

          <Button
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <View className="flex-row items-center justify-center gap-1 mt-4">
            <Text className="text-sm text-muted-foreground">
              Don't have an account?
            </Text>
            <Text
              className="text-sm text-primary font-medium"
              onPress={() => console.log('Navigate to register')}
            >
              Sign Up
            </Text>
          </View>
        </CardContent>
      </Card>
    </KeyboardAvoidingView>
  );
}

