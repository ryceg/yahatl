/**
 * New Note Screen
 *
 * Full note creation flow with template selection, dynamic fields,
 * behaviour configuration, triggers, and blockers.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Eye,
} from 'lucide-react-native';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';
import {
  TemplateSelector,
  TemplateType,
  TemplateFields,
  TemplateData,
  serializeTemplateData,
  TagInput,
  BehaviourToggles,
  BehaviourConfig,
  defaultBehaviourConfig,
  TriggerConfigurator,
  TriggerConfig,
  BlockerConfigurator,
  BlockerConfig,
} from '@/components/capture';
import { NoteDetailSheet } from '@/components/dashboard';
import {
  useCreateNote,
  useAddTaskBehaviour,
  useAddHabitBehaviour,
  useAddChoreBehaviour,
  useAddReminderBehaviour,
  useAddFixedTrigger,
  useAddIntervalTrigger,
  useAddWindowTrigger,
  useAddConditionTrigger,
  useAddNoteBlocker,
  useAddPersonBlocker,
  useAddTimeBlocker,
  useAddConditionBlocker,
  useAddUntilDateBlocker,
  useAddFreetextBlocker,
} from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

// Section collapse states
type CollapsibleSection = 'template' | 'behaviours' | 'triggers' | 'blockers';

export default function NewNoteScreen() {
  // ============================================================================
  // Form State
  // ============================================================================
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>(TemplateType.None);
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [tags, setTags] = useState<string[]>([]);
  const [behaviourConfig, setBehaviourConfig] = useState<BehaviourConfig>(defaultBehaviourConfig);
  const [triggers, setTriggers] = useState<TriggerConfig[]>([]);
  const [blockers, setBlockers] = useState<BlockerConfig[]>([]);

  // UI State
  const [collapsedSections, setCollapsedSections] = useState<Set<CollapsibleSection>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  // ============================================================================
  // Mutations
  // ============================================================================
  const createNote = useCreateNote();
  const addTaskBehaviour = useAddTaskBehaviour();
  const addHabitBehaviour = useAddHabitBehaviour();
  const addChoreBehaviour = useAddChoreBehaviour();
  const addReminderBehaviour = useAddReminderBehaviour();
  const addFixedTrigger = useAddFixedTrigger();
  const addIntervalTrigger = useAddIntervalTrigger();
  const addWindowTrigger = useAddWindowTrigger();
  const addConditionTrigger = useAddConditionTrigger();
  const addNoteBlocker = useAddNoteBlocker();
  const addPersonBlocker = useAddPersonBlocker();
  const addTimeBlocker = useAddTimeBlocker();
  const addConditionBlocker = useAddConditionBlocker();
  const addUntilDateBlocker = useAddUntilDateBlocker();
  const addFreetextBlocker = useAddFreetextBlocker();

  // ============================================================================
  // Helpers
  // ============================================================================
  const toggleSection = (section: CollapsibleSection) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isSectionCollapsed = (section: CollapsibleSection) => collapsedSections.has(section);

  // Determine if we need to show trigger/blocker sections
  const showTriggerSection = behaviourConfig.addChore || behaviourConfig.addReminder;

  // ============================================================================
  // Save Logic
  // ============================================================================
  const handleSave = useCallback(async (openDetail: boolean = false) => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your note.');
      return;
    }

    setIsSaving(true);

    try {
      // Build the note body - combine template data with any free text
      let noteBody: string | undefined;
      const serializedTemplate = serializeTemplateData(templateType, templateData);

      if (serializedTemplate && body.trim()) {
        // Both template data and body text
        noteBody = JSON.stringify({
          ...JSON.parse(serializedTemplate),
          _body: body.trim(),
        });
      } else if (serializedTemplate) {
        noteBody = serializedTemplate;
      } else if (body.trim()) {
        noteBody = body.trim();
      }

      // Create the note
      const note = await createNote.mutateAsync({
        title: title.trim(),
        body: noteBody,
        templateType: templateType as unknown as number,
        tags: tags.length > 0 ? tags : undefined,
      });

      const noteId = note.id!;
      setCreatedNoteId(noteId);

      // Add behaviours
      const behaviourPromises: Promise<unknown>[] = [];

      if (behaviourConfig.addTask) {
        behaviourPromises.push(
          addTaskBehaviour.mutateAsync({
            noteId,
            request: {
              priority: behaviourConfig.taskPriority,
              dueDate: behaviourConfig.taskDueDate,
            },
          })
        );
      }

      if (behaviourConfig.addHabit) {
        behaviourPromises.push(
          addHabitBehaviour.mutateAsync({
            noteId,
            request: {
              frequencyGoal: behaviourConfig.habitFrequencyGoal,
            },
          })
        );
      }

      if (behaviourConfig.addChore) {
        behaviourPromises.push(
          addChoreBehaviour.mutateAsync({
            noteId,
            request: {
              nextDue: behaviourConfig.choreNextDue,
            },
          })
        );
      }

      if (behaviourConfig.addReminder) {
        behaviourPromises.push(
          addReminderBehaviour.mutateAsync({
            noteId,
            request: {
              notificationSettingsJson: behaviourConfig.reminderNotificationSettings || '{}',
            },
          })
        );
      }

      await Promise.all(behaviourPromises);

      // Add triggers
      const triggerPromises = triggers.map((trigger) => {
        switch (trigger.type) {
          case 'fixed':
            return addFixedTrigger.mutateAsync({
              noteId,
              request: { cronPattern: trigger.cronPattern },
            });
          case 'interval':
            return addIntervalTrigger.mutateAsync({
              noteId,
              request: { intervalDays: trigger.intervalDays },
            });
          case 'window':
            return addWindowTrigger.mutateAsync({
              noteId,
              request: {
                windowsJson: trigger.windowsJson,
                recurrence: trigger.recurrence,
                windowExpiry: trigger.windowExpiry,
              },
            });
          case 'condition':
            return addConditionTrigger.mutateAsync({
              noteId,
              request: {
                mqttTopic: trigger.mqttTopic,
                operator: trigger.operator,
                value: trigger.value,
              },
            });
        }
      });

      await Promise.all(triggerPromises);

      // Add blockers
      const blockerPromises = blockers.map((blocker) => {
        switch (blocker.type) {
          case 'note':
            if (!blocker.targetNoteId) return Promise.resolve();
            return addNoteBlocker.mutateAsync({
              noteId,
              request: {
                targetNoteId: blocker.targetNoteId,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
          case 'person':
            if (!blocker.personNoteId) return Promise.resolve();
            return addPersonBlocker.mutateAsync({
              noteId,
              request: {
                personNoteId: blocker.personNoteId,
                reason: blocker.reason,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
          case 'time':
            return addTimeBlocker.mutateAsync({
              noteId,
              request: {
                windowsJson: blocker.windowsJson,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
          case 'condition':
            if (!blocker.mqttTopic) return Promise.resolve();
            return addConditionBlocker.mutateAsync({
              noteId,
              request: {
                mqttTopic: blocker.mqttTopic,
                operator: blocker.operator,
                value: blocker.value,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
          case 'until':
            return addUntilDateBlocker.mutateAsync({
              noteId,
              request: {
                until: blocker.until,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
          case 'freetext':
            if (!blocker.description) return Promise.resolve();
            return addFreetextBlocker.mutateAsync({
              noteId,
              request: {
                description: blocker.description,
                notifyOnResolve: blocker.notifyOnResolve,
              },
            });
        }
      });

      await Promise.all(blockerPromises);

      // Navigate or show detail
      if (openDetail) {
        setShowDetailSheet(true);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    title, body, templateType, templateData, tags, behaviourConfig, triggers, blockers,
    createNote, addTaskBehaviour, addHabitBehaviour, addChoreBehaviour, addReminderBehaviour,
    addFixedTrigger, addIntervalTrigger, addWindowTrigger, addConditionTrigger,
    addNoteBlocker, addPersonBlocker, addTimeBlocker, addConditionBlocker,
    addUntilDateBlocker, addFreetextBlocker,
  ]);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <Button variant="ghost" onPress={() => router.back()} disabled={isSaving}>
          <ArrowLeft size={24} className="text-foreground" />
        </Button>
        <Text className="text-lg font-semibold text-foreground">New Note</Text>
        <View className="flex-row gap-1">
          <Button
            variant="ghost"
            onPress={() => handleSave(true)}
            disabled={!title.trim() || isSaving}
          >
            <Eye size={22} color={title.trim() ? '#7c3aed' : '#71717a'} />
          </Button>
          <Button
            variant="ghost"
            onPress={() => handleSave(false)}
            disabled={!title.trim() || isSaving}
          >
            <Save size={22} color={title.trim() ? '#7c3aed' : '#71717a'} />
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Input
          placeholder="Note title..."
          value={title}
          onChangeText={setTitle}
          className="mb-4 text-lg font-semibold"
          autoFocus
        />

        {/* Template Selection - Collapsible */}
        <CollapsibleSection
          title="Template"
          isCollapsed={isSectionCollapsed('template')}
          onToggle={() => toggleSection('template')}
          badge={templateType !== TemplateType.None ? getTemplateName(templateType) : undefined}
        >
          <TemplateSelector
            value={templateType}
            onChange={(type) => {
              setTemplateType(type);
              setTemplateData({}); // Reset template data when changing type
            }}
            className="mb-4"
          />

          {/* Template-specific fields */}
          <TemplateFields
            templateType={templateType}
            data={templateData}
            onChange={setTemplateData}
            className="mb-4"
          />
        </CollapsibleSection>

        {/* Body / Notes */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">
            Notes
          </Text>
          <Card>
            <CardContent className="p-0">
              <Input
                placeholder="Write your notes here..."
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={4}
                className="min-h-[100px] border-0 bg-transparent text-base"
                textAlignVertical="top"
              />
            </CardContent>
          </Card>
        </View>

        {/* Tags */}
        <TagInput
          tags={tags}
          onTagsChange={setTags}
          placeholder="Add tags..."
          className="mb-4"
        />

        {/* Behaviours - Collapsible */}
        <CollapsibleSection
          title="Behaviours"
          isCollapsed={isSectionCollapsed('behaviours')}
          onToggle={() => toggleSection('behaviours')}
          badge={getBehaviourCount(behaviourConfig)}
        >
          <BehaviourToggles
            config={behaviourConfig}
            onChange={setBehaviourConfig}
            className="mb-4"
          />
        </CollapsibleSection>

        {/* Triggers - Show for Chore/Reminder */}
        {showTriggerSection && (
          <CollapsibleSection
            title="Triggers"
            isCollapsed={isSectionCollapsed('triggers')}
            onToggle={() => toggleSection('triggers')}
            badge={triggers.length > 0 ? `${triggers.length}` : undefined}
          >
            <TriggerConfigurator
              triggers={triggers}
              onChange={setTriggers}
              showOnlyScheduling={!behaviourConfig.addReminder}
              className="mb-4"
            />
          </CollapsibleSection>
        )}

        {/* Blockers - Collapsible */}
        <CollapsibleSection
          title="Blockers"
          isCollapsed={isSectionCollapsed('blockers')}
          onToggle={() => toggleSection('blockers')}
          badge={blockers.length > 0 ? `${blockers.length}` : undefined}
        >
          <BlockerConfigurator
            blockers={blockers}
            onChange={setBlockers}
            className="mb-4"
          />
        </CollapsibleSection>

        {/* Save Buttons */}
        <View className="flex-row gap-3 mb-8">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => handleSave(true)}
            disabled={!title.trim() || isSaving}
          >
            <Eye size={18} color="#7c3aed" />
            <Text className="text-foreground ml-2">Save & View</Text>
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onPress={() => handleSave(false)}
            disabled={!title.trim() || isSaving}
          >
            <FileCheck size={18} color="#fff" />
            <Text className="text-primary-foreground ml-2">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Button>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>

      {/* Detail Sheet */}
      <NoteDetailSheet
        noteId={createdNoteId}
        open={showDetailSheet}
        onOpenChange={(open) => {
          setShowDetailSheet(open);
          if (!open) {
            router.back();
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isCollapsed,
  onToggle,
  badge,
  children,
}: CollapsibleSectionProps) {
  return (
    <View className="mb-4">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          {badge && (
            <Badge variant="secondary">
              <Text className="text-xs text-secondary-foreground">{badge}</Text>
            </Badge>
          )}
        </View>
        {isCollapsed ? (
          <ChevronDown size={18} color="#71717a" />
        ) : (
          <ChevronUp size={18} color="#71717a" />
        )}
      </Pressable>
      {!isCollapsed && children}
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getTemplateName(type: TemplateType): string {
  switch (type) {
    case TemplateType.Person: return 'Person';
    case TemplateType.Recipe: return 'Recipe';
    case TemplateType.Project: return 'Project';
    case TemplateType.GiftIdea: return 'Gift Idea';
    case TemplateType.ShoppingItem: return 'Shopping Item';
    default: return '';
  }
}

function getBehaviourCount(config: BehaviourConfig): string | undefined {
  const count = [
    config.addTask,
    config.addHabit,
    config.addChore,
    config.addReminder,
  ].filter(Boolean).length;

  return count > 0 ? `${count}` : undefined;
}
