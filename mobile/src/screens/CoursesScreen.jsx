import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image } from 'react-native'
import api from '../services/api'
import { colors, spacing, radius, fontSize } from '../styles/theme'

function CourseItem({ item, onPress }) {
  return (
    <TouchableOpacity style={s.item} onPress={() => onPress(item)} activeOpacity={0.8}>
      <View style={s.thumb}>
        {item.thumbnail_url
          ? <Image source={{ uri: item.thumbnail_url }} style={s.thumbImg} />
          : <Text style={{ fontSize:28 }}>🎵</Text>
        }
      </View>
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <Text style={s.sub}>{item.instructor} · {item.level}</Text>
        <Text style={s.price}>
          {item.is_free || parseFloat(item.price) === 0 ? 'Free' : `$${parseFloat(item.price).toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function CoursesScreen({ navigation, route }) {
  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)
  const [refreshing, setRef]    = useState(false)
  const category = route?.params?.category || ''

  const fetch = useCallback(async (reset = false) => {
    const p = new URLSearchParams({ page: reset ? 1 : page, per_page: 15 })
    if (query)    p.set('q', query)
    if (category) p.set('category', category)
    const r = await api.get('/courses?' + p)
    const items = r.data.data || []
    const meta  = r.data.meta || {}
    if (reset) { setCourses(items); setPage(2) }
    else       { setCourses(c => [...c, ...items]); setPage(p => p+1) }
    setHasMore(meta.page < meta.total_pages)
  }, [query, category, page])

  useEffect(() => {
    setLoading(true)
    fetch(true).finally(() => setLoading(false))
  }, [query, category])

  const loadMore = () => { if (!loading && hasMore) fetch() }

  const onRefresh = async () => {
    setRef(true)
    await fetch(true)
    setRef(false)
  }

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search courses..."
          placeholderTextColor={colors.textMuted} value={query}
          onChangeText={setQuery} />
      </View>

      {loading && !refreshing
        ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
        : <FlatList
            data={courses}
            keyExtractor={i => String(i.id)}
            renderItem={({ item }) => <CourseItem item={item} onPress={c => navigation.navigate('CourseDetail', { course: c })} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📚</Text>
                <Text style={s.emptyText}>No courses found</Text>
              </View>
            }
            ListFooterComponent={hasMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
            contentContainerStyle={courses.length === 0 && s.emptyContainer}
          />
      }
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: colors.bg },
  searchBar:      { flexDirection:'row', alignItems:'center', backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder, borderRadius: radius.md, margin: spacing.md, paddingHorizontal: spacing.md },
  searchIcon:     { fontSize:18, marginRight: spacing.xs },
  searchInput:    { flex:1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.md },
  item:           { flexDirection:'row', backgroundColor: colors.card, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, overflow:'hidden', borderWidth:1, borderColor: colors.cardBorder },
  thumb:          { width:90, height:90, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' },
  thumbImg:       { width:'100%', height:'100%' },
  info:           { flex:1, padding: spacing.md, justifyContent:'space-between' },
  title:          { color: colors.text, fontWeight:'600', fontSize: fontSize.sm, lineHeight:18 },
  sub:            { color: colors.textMuted, fontSize: fontSize.xs, textTransform:'capitalize' },
  price:          { color: colors.primary, fontWeight:'700', fontSize: fontSize.sm },
  empty:          { alignItems:'center', marginTop: 80 },
  emptyContainer: { flexGrow:1, justifyContent:'center' },
  emptyIcon:      { fontSize:48, marginBottom: spacing.md },
  emptyText:      { color: colors.textSecondary, fontSize: fontSize.md },
})
