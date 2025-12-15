/**
 * Planner Screen
 *
 * Main planner mode interface with Today's Plan and Candidates sections.
 */
import { View, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  usePlanner,
  useAddToPlan,
  useRemoveFromPlan,
} from "@/lib/api/hooks/usePlanner";
import { useCompleteTask } from "@/lib/api/hooks/useBehaviours";
import { TodayPlan, CandidateSection } from "@/components/planner";
import {
  LoadingSpinner,
  ErrorState,
  FloatingActionButton,
} from "@/components/common";
import React from "react";

export default function PlannerScreen() {
  const { todaysPlan, candidates, isLoading, isError, refetchAll } =
    usePlanner();
  const addToPlan = useAddToPlan();
  const removeFromPlan = useRemoveFromPlan();
  const completeTask = useCompleteTask();

  const handleAddToToday = (noteId: string) => {
    addToPlan.mutate(noteId);
  };

  const handleComplete = (noteId: string) => {
    completeTask.mutate(noteId);
  };

  const handleRemove = (noteId: string) => {
    removeFromPlan.mutate(noteId);
  };

  const handleItemPress = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  const handleQuickCapture = () => {
    router.push("/(tabs)/capture");
  };

  // Loading state
  if (isLoading && !todaysPlan.data && !candidates.data) {
    return <LoadingSpinner message="Loading your plan..." />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load planner"
        message="Check your connection and try again."
        onRetry={refetchAll}
      />
    );
  }

  const candidatesData = candidates.data;
  const planData = todaysPlan.data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={todaysPlan.isFetching || candidates.isFetching}
            onRefresh={refetchAll}
            tintColor="hsl(262, 83%, 58%)"
          />
        }
      >
        {/* Today's Plan Section */}
        <TodayPlan
          items={planData}
          onComplete={handleComplete}
          onRemove={handleRemove}
          onItemPress={handleItemPress}
        />

        {/* Candidates Sections */}
        {candidatesData && (
          <View>
            <CandidateSection
              title="Urgent / Overdue"
              variant="urgent"
              items={candidatesData.urgent ?? []}
              onAddToToday={handleAddToToday}
              onItemPress={handleItemPress}
              defaultExpanded={true}
            />

            <CandidateSection
              title="Due Soon"
              variant="dueSoon"
              items={candidatesData.dueSoon ?? []}
              onAddToToday={handleAddToToday}
              onItemPress={handleItemPress}
              defaultExpanded={true}
            />

            <CandidateSection
              title="Available"
              variant="available"
              items={candidatesData.available ?? []}
              onAddToToday={handleAddToToday}
              onItemPress={handleItemPress}
              defaultExpanded={false}
            />
          </View>
        )}

        {/* Bottom padding for FAB */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton icon={Plus} onPress={handleQuickCapture} />
    </View>
  );
}
