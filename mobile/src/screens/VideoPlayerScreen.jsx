import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native'
import Video from 'react-native-video'
import api from '../services/api'
import { colors, spacing, fontSize } from '../styles/theme'

const { width } = Dimensions.get('window')

export default function VideoPlayerScreen({ route, navigation }) {
  const { lesson, courseSlug } = route.params
  const videoRef = useRef(null)
  const [paused, setPaused]       = useState(false)
  const [duration, setDuration]   = useState(0)
  const [currentTime, setCurrent] = useState(0)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    StatusBar.setHidden(true)
    return () => StatusBar.setHidden(false)
  }, [])

  const saveProgress = async (time, done = false) => {
    try {
      await api.post(`/lessons/${lesson.id}/progress`, { watch_time: Math.floor(time), completed: done })
      if (done && !completed) setCompleted(true)
    } catch {}
  }

  const onProgress = ({ currentTime: t }) => {
    setCurrent(t)
    if (duration > 0 && t / duration > 0.9 && !completed) saveProgress(t, true)
  }

  const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <View style={s.container}>
      <StatusBar hidden />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color:'#fff', fontSize:18 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{lesson.title}</Text>
        {completed && <Text style={s.doneChip}>✓ Done</Text>}
      </View>

      {/* Video */}
      {lesson.video_url
        ? <Video
            ref={videoRef}
            source={{ uri: lesson.video_url }}
            style={s.video}
            controls
            paused={paused}
            onLoad={({ duration: d }) => setDuration(d)}
            onProgress={onProgress}
            onEnd={() => saveProgress(duration, true)}
            resizeMode="contain"
          />
        : <View style={s.noVideo}>
            <Text style={{ fontSize:48 }}>📄</Text>
            <Text style={s.noVideoText}>No video for this lesson</Text>
          </View>
      }

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.lessonTitle}>{lesson.title}</Text>
        {lesson.description && <Text style={s.lessonDesc}>{lesson.description}</Text>}
        <View style={s.timeRow}>
          <Text style={s.timeText}>{fmt(currentTime)}</Text>
          <Text style={s.timeText}>{fmt(duration)}</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#000' },
  header:      { flexDirection:'row', alignItems:'center', padding: spacing.md, paddingTop: spacing.md+8, position:'absolute', top:0, left:0, right:0, zIndex:10, backgroundColor:'rgba(0,0,0,0.6)' },
  backBtn:     { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle: { flex:1, color:'#fff', fontSize: fontSize.md, fontWeight:'600', marginHorizontal: spacing.sm },
  doneChip:    { color:'#4ade80', fontSize: fontSize.xs, fontWeight:'600', backgroundColor:'#14532d', borderRadius:4, paddingHorizontal:6, paddingVertical:2 },
  video:       { width, height: width * 9/16, backgroundColor:'#000', marginTop:60 },
  noVideo:     { width, height: width * 9/16, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center', marginTop:60 },
  noVideoText: { color: colors.textSecondary, marginTop: spacing.sm },
  progressBar: { height:3, backgroundColor: colors.cardBorder },
  progressFill:{ height:'100%', backgroundColor: colors.primary },
  info:        { flex:1, padding: spacing.lg },
  lessonTitle: { color:'#fff', fontSize: fontSize.lg, fontWeight:'700' },
  lessonDesc:  { color: colors.textSecondary, marginTop: spacing.sm, fontSize: fontSize.sm, lineHeight:20 },
  timeRow:     { flexDirection:'row', justifyContent:'space-between', marginTop: spacing.sm },
  timeText:    { color: colors.textMuted, fontSize: fontSize.xs },
})
