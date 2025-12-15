/**
 * NoteDetailSheet Component
 *
 * Bottom sheet for viewing and editing note details.
 * Displays title, body (markdown), template fields, behaviours, blockers, and triggers.
 * Supports inline editing and action buttons.
 */
import * as React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  Clock,
  Tag,
  ExternalLink,
  CheckCircle2,
  Play,
  Trash2,
  Edit2,
  X,
  Save,
  CalendarDays,
  Flame,
  Repeat,
  Bell,
  AlertTriangle,
  Lock,
  Unlock,
  Zap,
  Link2,
  User,
  Gift,
  ShoppingCart,
  FolderKanban,
  ChefHat,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetContent,
  SheetFooter,
  Button,
  Badge,
  Input,
} from "@/components/ui";
import {
  useNote,
  useBehaviours,
  useBlockers,
  useTriggers,
  useCompleteTask,
  useCompleteChore,
  useCompleteHabit,
  useUpdateNote,
  useDeleteNote,
} from "@/lib/api/hooks";
import {
  BehaviourResponse,
  TaskBehaviourResponse,
  HabitBehaviourResponse,
  ChoreBehaviourResponse,
  ReminderBehaviourResponse,
  BlockerResponse,
  TriggerResponse,
  Priority,
  TaskExecutionStatus,
  TemplateType,
} from "@/lib/api/client";
import { usePomodoroStore } from "@/lib/stores";
import { useStartPomodoroSession } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface NoteDetailSheetProps {
  /** Note ID to display */
  noteId: string | null;
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet closes */
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a date relative to today
 */
function formatRelativeDate(date: Date | undefined | null): string {
  if (!date) return "Not set";

  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format date for display
 */
function formatDate(date: Date | undefined | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get priority label and color
 */
function getPriorityInfo(priority: Priority | undefined): {
  label: string;
  variant: "destructive" | "warning" | "secondary";
} {
  switch (priority) {
    case Priority.High:
      return { label: "High", variant: "destructive" };
    case Priority.Normal:
      return { label: "Normal", variant: "secondary" };
    case Priority.Low:
      return { label: "Low", variant: "secondary" };
    default:
      return { label: "Normal", variant: "secondary" };
  }
}

/**
 * Get task status label
 */
function getStatusLabel(status: TaskExecutionStatus | undefined): string {
  switch (status) {
    case TaskExecutionStatus.Complete:
      return "Complete";
    case TaskExecutionStatus.Cancelled:
      return "Cancelled";
    case TaskExecutionStatus.Pending:
    default:
      return "Pending";
  }
}

/**
 * Get template type icon
 */
function getTemplateIcon(type: TemplateType | undefined) {
  switch (type) {
    case TemplateType.Person:
      return User;
    case TemplateType.Recipe:
      return ChefHat;
    case TemplateType.Project:
      return FolderKanban;
    case TemplateType.GiftIdea:
      return Gift;
    case TemplateType.ShoppingItem:
      return ShoppingCart;
    default:
      return null;
  }
}

/**
 * Get template type label
 */
function getTemplateLabel(type: TemplateType | undefined): string | null {
  switch (type) {
    case TemplateType.Person:
      return "Person";
    case TemplateType.Recipe:
      return "Recipe";
    case TemplateType.Project:
      return "Project";
    case TemplateType.GiftIdea:
      return "Gift Idea";
    case TemplateType.ShoppingItem:
      return "Shopping Item";
    default:
      return null;
  }
}

/**
 * Type guard for TaskBehaviourResponse
 */
function isTask(b: BehaviourResponse): b is TaskBehaviourResponse {
  return b.type === "Task";
}

/**
 * Type guard for HabitBehaviourResponse
 */
function isHabit(b: BehaviourResponse): b is HabitBehaviourResponse {
  return b.type === "Habit";
}

/**
 * Type guard for ChoreBehaviourResponse
 */
function isChore(b: BehaviourResponse): b is ChoreBehaviourResponse {
  return b.type === "Chore";
}

/**
 * Type guard for ReminderBehaviourResponse
 */
function isReminder(b: BehaviourResponse): b is ReminderBehaviourResponse {
  return b.type === "Reminder";
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Simple markdown-like body renderer
 * Renders basic formatting: **bold**, *italic*, `code`
 */
function MarkdownBody({ body }: { body: string }) {
  // Simple text display - in production you'd use a markdown library
  // This provides basic styling for common patterns
  const lines = body.split("\n");

  return (
    <View className="rounded-lg bg-muted/30 p-3">
      {lines.map((line, i) => {
        // Heading detection
        if (line.startsWith("# ")) {
          return (
            <Text key={i} className="text-lg font-bold text-foreground mb-2">
              {line.slice(2)}
            </Text>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <Text
              key={i}
              className="text-base font-semibold text-foreground mb-1.5"
            >
              {line.slice(3)}
            </Text>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <View key={i} className="flex-row mb-1">
              <Text className="text-foreground mr-2">•</Text>
              <Text className="text-foreground flex-1">{line.slice(2)}</Text>
            </View>
          );
        }
        if (line.trim() === "") {
          return <View key={i} className="h-2" />;
        }
        return (
          <Text key={i} className="text-foreground mb-1">
            {line}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Task behaviour badge with details
 */
function TaskBadge({ task }: { task: TaskBehaviourResponse }) {
  const priorityInfo = getPriorityInfo(task.priority);
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TaskExecutionStatus.Complete;

  return (
    <View className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
      <View className="flex-row items-center gap-2 mb-2">
        <CheckCircle2 size={16} className="text-blue-500" />
        <Text className="font-medium text-foreground">Task</Text>
        <Badge
          variant={
            task.status === TaskExecutionStatus.Complete
              ? "success"
              : "secondary"
          }
        >
          {getStatusLabel(task.status)}
        </Badge>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {task.dueDate && (
          <View className="flex-row items-center gap-1">
            <CalendarDays size={12} className="text-muted-foreground" />
            <Text
              className={cn(
                "text-sm",
                isOverdue
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
            >
              {formatRelativeDate(task.dueDate)}
            </Text>
          </View>
        )}
        <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
      </View>
    </View>
  );
}

/**
 * Habit behaviour badge with streak info
 */
function HabitBadge({ habit }: { habit: HabitBehaviourResponse }) {
  return (
    <View className="mb-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
      <View className="flex-row items-center gap-2 mb-2">
        <Flame size={16} className="text-orange-500" />
        <Text className="font-medium text-foreground">Habit</Text>
        {habit.frequencyGoal && (
          <Badge variant="secondary">{habit.frequencyGoal}</Badge>
        )}
      </View>
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1">
          <Flame size={12} className="text-orange-500" />
          <Text className="text-sm text-foreground font-medium">
            {habit.currentStreak ?? 0}
          </Text>
          <Text className="text-sm text-muted-foreground">streak</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm text-muted-foreground">Best:</Text>
          <Text className="text-sm text-foreground font-medium">
            {habit.longestStreak ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Chore behaviour badge with schedule
 */
function ChoreBadge({ chore }: { chore: ChoreBehaviourResponse }) {
  const isOverdue = chore.nextDue && new Date(chore.nextDue) < new Date();

  return (
    <View className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
      <View className="flex-row items-center gap-2 mb-2">
        <Repeat size={16} className="text-green-500" />
        <Text className="font-medium text-foreground">Chore</Text>
      </View>
      <View className="flex-row flex-wrap gap-4">
        <View className="flex-row items-center gap-1">
          <CalendarDays size={12} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">Next:</Text>
          <Text
            className={cn(
              "text-sm",
              isOverdue ? "text-destructive font-medium" : "text-foreground"
            )}
          >
            {formatRelativeDate(chore.nextDue)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">Last:</Text>
          <Text className="text-sm text-foreground">
            {formatDate(chore.lastCompleted)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Reminder behaviour badge
 */
function ReminderBadge({ reminder }: { reminder: ReminderBehaviourResponse }) {
  return (
    <View className="mb-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
      <View className="flex-row items-center gap-2">
        <Bell size={16} className="text-purple-500" />
        <Text className="font-medium text-foreground">Reminder</Text>
        <Badge variant="secondary">Active</Badge>
      </View>
    </View>
  );
}

/**
 * Blocker item display
 */
function BlockerItem({ blocker }: { blocker: BlockerResponse }) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-2 py-2 px-3 rounded-lg mb-2",
        blocker.isActive
          ? "bg-destructive/10 border border-destructive/20"
          : "bg-muted/50"
      )}
    >
      {blocker.isActive ? (
        <Lock size={14} className="text-destructive" />
      ) : (
        <Unlock size={14} className="text-muted-foreground" />
      )}
      <Text
        className={cn(
          "flex-1 text-sm",
          blocker.isActive
            ? "text-destructive"
            : "text-muted-foreground line-through"
        )}
      >
        {blocker.type}
      </Text>
      <Badge variant={blocker.isActive ? "destructive" : "secondary"}>
        {blocker.isActive ? "Active" : "Resolved"}
      </Badge>
    </View>
  );
}

/**
 * Trigger item display
 */
function TriggerItem({ trigger }: { trigger: TriggerResponse }) {
  return (
    <View className="flex-row items-center gap-2 py-2 px-3 rounded-lg mb-2 bg-muted/50">
      <Zap size={14} className="text-primary" />
      <Text className="flex-1 text-sm text-foreground">{trigger.type}</Text>
    </View>
  );
}

/**
 * Note links section
 */
function NoteLinks({
  links,
  title,
}: {
  links: { id?: string; noteId?: string; noteTitle?: string }[];
  title: string;
}) {
  if (!links || links.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-muted-foreground">
        {title}
      </Text>
      <View className="gap-1">
        {links.map((link, i) => (
          <View
            key={link.id ?? i}
            className="flex-row items-center gap-2 py-1.5 px-2 rounded bg-muted/30"
          >
            <Link2 size={12} className="text-muted-foreground" />
            <Text className="text-sm text-foreground" numberOfLines={1}>
              {link.noteTitle ?? "Untitled"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NoteDetailSheet({
  noteId,
  open,
  onOpenChange,
}: NoteDetailSheetProps) {
  // ============================================================================
  // State
  // ============================================================================
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editBody, setEditBody] = React.useState("");

  // ============================================================================
  // Queries
  // ============================================================================
  const { data: note, isLoading } = useNote(noteId ?? "");
  const { data: behaviours } = useBehaviours(noteId ?? "");
  const { data: blockers } = useBlockers(noteId ?? "");
  const { data: triggers } = useTriggers(noteId ?? "");

  // ============================================================================
  // Mutations
  // ============================================================================
  const completeTask = useCompleteTask();
  const completeChore = useCompleteChore();
  const completeHabit = useCompleteHabit();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // ============================================================================
  // Pomodoro
  // ============================================================================
  const pomodoroActive = usePomodoroStore((s) => s.isActive);
  const { startSession: startPomodoroSession, isStarting: isPomodoroStarting } =
    useStartPomodoroSession();

  // ============================================================================
  // Derived State
  // ============================================================================
  const taskBehaviour = behaviours?.find(isTask);
  const habitBehaviour = behaviours?.find(isHabit);
  const choreBehaviour = behaviours?.find(isChore);
  const reminderBehaviour = behaviours?.find(isReminder);

  const canComplete =
    (taskBehaviour && taskBehaviour.status !== TaskExecutionStatus.Complete) ||
    choreBehaviour ||
    habitBehaviour;

  const TemplateIcon = getTemplateIcon(note?.templateType);
  const templateLabel = getTemplateLabel(note?.templateType);

  // ============================================================================
  // Effects
  // ============================================================================
  React.useEffect(() => {
    if (note && isEditMode) {
      setEditTitle(note.title ?? "");
      setEditBody(note.body ?? "");
    }
  }, [note, isEditMode]);

  // Reset edit mode when sheet closes
  React.useEffect(() => {
    if (!open) {
      setIsEditMode(false);
    }
  }, [open]);

  // ============================================================================
  // Handlers
  // ============================================================================
  const handleViewFull = () => {
    if (noteId) {
      onOpenChange(false);
      router.push(`/notes/${noteId}`);
    }
  };

  const handleComplete = async () => {
    if (!noteId) return;

    try {
      if (taskBehaviour) {
        await completeTask.mutateAsync(noteId);
      } else if (choreBehaviour) {
        await completeChore.mutateAsync(noteId);
      } else if (habitBehaviour) {
        await completeHabit.mutateAsync(noteId);
      }
      onOpenChange(false);
    } catch (error) {
      Alert.alert("Error", "Failed to complete. Please try again.");
    }
  };

  const handleStartPomodoro = async () => {
    if (noteId) {
      try {
        await startPomodoroSession({ noteId });
        onOpenChange(false);
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to start Pomodoro session. Please try again."
        );
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (noteId) {
              try {
                await deleteNote.mutateAsync(noteId);
                onOpenChange(false);
              } catch (error) {
                Alert.alert("Error", "Failed to delete. Please try again.");
              }
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!noteId) return;

    try {
      await updateNote.mutateAsync({
        id: noteId,
        request: {
          title: editTitle,
          body: editBody,
        },
      });
      setIsEditMode(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditTitle(note?.title ?? "");
    setEditBody(note?.body ?? "");
  };

  // ============================================================================
  // Render
  // ============================================================================
  const isActionPending =
    completeTask.isPending ||
    completeChore.isPending ||
    completeHabit.isPending ||
    deleteNote.isPending ||
    updateNote.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <View className="max-h-[85%]">
        <SheetHeader>
          <View className="flex-row items-center justify-between">
            {isEditMode ? (
              <View className="flex-1 mr-2">
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  className="text-lg font-semibold text-foreground bg-muted/30 rounded-lg px-3 py-2"
                  placeholder="Note title"
                  placeholderTextColor="#71717a"
                />
              </View>
            ) : (
              <View className="flex-row items-center gap-2 flex-1">
                {TemplateIcon && (
                  <TemplateIcon size={18} className="text-primary" />
                )}
                <SheetTitle className="flex-1">
                  {isLoading ? "Loading..." : note?.title ?? "Note Details"}
                </SheetTitle>
              </View>
            )}
            <View className="flex-row gap-1">
              {isEditMode ? (
                <>
                  <Pressable
                    onPress={handleCancelEdit}
                    className="p-2 rounded-lg"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <X size={20} className="text-muted-foreground" />
                  </Pressable>
                  <Pressable
                    onPress={handleSaveEdit}
                    className="p-2 rounded-lg bg-primary/10"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={updateNote.isPending}
                  >
                    <Save size={20} className="text-primary" />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => setIsEditMode(true)}
                  className="p-2 rounded-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Edit2 size={20} className="text-muted-foreground" />
                </Pressable>
              )}
            </View>
          </View>
        </SheetHeader>

        <SheetContent>
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" />
            </View>
          ) : note ? (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Template Type Badge */}
              {templateLabel && (
                <View className="mb-4">
                  <Badge variant="outline" className="self-start">
                    {TemplateIcon && (
                      <TemplateIcon
                        size={12}
                        className="text-foreground mr-1"
                      />
                    )}
                    <Text className="text-xs text-foreground">
                      {templateLabel}
                    </Text>
                  </Badge>
                </View>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row flex-wrap gap-2">
                    {note.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        <Tag
                          size={10}
                          className="mr-1 text-secondary-foreground"
                        />
                        <Text className="text-xs text-secondary-foreground">
                          {tag}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Meta */}
              <View className="mb-4 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Clock size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">
                    {note.createdAt
                      ? new Date(note.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </Text>
                </View>
                {note.isInbox && (
                  <Badge variant="warning">
                    <Text className="text-xs">Inbox</Text>
                  </Badge>
                )}
                {note.needsDetail && (
                  <Badge variant="outline">
                    <Text className="text-xs text-foreground">
                      Needs Detail
                    </Text>
                  </Badge>
                )}
              </View>

              {/* Body */}
              {isEditMode ? (
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">
                    Body
                  </Text>
                  <TextInput
                    value={editBody}
                    onChangeText={setEditBody}
                    className="min-h-[120px] bg-muted/30 rounded-lg px-3 py-3 text-foreground"
                    placeholder="Note body (supports markdown)"
                    placeholderTextColor="#71717a"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              ) : note.body ? (
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">
                    Content
                  </Text>
                  <MarkdownBody body={note.body} />
                </View>
              ) : null}

              {/* Behaviours */}
              {behaviours && behaviours.length > 0 && (
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">
                    Behaviours
                  </Text>
                  {taskBehaviour && <TaskBadge task={taskBehaviour} />}
                  {habitBehaviour && <HabitBadge habit={habitBehaviour} />}
                  {choreBehaviour && <ChoreBadge chore={choreBehaviour} />}
                  {reminderBehaviour && (
                    <ReminderBadge reminder={reminderBehaviour} />
                  )}
                </View>
              )}

              {/* Blockers */}
              {blockers && blockers.length > 0 && (
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">
                    Blockers
                  </Text>
                  {blockers.map((blocker, i) => (
                    <BlockerItem key={blocker.id ?? i} blocker={blocker} />
                  ))}
                </View>
              )}

              {/* Triggers */}
              {triggers && triggers.length > 0 && (
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">
                    Triggers
                  </Text>
                  {triggers.map((trigger, i) => (
                    <TriggerItem key={trigger.id ?? i} trigger={trigger} />
                  ))}
                </View>
              )}

              {/* Note Links */}
              <NoteLinks links={note.linksFrom ?? []} title="Links From" />
              <NoteLinks links={note.linksTo ?? []} title="Links To" />
            </ScrollView>
          ) : (
            <View className="py-8 items-center">
              <Text className="text-muted-foreground">Note not found</Text>
            </View>
          )}
        </SheetContent>

        {/* Footer Actions */}
        {note && !isEditMode && (
          <SheetFooter>
            <View className="flex-1 gap-2">
              {/* Primary Actions Row */}
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={handleViewFull}
                >
                  <ExternalLink size={16} className="text-foreground mr-2" />
                  <Text className="text-foreground font-medium">Full View</Text>
                </Button>

                {canComplete && (
                  <Button
                    className="flex-1"
                    onPress={handleComplete}
                    disabled={isActionPending}
                  >
                    <CheckCircle2
                      size={16}
                      className="text-primary-foreground mr-2"
                    />
                    <Text className="text-primary-foreground font-medium">
                      {isActionPending ? "Completing..." : "Complete"}
                    </Text>
                  </Button>
                )}
              </View>

              {/* Secondary Actions Row */}
              <View className="flex-row gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={handleStartPomodoro}
                  disabled={pomodoroActive || isPomodoroStarting}
                >
                  <Play size={16} className="text-secondary-foreground mr-2" />
                  <Text className="text-secondary-foreground font-medium">
                    {isPomodoroStarting
                      ? "Starting..."
                      : pomodoroActive
                      ? "Timer Active"
                      : "Start Pomodoro"}
                  </Text>
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onPress={handleDelete}
                  disabled={isActionPending}
                >
                  <Trash2 size={16} className="text-destructive-foreground" />
                </Button>
              </View>
            </View>
          </SheetFooter>
        )}

        {/* Edit Mode Footer */}
        {note && isEditMode && (
          <SheetFooter>
            <Button
              variant="outline"
              className="flex-1"
              onPress={handleCancelEdit}
            >
              <X size={16} className="text-foreground mr-2" />
              <Text className="text-foreground font-medium">Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={handleSaveEdit}
              disabled={updateNote.isPending}
            >
              <Save size={16} className="text-primary-foreground mr-2" />
              <Text className="text-primary-foreground font-medium">
                {updateNote.isPending ? "Saving..." : "Save Changes"}
              </Text>
            </Button>
          </SheetFooter>
        )}
      </View>
    </Sheet>
  );
}
