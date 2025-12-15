/**
 * Dashboard Screen
 *
 * Overview interface showing summary stats, upcoming items,
 * waiting/blocked items, and streak information.
 */
import * as React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { AlertTriangle, Calendar, Inbox, Flame } from "lucide-react-native";
import { useDashboard } from "@/lib/api/hooks";
import {
  StatCard,
  UpcomingList,
  WaitingOnList,
  StreakWidget,
  NoteDetailSheet,
} from "@/components/dashboard";
import { LoadingSpinner, ErrorState } from "@/components/common";
import { Badge } from "@/components/ui";

export default function DashboardScreen() {
  const {
    summary,
    upcoming,
    waiting,
    streaks,
    isLoading,
    isError,
    refetchAll,
  } = useDashboard();

  // Sheet state for note preview
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const stats = summary.data ?? {
    overdueCount: 0,
    dueTodayCount: 0,
    streaksAtRisk: 0,
    blockedCount: 0,
    inboxCount: 0,
  };

  // Handler to open note detail sheet
  const handleItemPress = (noteId: string) => {
    setSelectedNoteId(noteId);
    setSheetOpen(true);
  };

  // Handler to navigate to notes list with filter
  const handleOverduePress = () => {
    router.push("/notes?filter=overdue");
  };

  const handleDueTodayPress = () => {
    router.push("/notes?filter=today");
  };

  const handleInboxPress = () => {
    router.push("/notes?filter=inbox");
  };

  const handleStreaksAtRiskPress = () => {
    router.push("/notes?filter=streaks-at-risk");
  };

  // Loading state for initial load
  if (isLoading && !summary.data) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Error state
  if (isError && !summary.data) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        message="Check your connection and try again."
        onRetry={refetchAll}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl
            refreshing={
              summary.isFetching ||
              upcoming.isFetching ||
              waiting.isFetching ||
              streaks.isFetching
            }
            onRefresh={refetchAll}
            tintColor="hsl(262, 83%, 58%)"
          />
        }
      >
        {/* Stats Grid */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            At a Glance
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              value={stats.overdueCount ?? 0}
              label="Overdue"
              icon={AlertTriangle}
              variant={
                stats.overdueCount && stats.overdueCount > 0
                  ? "destructive"
                  : "muted"
              }
              isLoading={summary.isLoading}
              onPress={
                stats.overdueCount && stats.overdueCount > 0
                  ? handleOverduePress
                  : undefined
              }
            />
            <StatCard
              value={stats.dueTodayCount ?? 0}
              label="Due Today"
              icon={Calendar}
              variant={
                stats.dueTodayCount && stats.dueTodayCount > 0
                  ? "warning"
                  : "muted"
              }
              isLoading={summary.isLoading}
              onPress={
                stats.dueTodayCount && stats.dueTodayCount > 0
                  ? handleDueTodayPress
                  : undefined
              }
            />
            <StatCard
              value={stats.inboxCount ?? 0}
              label="Inbox"
              icon={Inbox}
              variant={
                stats.inboxCount && stats.inboxCount > 0 ? "default" : "muted"
              }
              isLoading={summary.isLoading}
              onPress={
                stats.inboxCount && stats.inboxCount > 0
                  ? handleInboxPress
                  : undefined
              }
            />
            <StatCard
              value={stats.streaksAtRisk ?? 0}
              label="Streaks at Risk"
              icon={Flame}
              variant={
                stats.streaksAtRisk && stats.streaksAtRisk > 0
                  ? "destructive"
                  : "muted"
              }
              isLoading={summary.isLoading}
              onPress={
                stats.streaksAtRisk && stats.streaksAtRisk > 0
                  ? handleStreaksAtRiskPress
                  : undefined
              }
            />
          </View>
        </View>

        {/* Upcoming Section */}
        <UpcomingList
          items={upcoming.data}
          isLoading={upcoming.isLoading}
          maxItems={5}
          onItemPress={handleItemPress}
          onShowAll={() => router.push("/notes?filter=upcoming")}
        />

        {/* Waiting On Section */}
        <WaitingOnList
          items={waiting.data}
          isLoading={waiting.isLoading}
          maxItems={5}
          onItemPress={handleItemPress}
          onShowAll={() => router.push("/notes?filter=blocked")}
        />

        {/* Streaks Section */}
        <StreakWidget
          items={streaks.data}
          isLoading={streaks.isLoading}
          maxItems={5}
          onItemPress={handleItemPress}
          onShowAll={() => router.push("/notes?filter=habits")}
        />

        {/* Quick Browse Section */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            Browse
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Badge variant="outline" onTouchEnd={() => router.push("/notes")}>
              All Notes
            </Badge>
            <Badge
              variant="outline"
              onTouchEnd={() => router.push("/notes?filter=people")}
            >
              People
            </Badge>
            <Badge
              variant="outline"
              onTouchEnd={() => router.push("/notes?filter=recipes")}
            >
              Recipes
            </Badge>
            <Badge
              variant="outline"
              onTouchEnd={() => router.push("/notes?filter=projects")}
            >
              Projects
            </Badge>
          </View>
        </View>

        {/* Bottom padding for safe area */}
        <View className="h-8" />
      </ScrollView>

      {/* Note Detail Sheet */}
      <NoteDetailSheet
        noteId={selectedNoteId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </View>
  );
}
