import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, fontSize } from '../styles/theme'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [form, setForm]     = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!form.identifier || !form.password) { Alert.alert('Error', 'Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(form.identifier, form.password)
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🎵</Text>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to continue your musical journey</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Email or Student ID</Text>
          <TextInput style={s.input} placeholder="you@example.com or BTM-2024-0001"
            placeholderTextColor={colors.textMuted} value={form.identifier}
            onChangeText={v => setForm({...form, identifier: v})}
            autoCapitalize="none" keyboardType="email-address" />

          <Text style={[s.label, { marginTop: spacing.md }]}>Password</Text>
          <TextInput style={s.input} placeholder="••••••••"
            placeholderTextColor={colors.textMuted} value={form.password}
            onChangeText={v => setForm({...form, password: v})}
            secureTextEntry />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.linkRow}>
            <Text style={s.linkText}>Don't have an account? </Text>
            <Text style={s.link}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header:    { alignItems: 'center', marginBottom: spacing.xl },
  logo:      { fontSize: 56, marginBottom: spacing.sm },
  title:     { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle:  { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  form:      { marginTop: spacing.lg },
  label:     { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  input:     { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  btn:       { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  btnDisabled:{ opacity: 0.6 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  linkRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  linkText:  { color: colors.textSecondary, fontSize: fontSize.sm },
  link:      { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
})
