import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { PROMPTS, ProfilePrompt, MAX_PROMPTS, PROMPT_CATEGORIES } from '../constants/prompts';

interface Props {
  prompts: ProfilePrompt[];
  onChange: (prompts: ProfilePrompt[]) => void;
}

// ─── Carte prompt ─────────────────────────────────────────────────────────────

function PromptCard({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: ProfilePrompt;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const def = PROMPTS.find(p => p.id === prompt.promptId);
  if (!def) return null;

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.emoji}>{def.emoji}</Text>
        <Text style={cardStyles.question} numberOfLines={2}>{def.question}</Text>
        <View style={cardStyles.actions}>
          <TouchableOpacity onPress={onEdit} style={cardStyles.actionBtn}>
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={cardStyles.actionBtn}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={cardStyles.answer}>{prompt.answer}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  emoji: { fontSize: 18, marginTop: 1 },
  question: { flex: 1, color: Colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { padding: 4 },
  answer: { color: Colors.text, fontSize: 14, fontWeight: '500', lineHeight: 20 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function PromptEditor({ prompts, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('fun');

  const canAdd = prompts.length < MAX_PROMPTS;

  const handleAdd = () => {
    setEditingIndex(null);
    setSelectedPromptId(null);
    setAnswer('');
    setShowPicker(true);
  };

  const handleEdit = (index: number) => {
    const p = prompts[index];
    setEditingIndex(index);
    setSelectedPromptId(p.promptId);
    setAnswer(p.answer);
    setShowPicker(true);
  };

  const handleDelete = (index: number) => {
    Alert.alert('Supprimer ce prompt ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const next = prompts.filter((_, i) => i !== index);
          onChange(next);
        },
      },
    ]);
  };

  const handleSave = () => {
    if (!selectedPromptId) {
      Alert.alert('Choisissez une question');
      return;
    }
    if (!answer.trim()) {
      Alert.alert('Écrivez votre réponse');
      return;
    }

    const newPrompt: ProfilePrompt = { promptId: selectedPromptId, answer: answer.trim() };
    let next: ProfilePrompt[];

    if (editingIndex !== null) {
      next = prompts.map((p, i) => i === editingIndex ? newPrompt : p);
    } else {
      next = [...prompts, newPrompt];
    }

    onChange(next);
    setShowPicker(false);
  };

  const filteredPrompts = PROMPTS.filter(p => p.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* Prompts existants */}
      {prompts.map((p, i) => (
        <PromptCard
          key={p.promptId}
          prompt={p}
          onEdit={() => handleEdit(i)}
          onDelete={() => handleDelete(i)}
        />
      ))}

      {/* Bouton ajouter */}
      {canAdd && (
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addText}>
            Ajouter une question ({prompts.length}/{MAX_PROMPTS})
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.hint}>
        Les questions apparaissent sur votre profil et déclenchent les conversations
      </Text>

      {/* Modal sélection question + réponse */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Modifier la question' : 'Ajouter une question'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveBtn}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Catégories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {PROMPT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={[
                    styles.catChip,
                    activeCategory === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.catLabel,
                    activeCategory === cat.id && { color: cat.color },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Questions */}
            <View style={styles.questionsGrid}>
              {filteredPrompts.map(p => {
                const selected = selectedPromptId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedPromptId(p.id)}
                    style={[styles.questionCard, selected && styles.questionCardSelected]}
                    activeOpacity={0.8}
                  >
                    {selected && (
                      <LinearGradient
                        colors={Colors.gradientPrimary}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <Text style={styles.questionEmoji}>{p.emoji}</Text>
                    <Text style={[styles.questionText, selected && styles.questionTextSelected]}>
                      {p.question}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" style={styles.questionCheck} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Zone de réponse */}
            {selectedPromptId && (
              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>
                  {PROMPTS.find(p => p.id === selectedPromptId)?.question}
                </Text>
                <TextInput
                  style={styles.answerInput}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Votre réponse..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={150}
                  autoFocus
                />
                <Text style={styles.charCount}>{answer.length}/150</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  hint: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Modal
  modal: { flex: 1, backgroundColor: '#1A0A35' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  saveBtn: { color: Colors.primary, fontSize: 15, fontWeight: '700' },

  categoriesRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

  questionsGrid: { paddingHorizontal: 16, gap: 10 },
  questionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  questionCardSelected: { borderColor: 'transparent' },
  questionEmoji: { fontSize: 20, width: 28 },
  questionText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  questionTextSelected: { color: '#FFF', fontWeight: '600' },
  questionCheck: { marginLeft: 4 },

  answerSection: {
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 10,
  },
  answerLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  answerInput: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  charCount: { color: Colors.textMuted, fontSize: 11, textAlign: 'right' },
});
