import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, fontSize } from '../styles/theme'

export default function CourseDetailScreen({ route, navigation }) {
  const { course: initCourse } = route.params
  const { user } = useAuth()
  const [course, setCourse]     = useState(initCourse)
  const [loading, setLoading]   = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedMods, setExpMods] = useState({})

  useEffect(() => {
    api.get(`/courses/${initCourse.slug}`)
      .then(r => { setCourse(r.data.data); navigation.setOptions({ title: r.data.data.title }) })
      .finally(() => setLoading(false))
  }, [])

  const toggleMod = (id) => setExpMods(s => ({ ...s, [id]: !s[id] }))

  const enrollFree = async () => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to enroll.'); return }
    setEnrolling(true)
    try {
      await api.post(`/courses/${course.slug}/enroll`, {})
      setCourse(c => ({ ...c, is_enrolled: true }))
      Alert.alert('Enrolled!', 'You have been enrolled. Start learning now!')
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>

  const allLessons = course.modules?.flatMap(m => m.lessons) || []

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {course.thumbnail_url && (
        <Image source={{ uri: course.thumbnail_url }} style={s.banner} />
      )}

      <View style={s.body}>
        <View style={s.badges}>
          <View style={s.badge}><Text style={s.badgeText}>{course.level}</Text></View>
          {course.category && <View style={s.badge}><Text style={s.badgeText}>{course.category}</Text></View>}
        </View>
        <Text style={s.title}>{course.title}</Text>
        <Text style={s.desc}>{course.description}</Text>

        <View style={s.metaRow}>
          {course.instructor && <Text style={s.meta}>👨‍🏫 {course.instructor}</Text>}
          <Text style={s.meta}>📚 {allLessons.length} lessons</Text>
          {course.enrollment_count > 0 && <Text style={s.meta}>👥 {course.enrollment_count} students</Text>}
        </View>

        {/* Enroll button */}
        <View style={s.priceBox}>
          <Text style={s.price}>
            {course.is_free || parseFloat(course.price) === 0 ? 'Free' : `$${parseFloat(course.price).toFixed(2)} ${course.currency || 'USD'}`}
          </Text>
          {course.is_enrolled
            ? <TouchableOpacity style={s.btnSecondary} onPress={() => {}}>
                <Text style={s.btnSecText}>✓ Enrolled – Continue</Text>
              </TouchableOpacity>
            : <TouchableOpacity style={[s.btn, enrolling && s.btnDisabled]} onPress={enrollFree} disabled={enrolling}>
                <Text style={s.btnText}>{enrolling ? 'Enrolling...' : course.is_free || parseFloat(course.price) === 0 ? 'Enroll Free' : 'Purchase Course'}</Text>
              </TouchableOpacity>
          }
        </View>

        {/* Curriculum */}
        <Text style={s.sectionTitle}>Curriculum</Text>
        {course.modules?.map(mod => (
          <View key={mod.id} style={s.module}>
            <TouchableOpacity style={s.modHeader} onPress={() => toggleMod(mod.id)}>
              <Text style={s.modTitle}>{mod.title}</Text>
              <Text style={s.modCount}>{mod.lessons?.length} lessons  {expandedMods[mod.id] ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expandedMods[mod.id] && mod.lessons?.map(lesson => (
              <TouchableOpacity key={lesson.id} style={s.lessonRow}
                onPress={() => course.is_enrolled && navigation.navigate('VideoPlayer', { lesson, courseSlug: course.slug })}>
                <Text style={s.lessonIcon}>{lesson.content_type === 'video' ? '▶' : '📄'}</Text>
                <Text style={[s.lessonTitle, !course.is_enrolled && !lesson.is_free_preview && s.lessonLocked]}>
                  {lesson.title}
                </Text>
                {lesson.is_free_preview && <View style={s.previewBadge}><Text style={s.previewText}>Preview</Text></View>}
                {lesson.video_duration && <Text style={s.lessonDur}>{Math.floor(lesson.video_duration/60)}:{String(lesson.video_duration%60).padStart(2,'0')}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor: colors.bg },
  center:      { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bg },
  banner:      { width:'100%', aspectRatio: 16/9 },
  body:        { padding: spacing.lg },
  badges:      { flexDirection:'row', gap: spacing.xs, marginBottom: spacing.sm },
  badge:       { backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText:   { color: colors.textSecondary, fontSize: fontSize.xs, textTransform:'capitalize' },
  title:       { fontSize: fontSize.xxl, fontWeight:'800', color: colors.text, lineHeight:30, marginBottom: spacing.sm },
  desc:        { color: colors.textSecondary, fontSize: fontSize.md, lineHeight:22, marginBottom: spacing.md },
  metaRow:     { gap: spacing.xs, marginBottom: spacing.lg },
  meta:        { color: colors.textMuted, fontSize: fontSize.sm },
  priceBox:    { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl, borderWidth:1, borderColor: colors.cardBorder },
  price:       { fontSize: fontSize.xxxl, fontWeight:'800', color: colors.text, marginBottom: spacing.md },
  btn:         { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md+2, alignItems:'center' },
  btnDisabled: { opacity:0.6 },
  btnText:     { color:'#fff', fontWeight:'700', fontSize: fontSize.md },
  btnSecondary:{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md+2, alignItems:'center', borderWidth:1, borderColor: colors.primary },
  btnSecText:  { color: colors.primary, fontWeight:'700', fontSize: fontSize.md },
  sectionTitle:{ fontSize: fontSize.lg, fontWeight:'700', color: colors.text, marginBottom: spacing.md },
  module:      { backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, overflow:'hidden', borderWidth:1, borderColor: colors.cardBorder },
  modHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: spacing.md },
  modTitle:    { color: colors.text, fontWeight:'600', fontSize: fontSize.sm, flex:1 },
  modCount:    { color: colors.textMuted, fontSize: fontSize.xs },
  lessonRow:   { flexDirection:'row', alignItems:'center', padding: spacing.md, borderTopWidth:1, borderTopColor: colors.cardBorder, gap: spacing.sm },
  lessonIcon:  { color: colors.textMuted, fontSize:14 },
  lessonTitle: { color: colors.textSecondary, fontSize: fontSize.sm, flex:1 },
  lessonLocked:{ opacity:0.5 },
  previewBadge:{ backgroundColor:'#14532d', borderRadius:4, paddingHorizontal:5, paddingVertical:1 },
  previewText: { color:'#4ade80', fontSize: fontSize.xs, fontWeight:'600' },
  lessonDur:   { color: colors.textMuted, fontSize: fontSize.xs },
})
