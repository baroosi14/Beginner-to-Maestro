import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { colors, spacing, radius, fontSize } from '../styles/theme'
import { format } from 'date-fns'

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Welcome */}
      <View style={s.hero}>
        <Text style={s.greeting}>Hello, {user?.full_name?.split(' ')[0]} 👋</Text>
        <Text style={s.studentId}>{user?.student_id}</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label:'Enrolled',   value: data?.stats?.total_enrolled    || 0, icon:'📚' },
          { label:'Completed',  value: data?.stats?.completed_courses  || 0, icon:'🏆' },
          { label:'Upcoming',   value: data?.upcoming_classes?.length  || 0, icon:'📡' },
          { label:'Notifications', value: data?.unread_notifications   || 0, icon:'🔔' },
        ].map(s2 => (
          <View key={s2.label} style={s.statCard}>
            <Text style={s.statIcon}>{s2.icon}</Text>
            <Text style={s.statValue}>{s2.value}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
          </View>
        ))}
      </View>

      {/* My Courses */}
      <View style={s.section}>
        <View style={s.secHeader}>
          <Text style={s.secTitle}>My Courses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}><Text style={s.secLink}>Browse more</Text></TouchableOpacity>
        </View>
        {data?.enrolled_courses?.length === 0
          ? <View style={s.empty}>
              <Text style={s.emptyIcon}>🎵</Text>
              <Text style={s.emptyText}>No courses yet. Start learning!</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Courses')}>
                <Text style={s.emptyBtnText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          : data?.enrolled_courses?.map(c => (
              <TouchableOpacity key={c.id} style={s.courseRow} onPress={() => navigation.navigate('CourseDetail', { course: c })}>
                <View style={s.courseThumb}>
                  {c.thumbnail_url ? <Image source={{ uri: c.thumbnail_url }} style={s.thumbImg} /> : <Text style={{ fontSize:24 }}>🎵</Text>}
                </View>
                <View style={s.courseInfo}>
                  <Text style={s.courseTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={s.courseCat}>{c.category}</Text>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${c.progress_pct}%` }]} />
                  </View>
                  <Text style={s.progressText}>{c.progress_pct}% complete</Text>
                </View>
              </TouchableOpacity>
            ))
        }
      </View>

      {/* Upcoming classes */}
      {data?.upcoming_classes?.length > 0 && (
        <View style={s.section}>
          <Text style={s.secTitle}>Upcoming Live Classes</Text>
          {data.upcoming_classes.map(cls => (
            <View key={cls.id} style={s.classCard}>
              <Text style={s.className}>{cls.title}</Text>
              <Text style={s.classInfo}>{cls.instructor}</Text>
              <Text style={s.classTime}>{format(new Date(cls.scheduled_at), 'MMM d, h:mm a')} · {cls.duration_mins}min</Text>
              {cls.meeting_url && (
                <TouchableOpacity style={s.joinBtn}><Text style={s.joinBtnText}>Join {cls.platform}</Text></TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor: colors.bg },
  center:       { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bg },
  hero:         { backgroundColor: colors.surface, padding: spacing.xl, paddingTop: spacing.lg, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  greeting:     { fontSize: fontSize.xxl, fontWeight:'800', color: colors.text },
  studentId:    { color: colors.primary, fontSize: fontSize.sm, fontFamily:'monospace', marginTop:4 },
  statsRow:     { flexDirection:'row', padding: spacing.md, gap: spacing.sm },
  statCard:     { flex:1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm+2, alignItems:'center', borderWidth:1, borderColor: colors.cardBorder },
  statIcon:     { fontSize:18, marginBottom:2 },
  statValue:    { fontSize: fontSize.xl, fontWeight:'800', color: colors.primary },
  statLabel:    { color: colors.textMuted, fontSize: fontSize.xs, marginTop:1, textAlign:'center' },
  section:      { padding: spacing.lg, paddingTop: spacing.md },
  secHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: spacing.md },
  secTitle:     { fontSize: fontSize.lg, fontWeight:'700', color: colors.text },
  secLink:      { color: colors.primary, fontSize: fontSize.sm, fontWeight:'600' },
  courseRow:    { flexDirection:'row', backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.sm, overflow:'hidden', borderWidth:1, borderColor: colors.cardBorder },
  courseThumb:  { width:72, height:72, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' },
  thumbImg:     { width:'100%', height:'100%' },
  courseInfo:   { flex:1, padding: spacing.sm+4, justifyContent:'center' },
  courseTitle:  { color: colors.text, fontWeight:'600', fontSize: fontSize.sm },
  courseCat:    { color: colors.textMuted, fontSize: fontSize.xs, marginTop:1 },
  progressBar:  { height:3, backgroundColor: colors.cardBorder, borderRadius:2, marginTop: spacing.xs },
  progressFill: { height:'100%', backgroundColor: colors.primary, borderRadius:2 },
  progressText: { color: colors.textMuted, fontSize: fontSize.xs, marginTop:2 },
  empty:        { alignItems:'center', padding: spacing.xl },
  emptyIcon:    { fontSize:40, marginBottom: spacing.sm },
  emptyText:    { color: colors.textSecondary, fontSize: fontSize.md, textAlign:'center' },
  emptyBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.md },
  emptyBtnText: { color:'#fff', fontWeight:'700' },
  classCard:    { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth:1, borderColor: colors.cardBorder },
  className:    { color: colors.text, fontWeight:'600', fontSize: fontSize.md },
  classInfo:    { color: colors.textSecondary, fontSize: fontSize.sm, marginTop:2 },
  classTime:    { color: colors.primary, fontSize: fontSize.xs, marginTop:4 },
  joinBtn:      { backgroundColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm, alignItems:'center', marginTop: spacing.sm },
  joinBtnText:  { color:'#fff', fontWeight:'700', fontSize: fontSize.sm },
})
