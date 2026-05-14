import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, fontSize } from '../styles/theme'

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', password:'', confirm:'' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password) { Alert.alert('Error', 'Please fill required fields'); return }
    if (form.password !== form.confirm)                   { Alert.alert('Error', 'Passwords do not match'); return }
    if (form.password.length < 8)                         { Alert.alert('Error', 'Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const user = await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password })
      Alert.alert('Welcome!', `Your Student ID: ${user.student_id}`)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) Alert.alert('Error', Object.values(errors).join('\n'))
      else Alert.alert('Error', err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const F = ({ label, ...props }) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  )

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join thousands of music learners</Text>

        <View style={{ marginTop: spacing.xl }}>
          <F label="Full Name *"    placeholder="John Doe"             value={form.full_name} onChangeText={v=>setForm({...form,full_name:v})} />
          <F label="Email *"        placeholder="you@example.com"      value={form.email}     onChangeText={v=>setForm({...form,email:v})} keyboardType="email-address" autoCapitalize="none" />
          <F label="Phone"          placeholder="+1 234 567 8900"       value={form.phone}     onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad" />
          <F label="Password *"     placeholder="Min. 8 characters"    value={form.password}  onChangeText={v=>setForm({...form,password:v})} secureTextEntry />
          <F label="Confirm Password *" placeholder="Repeat password"  value={form.confirm}   onChangeText={v=>setForm({...form,confirm:v})} secureTextEntry />
        </View>

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.linkRow}>
          <Text style={s.linkText}>Already have an account? </Text>
          <Text style={s.link}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor: colors.bg },
  scroll:     { flexGrow:1, padding: spacing.lg },
  title:      { fontSize: fontSize.xxl, fontWeight:'800', color: colors.text, marginTop: spacing.lg },
  subtitle:   { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  label:      { fontSize: fontSize.sm, fontWeight:'600', color: colors.textSecondary, marginBottom: 4 },
  input:      { backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  btn:        { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md+2, alignItems:'center', marginTop: spacing.sm },
  btnDisabled:{ opacity:0.6 },
  btnText:    { color:'#fff', fontWeight:'700', fontSize: fontSize.md },
  linkRow:    { flexDirection:'row', justifyContent:'center', marginTop: spacing.lg, paddingBottom: spacing.lg },
  linkText:   { color: colors.textSecondary, fontSize: fontSize.sm },
  link:       { color: colors.primary, fontWeight:'600', fontSize: fontSize.sm },
})
