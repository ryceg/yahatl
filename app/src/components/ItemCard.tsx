/**
 * Reusable item card component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { YahtlItem, QueueItem } from '../types';

interface ItemCardProps {
  item: YahtlItem | QueueItem;
  onPress: () => void;
  onComplete?: () => void;
  showScore?: boolean;
}

const TRAIT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  actionable: 'checkmark-circle',
  recurring: 'repeat',
  habit: 'fitness',
  chore: 'home',
  reminder: 'notifications',
  note: 'document-text',
};

const TRAIT_COLORS: Record<string, string> = {
  actionable: '#007AFF',
  recurring: '#5856D6',
  habit: '#34C759',
  chore: '#FF9500',
  reminder: '#FF2D55',
  note: '#8E8E93',
};

export default function ItemCard({ item, onPress, onComplete, showScore = false }: ItemCardProps) {
  const isQueueItem = 'score' in item;
  const queueItem = item as QueueItem;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          {showScore && isQueueItem && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(queueItem.score)}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.meta}>
          <View style={styles.traits}>
            {item.traits.slice(0, 3).map((trait) => (
              <View key={trait} style={styles.trait}>
                <Ionicons
                  name={TRAIT_ICONS[trait] || 'help-circle'}
                  size={16}
                  color={TRAIT_COLORS[trait] || '#8E8E93'}
                />
              </View>
            ))}
          </View>

          {item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 2 && (
                <Text style={styles.tagMore}>+{item.tags.length - 2}</Text>
              )}
            </View>
          )}

          {item.time_estimate && (
            <View style={styles.timeEstimate}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.timeText}>{item.time_estimate}m</Text>
            </View>
          )}

          {item.due && (
            <View style={styles.due}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dueText}>
                {new Date(item.due).toLocaleDateString()}
              </Text>
            </View>
          )}

          {item.current_streak > 0 && (
            <View style={styles.streak}>
              <Ionicons name="flame" size={14} color="#FF9500" />
              <Text style={styles.streakText}>{item.current_streak}</Text>
            </View>
          )}
        </View>
      </View>

      {onComplete && (
        <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
          <Ionicons name="checkmark-circle" size={32} color="#34C759" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  scoreBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  traits: {
    flexDirection: 'row',
    gap: 4,
  },
  trait: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  tagMore: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 4,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 12,
    color: '#666',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  completeButton: {
    marginLeft: 12,
    justifyContent: 'center',
  },
});
