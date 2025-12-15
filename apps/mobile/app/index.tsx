import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  // Redirect to planner tab by default
  return <Redirect href="/(tabs)/planner" />;
}
