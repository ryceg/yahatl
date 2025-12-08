import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to planner tab by default
  return <Redirect href="/(tabs)/planner" />;
}
