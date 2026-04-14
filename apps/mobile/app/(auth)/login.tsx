import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAccount } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const session = await loginAccount({
        email: email.trim(),
        password,
      });
      setSession(session);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-film-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-film-chalk">Welcome back</Text>
        <Text className="mt-2 text-film-chalk/70">
          Sign in with the email you used to register.
        </Text>

        <View className="mt-8 gap-4">
          <View>
            <Text className="mb-1 text-sm text-film-chalk/80">Email</Text>
            <TextInput
              className="rounded-lg border border-white/15 bg-film-field/40 px-3 py-3 text-film-chalk"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="rgba(240,237,230,0.35)"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View>
            <Text className="mb-1 text-sm text-film-chalk/80">Password</Text>
            <TextInput
              className="rounded-lg border border-white/15 bg-film-field/40 px-3 py-3 text-film-chalk"
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="rgba(240,237,230,0.35)"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {error ? (
          <Text className="mt-4 text-sm text-red-400">{error}</Text>
        ) : null}

        <Pressable
          className="mt-8 items-center rounded-xl bg-film-orange py-4 active:opacity-90"
          disabled={loading}
          onPress={onSubmit}>
          {loading ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Text className="text-base font-semibold text-film-bg">Sign in</Text>
          )}
        </Pressable>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-film-chalk/70">New here?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="font-semibold text-film-gold">Create an account</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
