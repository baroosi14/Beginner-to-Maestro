import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { colors, spacing, radius, fontSize } from '../styles/theme'

const CATEGORIES = [
  { name:'Piano',   icon:'🎹', slug:'piano' },
  { name:'Guitar',  icon:'🎸', slug:'guitar' },
  { name:'Violin',  icon:'🎻', slug:'violin' },
  { name:'Drums',   icon:'🥁', slug:'drums' },
  { name:'Vocals',  icon:'🎤', slug:'vocals' },
  { name:'Theory',  icon:'🎼', slug:'music-theory' },
]

function CourseCard({ item, onPress }) {
  return (
    <TouchableOpacity style={s.courseCard} onPress={() => onPress(item)} activeOpacity={0.8}>
      <View style={s.courseThumb}>
        {item.thumbnail_url
          ? <Image source={{ uri: item.thumbnail_url }} style={s.courseImg} />
          : <Text style={{ fontSize: 36 }}>🎵</Text>
        }
        {item.is_free && <View style={s.freeBadge}><Text style={s.freeBadgeText}>Free</Text></View>}
      </View>
      <View style={s.courseBody}>
        <Text style={s.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.courseInstructor}>{item.instructor}</Text>
        <View style={s.courseFooter}>
          <Text style={s.courseLevel}>{item.level}</Text>
          <Text style={s.coursePrice}>
            {item.is_free || parseFloat(item.price) === 0 ? 'Free' : `$${parseFloat(item.price).toFixed(2)}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses?per_page=8').then(r => setCourses(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroEmoji}>🎵</Text>
        <Text style={s.heroTitle}>Beginner to Maestro</Text>
        <Text style={s.heroSub}>
          {user ? `Welcome back, ${user.full_name?.split(' ')[0]}!` : 'Learn music from world-class instructors'}
        </Text>
        {!user && (
          <TouchableOpacity style={s.heroCta} onPress={() => navigation.navigate('Courses')}>
            <Text style={s.heroCtaText}>Explore Courses →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Browse by Instrument</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.slug} style={s.catItem}
              onPress={() => navigation.navigate('Courses', { category: c.slug })}>
              <Text style={s.catIcon}>{c.icon}</Text>
              <Text style={s.catName}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured courses */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Featured Courses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={s.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {loading
          ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
          : <FlatList
              data={courses}
              keyExtractor={i => String(i.id)}
              renderItem={({ item }) => <CourseCard item={item} onPress={c => navigation.navigate('CourseDetail', { course: c })} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: spacing.lg, paddingRight: spacing.lg, gap: spacing.md }}
            />
        }
      </View>

      {/* Stats */}
      <View style={[s.section, s.statsRow]}>
        {[['10,000+','Students'],['150+','Lessons'],['4.9★','Rating']].map(([v,l]) => (
          <View key={l} style={s.statItem}>
            <Text style={s.statValue}>{v}</Text>
            <Text style={s.statLabel}>{l}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor: colors.bg },
  hero:          { backgroundColor: colors.surface, padding: spacing.xl, alignItems:'center', borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  heroEmoji:     { fontSize:52, marginBottom: spacing.sm },
  heroTitle:     { fontSize: fontSize.xxl+2, fontWeight:'900', color: colors.text, textAlign:'center' },
  heroSub:       { fontSize: fontSize.md, color: colors.textSecondary, textAlign:'center', marginTop: spacing.xs, lineHeight:22 },
  heroCta:       { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  heroCtaText:   { color:'#fff', fontWeight:'700', fontSize: fontSize.md },
  section:       { marginTop: spacing.xl },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle:  { fontSize: fontSize.lg, fontWeight:'700', color: colors.text, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  seeAll:        { color: colors.primary, fontSize: fontSize.sm, fontWeight:'600' },
  catsRow:       { paddingHorizontal: spacing.lg, gap: spacing.md },
  catItem:       { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems:'center', minWidth:72, borderWidth:1, borderColor: colors.cardBorder },
  catIcon:       { fontSize:28, marginBottom:4 },
  catName:       { color: colors.text, fontSize: fontSize.xs, fontWeight:'600', textAlign:'center' },
  courseCard:    { backgroundColor: colors.card, borderRadius: radius.lg, overflow:'hidden', width:200, borderWidth:1, borderColor: colors.cardBorder },
  courseThumb:   { height:110, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' },
  courseImg:     { width:'100%', height:'100%' },
  freeBadge:     { position:'absolute', top:6, left:6, backgroundColor:'#16a34a', borderRadius: radius.sm, paddingHorizontal:6, paddingVertical:2 },
  freeBadgeText: { color:'#fff', fontSize: fontSize.xs, fontWeight:'600' },
  courseBody:    { padding: spacing.md },
  courseTitle:   { color: colors.text, fontWeight:'600', fontSize: fontSize.sm, lineHeight:18 },
  courseInstructor:{ color: colors.textMuted, fontSize: fontSize.xs, marginTop:2 },
  courseFooter:  { flexDirection:'row', justifyContent:'space-between', marginTop: spacing.xs },
  courseLevel:   { color: colors.textSecondary, fontSize: fontSize.xs, textTransform:'capitalize' },
  coursePrice:   { color: colors.text, fontWeight:'700', fontSize: fontSize.sm },
  statsRow:      { flexDirection:'row', justifyContent:'space-around', backgroundColor: colors.surface, padding: spacing.xl, borderTopWidth:1, borderTopColor: colors.cardBorder, marginTop: spacing.xl, marginBottom: spacing.xl },
  statItem:      { alignItems:'center' },
  statValue:     { fontSize: fontSize.xxl, fontWeight:'800', color: colors.primary },
  statLabel:     { color: colors.textSecondary, fontSize: fontSize.xs, marginTop:2 },
})
