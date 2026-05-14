import { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { colors, spacing, radius, fontSize } from '../styles/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (form.password && form.password !== form.confirm) { Alert.alert('Error', 'Passwords do not match'); return }
    if (form.password && form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return }
    setSaving(true)
    const payload = { full_name: form.full_name, phone: form.phone }
    if (form.password) payload.password = form.password
    try {
      await api.put('/students/profile', payload)
      Alert.alert('Success', 'Profile updated!')
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text:'Cancel', style:'cancel' },
      { text:'Sign Out', style:'destructive', onPress: logout },
    ])
  }

  const F = ({ label, ...props }) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  )

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text></View>
        <Text style={s.name}>{user?.full_name}</Text>
        <Text style={s.studentId}>{user?.student_id}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      {/* Edit form */}
      <View style={s.form}>
        <Text style={s.sectionTitle}>Edit Profile</Text>
        <F label="Full Name" value={form.full_name} onChangeText={v=>setForm({...form,full_name:v})} />
        <F label="Phone Number" value={form.phone} onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad" />

        <Text style={[s.sectionTitle, { marginTop: spacing.md }]}>Change Password</Text>
        <Text style={s.hint}>Leave blank to keep current password</Text>
        <F label="New Password" value={form.password} onChangeText={v=>setForm({...form,password:v})} secureTextEntry placeholder="Min. 8 characters" />
        <F label="Confirm Password" value={form.confirm} onChangeText={v=>setForm({...form,confirm:v})} secureTextEntry placeholder="Repeat password" />

        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: colors.bg },
  avatarSection:  { alignItems:'center', backgroundColor: colors.surface, padding: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  avatar:         { width:80, height:80, borderRadius:40, backgroundColor: colors.primaryDark, alignItems:'center', justifyContent:'center', marginBottom: spacing.sm },
  avatarText:     { color:'#fff', fontSize: fontSize.xxxl, fontWeight:'800' },
  name:           { color: colors.text, fontSize: fontSize.xl, fontWeight:'700' },
  studentId:      { color: colors.primary, fontSize: fontSize.sm, fontFamily:'monospace', marginTop:2 },
  email:          { color: colors.textSecondary, fontSize: fontSize.sm, marginTop:2 },
  form:           { padding: spacing.lg },
  sectionTitle:   { fontSize: fontSize.lg, fontWeight:'700', color: colors.text, marginBottom: spacing.sm },
  hint:           { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md, marginTop:-spacing.xs },
  label:          { fontSize: fontSize.sm, fontWeight:'600', color: colors.textSecondary, marginBottom:4 },
  input:          { backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  saveBtn:        { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md+2, alignItems:'center', marginTop: spacing.sm },
  saveBtnDisabled:{ opacity:0.6 },
  saveBtnText:    { color:'#fff', fontWeight:'700', fontSize: fontSize.md },
  logoutBtn:      { borderWidth:1, borderColor:'#ef4444', borderRadius: radius.md, padding: spacing.md, alignItems:'center', marginTop: spacing.md, marginBottom: spacing.xl },
  logoutText:     { color:'#ef4444', fontWeight:'700', fontSize: fontSize.md },
})
