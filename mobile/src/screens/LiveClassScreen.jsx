import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native'
import api from '../services/api'
import { colors, spacing, radius, fontSize } from '../styles/theme'
import { format } from 'date-fns'

export default function LiveClassScreen() {
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [regId, setRegId]       = useState(null)

  useEffect(() => {
    api.get('/live-classes?upcoming=1').then(r => setClasses(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  const register = async (cls) => {
    setRegId(cls.id)
    try {
      await api.post(`/live-classes/${cls.id}/register`)
      Alert.alert('Registered!', `You're registered for: ${cls.title}`)
      setClasses(cs => cs.map(c => c.id === cls.id ? { ...c, is_registered: true, registered_count: c.registered_count+1 } : c))
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed')
    } finally {
      setRegId(null)
    }
  }

  const joinClass = (url) => {
    if (url) Linking.openURL(url)
  }

  const PLATFORM_ICON = { zoom:'📹', google_meet:'📲', teams:'💼', custom:'🔗' }

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.platformIcon}>{PLATFORM_ICON[item.platform] || '📡'}</Text>
        <View style={[s.statusBadge, { backgroundColor: item.status === 'live' ? '#7f1d1d' : '#1e3a5f' }]}>
          <Text style={[s.statusText, { color: item.status === 'live' ? '#fca5a5' : '#93c5fd' }]}>
            {item.status === 'live' ? '🔴 LIVE' : item.status}
          </Text>
        </View>
      </View>
      <Text style={s.title}>{item.title}</Text>
      {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
      <View style={s.metaContainer}>
        <Text style={s.meta}>👨‍🏫 {item.instructor}</Text>
        <Text style={s.meta}>🗓 {format(new Date(item.scheduled_at), 'MMM d, yyyy · h:mm a')}</Text>
        <Text style={s.meta}>⏱ {item.duration_mins} minutes</Text>
        <Text style={s.meta}>👥 {item.registered_count} registered{item.max_attendees ? ` / ${item.max_attendees}` : ''}</Text>
      </View>
      {item.is_registered
        ? item.meeting_url
          ? <TouchableOpacity style={s.joinBtn} onPress={() => joinClass(item.meeting_url)}>
              <Text style={s.joinBtnText}>Join {item.platform?.replace('_',' ')} →</Text>
            </TouchableOpacity>
          : <View style={s.regBadge}><Text style={s.regBadgeText}>✓ Registered – Link pending</Text></View>
        : <TouchableOpacity style={[s.regBtn, regId===item.id && s.regBtnDisabled]}
            onPress={() => register(item)} disabled={regId===item.id}>
            <Text style={s.regBtnText}>{regId===item.id ? 'Registering...' : 'Register for Class'}</Text>
          </TouchableOpacity>
      }
    </View>
  )

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <FlatList
      style={s.container}
      data={classes}
      keyExtractor={i => String(i.id)}
      renderItem={renderItem}
      contentContainerStyle={[{ padding: spacing.md }, classes.length === 0 && s.emptyContainer]}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📡</Text>
          <Text style={s.emptyTitle}>No upcoming live classes</Text>
          <Text style={s.emptyText}>Check back soon for new sessions</Text>
        </View>
      }
    />
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: colors.bg },
  center:         { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bg },
  card:           { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth:1, borderColor: colors.cardBorder },
  cardHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: spacing.sm },
  platformIcon:   { fontSize:28 },
  statusBadge:    { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical:3 },
  statusText:     { fontSize: fontSize.xs, fontWeight:'700', textTransform:'uppercase' },
  title:          { color: colors.text, fontWeight:'700', fontSize: fontSize.lg, marginBottom: spacing.xs },
  desc:           { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight:18, marginBottom: spacing.sm },
  metaContainer:  { gap:4, marginBottom: spacing.md },
  meta:           { color: colors.textMuted, fontSize: fontSize.sm },
  joinBtn:        { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems:'center' },
  joinBtnText:    { color:'#fff', fontWeight:'700', fontSize: fontSize.md },
  regBtn:         { borderWidth:1, borderColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems:'center' },
  regBtnDisabled: { opacity:0.6 },
  regBtnText:     { color: colors.primary, fontWeight:'700', fontSize: fontSize.md },
  regBadge:       { backgroundColor:'#14532d', borderRadius: radius.sm, padding: spacing.sm, alignItems:'center' },
  regBadgeText:   { color:'#4ade80', fontWeight:'600', fontSize: fontSize.sm },
  emptyContainer: { flexGrow:1, justifyContent:'center' },
  empty:          { alignItems:'center', padding: spacing.xl },
  emptyIcon:      { fontSize:52, marginBottom: spacing.md },
  emptyTitle:     { color: colors.text, fontSize: fontSize.lg, fontWeight:'700' },
  emptyText:      { color: colors.textSecondary, fontSize: fontSize.md, marginTop:4, textAlign:'center' },
})
