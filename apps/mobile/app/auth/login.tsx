import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call API to login when NSwag client is available
      // const { mutate: login } = useLogin();
      // const result = await login({ email, password });
      // authStore.setTokens(result.accessToken, result.refreshToken);

      console.log('Login:', { email, password });

      // Navigate to main app
      router.replace('/(tabs)/planner');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
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
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && (
            <Text className="text-sm text-destructive">{error}</Text>
          )}

          <Button onPress={handleLogin} disabled={isLoading}>
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
