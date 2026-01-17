/**
 * Planning screen with priority queue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueue, useCompleteItem, useUpdateContext } from '../hooks/useYahatl';
import { usePomodoro } from '../context/PomodoroContext';
import ItemCard from '../components/ItemCard';
import type { QueueItem } from '../types';

export default function PlanningScreen() {
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [location, setLocation] = useState('');
  const [availableTime, setAvailableTime] = useState('');

  const { data: queue, isLoading, refetch } = useQueue();
  const completeItem = useCompleteItem();
  const updateContext = useUpdateContext();
  const { state: pomodoroState, start: startPomodoro } = usePomodoro();

  const handleComplete = async (item: QueueItem) => {
    try {
      await completeItem.mutateAsync({
        entityId: item.list_id || '',
        itemId: item.uid,
      });
      Alert.alert('Success', 'Item completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete item');
    }
  };

  const handleUpdateContext = async () => {
    try {
      await updateContext.mutateAsync({
        location: location || undefined,
        available_time: availableTime ? parseInt(availableTime) : undefined,
      });
      setShowContextModal(false);
      setLocation('');
      setAvailableTime('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update context');
    }
  };

  const handleStartPomodoro = (item: QueueItem) => {
    startPomodoro(item.uid, item.title);
    Alert.alert('Pomodoro Started', `Working on: ${item.title}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Priority Queue</Text>
        <TouchableOpacity onPress={() => setShowContextModal(true)}>
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {pomodoroState.active && (
        <View style={styles.pomodoroBar}>
          <Ionicons name="timer" size={20} color="#fff" />
          <Text style={styles.pomodoroText}>
            {pomodoroState.is_break ? 'Break' : 'Working'} •{' '}
            {Math.floor(pomodoroState.time_remaining / 60)}:
            {String(pomodoroState.time_remaining % 60).padStart(2, '0')}
          </Text>
        </View>
      )}

      <FlatList
        data={queue || []}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => setSelectedItem(item)}
            onComplete={() => handleComplete(item)}
            showScore
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tasks in queue</Text>
          </View>
        }
      />

      {/* Item Detail Modal */}
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
              <Text style={styles.modalTitle}>{selectedItem.title}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.modalContent}>
              {selectedItem.description && (
                <Text style={styles.modalDescription}>{selectedItem.description}</Text>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Score Breakdown</Text>
                {Object.entries(selectedItem.score_breakdown).map(([key, value]) => (
                  <View key={key} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.scoreValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleStartPomodoro(selectedItem)}
                >
                  <Ionicons name="timer-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Start Pomodoro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.successButton]}
                  onPress={() => {
                    handleComplete(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Context Modal */}
      <Modal
        visible={showContextModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContextModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContextModal(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Context</Text>
            <TouchableOpacity onPress={handleUpdateContext}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., home, office, out"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.inputLabel}>Available Time (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              value={availableTime}
              onChangeText={setAvailableTime}
              keyboardType="number-pad"
            />
          </View>
        </View>
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
  pomodoroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    padding: 12,
    gap: 8,
  },
  pomodoroText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
});
