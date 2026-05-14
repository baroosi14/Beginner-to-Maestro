import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors } from '../styles/theme'

// Screens
import LoginScreen     from '../screens/LoginScreen'
import RegisterScreen  from '../screens/RegisterScreen'
import HomeScreen      from '../screens/HomeScreen'
import CoursesScreen   from '../screens/CoursesScreen'
import CourseDetailScreen from '../screens/CourseDetailScreen'
import VideoPlayerScreen  from '../screens/VideoPlayerScreen'
import DashboardScreen  from '../screens/DashboardScreen'
import LiveClassScreen  from '../screens/LiveClassScreen'
import ProfileScreen    from '../screens/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

const screenOpts = {
  headerStyle:      { backgroundColor: colors.surface },
  headerTintColor:  colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle:     { backgroundColor: colors.bg },
}

function TabIcon({ icon, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle:           { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, height: 64 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle:      { fontSize: 11, marginBottom: 6 },
        headerStyle:           { backgroundColor: colors.surface },
        headerTintColor:       colors.text,
        headerTitleStyle:      { fontWeight: '700' },
      }}>
      <Tab.Screen name="Home"       component={HomeScreen}       options={{ tabBarIcon: p => <TabIcon icon="🏠" {...p} />, title: 'Home' }} />
      <Tab.Screen name="Courses"    component={CoursesScreen}    options={{ tabBarIcon: p => <TabIcon icon="📚" {...p} />, title: 'Courses' }} />
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ tabBarIcon: p => <TabIcon icon="🎓" {...p} />, title: 'Learning' }} />
      <Tab.Screen name="Live"       component={LiveClassScreen}  options={{ tabBarIcon: p => <TabIcon icon="📡" {...p} />, title: 'Live' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}    options={{ tabBarIcon: p => <TabIcon icon="👤" {...p} />, title: 'Profile' }} />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Login"    component={LoginScreen}    options={{ title: 'Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  )
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Main"        component={MainTabs}          options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen}  options={{ title: '', headerShown: false }} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={{ dark: true, colors: { background: colors.bg, card: colors.surface, text: colors.text, border: colors.cardBorder, notification: colors.primary, primary: colors.primary } }}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
