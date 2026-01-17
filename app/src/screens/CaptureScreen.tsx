/**
 * Capture screen with quick add and triage
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useItems, useAddItem, useSetTraits, useAddTags, useDeleteItem, useUpdateItem, useLists } from '../hooks/useYahatl';
import FloatingActionButton from '../components/FloatingActionButton';
import type { YahtlItem, Trait } from '../types';

export default function CaptureScreen() {
  const { config } = useAuth();
  const { data: lists } = useLists();
  const defaultListId = config?.default_list_id || (lists?.[0]?.list_id);
  const entityId = defaultListId ? `todo.${defaultListId}` : '';

  const [quickCaptureText, setQuickCaptureText] = useState('');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [triageItem, setTriageItem] = useState<YahtlItem | null>(null);
  const [selectedTraits, setSelectedTraits] = useState<Trait[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data: items } = useItems(entityId);
  const addItem = useAddItem();
  const setTraits = useSetTraits();
  const addTags = useAddTags();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();

  const inboxItems = items?.filter((item) => item.needs_detail) || [];

  const handleQuickCapture = async () => {
    if (!quickCaptureText.trim()) return;

    try {
      await addItem.mutateAsync({
        entityId,
        title: quickCaptureText,
        options: {
          needs_detail: true,
          traits: ['actionable'],
        },
      });
      setQuickCaptureText('');
      setShowQuickCapture(false);
      Alert.alert('Success', 'Item added to inbox!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleTriageNext = () => {
    if (inboxItems.length > 0) {
      setTriageItem(inboxItems[0]);
      setSelectedTraits(inboxItems[0].traits as Trait[]);
      setShowTriage(true);
    }
  };

  const handleSaveTriage = async () => {
    if (!triageItem) return;

    try {
      // Update traits
      await setTraits.mutateAsync({
        entityId,
        itemId: triageItem.uid,
        traits: selectedTraits,
      });

      // Add tags if any
      if (tagInput.trim()) {
        const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          await addTags.mutateAsync({
            entityId,
            itemId: triageItem.uid,
            tags,
          });
        }
      }

      // Remove needs_detail flag
      await updateItem.mutateAsync({
        entityId,
        itemId: triageItem.uid,
        updates: { needs_detail: false },
      });

      setShowTriage(false);
      setTriageItem(null);
      setSelectedTraits([]);
      setTagInput('');
      Alert.alert('Success', 'Item triaged!');
    } catch (error) {
      Alert.alert('Error', 'Failed to triage item');
    }
  };

  const handleDeleteTriageItem = async () => {
    if (!triageItem) return;

    try {
      await deleteItem.mutateAsync({
        entityId,
        itemId: triageItem.uid,
      });
      setShowTriage(false);
      setTriageItem(null);
      Alert.alert('Success', 'Item deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const toggleTrait = (trait: Trait) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter((t) => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const allTraits: Trait[] = ['actionable', 'recurring', 'habit', 'chore', 'reminder', 'note'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{inboxItems.length}</Text>
        </View>
      </View>

      {inboxItems.length > 0 && (
        <TouchableOpacity style={styles.triageButton} onPress={handleTriageNext}>
          <Ionicons name="swap-horizontal" size={20} color="#fff" />
          <Text style={styles.triageButtonText}>Start Triage</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.inboxItem}
            onPress={() => {
              setTriageItem(item);
              setSelectedTraits(item.traits as Trait[]);
              setShowTriage(true);
            }}
          >
            <Text style={styles.inboxItemTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.inboxItemDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Inbox is empty</Text>
            <Text style={styles.emptySubtext}>
              Use the + button to quickly capture ideas
            </Text>
          </View>
        }
      />

      <FloatingActionButton onPress={() => setShowQuickCapture(true)} />

      {/* Quick Capture Modal */}
      <Modal
        visible={showQuickCapture}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickCapture(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuickCapture(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Capture</Text>
            <TouchableOpacity onPress={handleQuickCapture}>
              <Text style={styles.saveButton}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.quickInput}
              placeholder="What do you need to do?"
              value={quickCaptureText}
              onChangeText={setQuickCaptureText}
              multiline
              autoFocus
              onSubmitEditing={handleQuickCapture}
            />
          </View>
        </View>
      </Modal>

      {/* Triage Modal */}
      <Modal
        visible={showTriage}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowTriage(false)}
      >
        {triageItem && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTriage(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Triage</Text>
              <TouchableOpacity onPress={handleSaveTriage}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.triageTitle}>{triageItem.title}</Text>
              {triageItem.description && (
                <Text style={styles.triageDesc}>{triageItem.description}</Text>
              )}

              <Text style={styles.sectionTitle}>Traits</Text>
              <View style={styles.traitGrid}>
                {allTraits.map((trait) => (
                  <TouchableOpacity
                    key={trait}
                    style={[
                      styles.traitButton,
                      selectedTraits.includes(trait) && styles.traitButtonActive,
                    ]}
                    onPress={() => toggleTrait(trait)}
                  >
                    <Text
                      style={[
                        styles.traitButtonText,
                        selectedTraits.includes(trait) && styles.traitButtonTextActive,
                      ]}
                    >
                      {trait}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Tags</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tags separated by commas"
                value={tagInput}
                onChangeText={setTagInput}
              />

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteTriageItem}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  headerBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  triageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  triageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inboxItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inboxItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inboxItemDesc: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickInput: {
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  triageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  triageDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  traitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  traitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  traitButtonText: {
    fontSize: 14,
    color: '#666',
  },
  traitButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
