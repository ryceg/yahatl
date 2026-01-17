/**
 * Notes screen with browser and flesh out mode
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SectionList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  useItems,
  useUpdateItem,
  useFlagNeedsDetail,
  useLists,
} from '../hooks/useYahatl';
import ItemCard from '../components/ItemCard';
import type { YahtlItem } from '../types';

export default function NotesScreen() {
  const { config } = useAuth();
  const { data: lists } = useLists();
  const defaultListId = config?.default_list_id || lists?.[0]?.list_id;
  const entityId = defaultListId ? `todo.${defaultListId}` : '';

  const [activeTab, setActiveTab] = useState<'notes' | 'flesh-out'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<YahtlItem | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const { data: items } = useItems(entityId);
  const updateItem = useUpdateItem();
  const flagNeedsDetail = useFlagNeedsDetail();

  // Filter notes (items with 'note' trait)
  const notes = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => item.traits.includes('note'));
  }, [items]);

  // Filter items needing detail
  const needsDetailItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => item.needs_detail && !item.traits.includes('note'));
  }, [items]);

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter notes by search and tags
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((note) =>
        selectedTags.some((tag) => note.tags.includes(tag))
      );
    }

    return filtered;
  }, [notes, searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleEditItem = (item: YahtlItem) => {
    setSelectedItem(item);
    setEditingTitle(item.title);
    setEditingDescription(item.description || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
      await updateItem.mutateAsync({
        entityId,
        itemId: selectedItem.uid,
        updates: {
          title: editingTitle,
          description: editingDescription,
        },
      });

      // If it was in flesh-out mode, mark as detailed
      if (selectedItem.needs_detail) {
        await flagNeedsDetail.mutateAsync({
          entityId,
          itemId: selectedItem.uid,
          needsDetail: false,
        });
      }

      setSelectedItem(null);
      Alert.alert('Success', 'Item updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'notes' ? 'Notes' : 'Flesh Out'}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text
            style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}
          >
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'flesh-out' && styles.tabActive]}
          onPress={() => setActiveTab('flesh-out')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'flesh-out' && styles.tabTextActive,
            ]}
          >
            Needs Detail ({needsDetailItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notes' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <View style={styles.tagsContainer}>
              <FlatList
                horizontal
                data={allTags}
                keyExtractor={(item) => item}
                renderItem={({ item: tag }) => (
                  <TouchableOpacity
                    style={[
                      styles.tagChip,
                      selectedTags.includes(tag) && styles.tagChipActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        selectedTags.includes(tag) && styles.tagChipTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContent}
              />
            </View>
          )}

          {/* Notes List */}
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={() => handleEditItem(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery || selectedTags.length > 0
                    ? 'No notes found'
                    : 'No notes yet'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          {/* Flesh Out List */}
          <FlatList
            data={needsDetailItems}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.fleshOutItem}
                onPress={() => handleEditItem(item)}
              >
                <View style={styles.fleshOutItemContent}>
                  <Text style={styles.fleshOutItemTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.fleshOutItemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>All items are detailed!</Text>
              </View>
            }
          />
        </>
      )}

      {/* Edit Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={handleSaveEdit}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="Enter title"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingDescription}
                onChangeText={setEditingDescription}
                placeholder="Enter description"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              {selectedItem.needs_detail && (
                <View style={styles.notice}>
                  <Ionicons name="information-circle" size={20} color="#007AFF" />
                  <Text style={styles.noticeText}>
                    This item will be marked as detailed when you save
                  </Text>
                </View>
              )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tagsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  tagsContent: {
    paddingHorizontal: 16,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#007AFF',
  },
  tagChipText: {
    fontSize: 14,
    color: '#666',
  },
  tagChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  fleshOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  fleshOutItemContent: {
    flex: 1,
  },
  fleshOutItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fleshOutItemDesc: {
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 150,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
});
