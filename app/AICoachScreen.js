import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Modal, TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOTIVATIONAL_QUOTES, TRANSLATIONS, containsProfanity } from '../src/utils/inspirations';
import AdBanner from '../src/components/AdBanner';
const AICoachScreen = () => {
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuoteName, setNewQuoteName] = useState('');
  const [newQuoteText, setNewQuoteText] = useState('');
  const [customQuotes, setCustomQuotes] = useState([]);
  // Load custom quotes on mount
  useEffect(() => {
    loadCustomQuotes();
  }, []);
  // Load and filter quotes when category changes
  useEffect(() => {
    loadQuotes();
  }, [selectedCategory, customQuotes]);
  const loadCustomQuotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('customQuotes');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomQuotes(parsed);
      }
    } catch (err) {
      console.error('Failed to load custom quotes:', err);
    }
  };
  const saveCustomQuotes = async (quotes) => {
    try {
      await AsyncStorage.setItem('customQuotes', JSON.stringify(quotes));
      setCustomQuotes(quotes);
    } catch (err) {
      console.error('Failed to save custom quotes:', err);
    }
  };
  const loadQuotes = () => {
    let allQuotes = [];
    // Add quotes from inspirations.js
    const quotesFromLib = MOTIVATIONAL_QUOTES.map(q => ({
      ...q,
      isCustom: false
    }));
    // Add custom quotes
    const customWithCategory = customQuotes.map(cq => ({
      player: cq.name,
      quote: cq.text,
      category: 'custom',
      isCustom: true
    }));
    allQuotes = [...quotesFromLib, ...customWithCategory];
    // Filter by category
    let filtered = allQuotes;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'custom') {
        filtered = allQuotes.filter(q => q.isCustom);
      } else {
        filtered = allQuotes.filter(q => q.category === selectedCategory);
      }
    }
    // Shuffle and limit to 10 quotes
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    setFilteredQuotes(shuffled.slice(0, 10));
  };
  const handleRefresh = () => {
    loadQuotes();
    Alert.alert('Refreshed', 'New quotes loaded!');
  };
  const handleAddQuote = () => {
    if (!newQuoteName.trim() || !newQuoteText.trim()) {
      Alert.alert('Error', TRANSLATIONS[selectedLanguage].emptyFieldsError);
      return;
    }
    if (containsProfanity(newQuoteText) || containsProfanity(newQuoteName)) {
      Alert.alert('Error', TRANSLATIONS[selectedLanguage].profanityError);
      return;
    }
    const newQuote = {
      id: Date.now().toString(),
      name: newQuoteName.trim(),
      text: newQuoteText.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedQuotes = [...customQuotes, newQuote];
    saveCustomQuotes(updatedQuotes);
    setNewQuoteName('');
    setNewQuoteText('');
    setShowAddModal(false);
    Alert.alert('Success', TRANSLATIONS[selectedLanguage].successMessage);
  };
  const getCategoryIcon = (category) => {
    const icons = {
      football: '⚽', basketball: '🏀', tennis: '🎾',
      boxing: '🥊', athletics: '🏃', gymnastics: '🤸',
      coach: '👔', business: '💼', entertainment: '🎬',
      leadership: '👑', wisdom: '📚', motivation: '🔥',
      productivity: '⚡', custom: '📝'
    };
    return icons[category] || '💭';
  };
  const getCategoryLabel = (category) => {
    const labels = {
      football: TRANSLATIONS[selectedLanguage].football,
      basketball: TRANSLATIONS[selectedLanguage].basketball,
      tennis: TRANSLATIONS[selectedLanguage].tennis,
      boxing: TRANSLATIONS[selectedLanguage].boxing,
      athletics: TRANSLATIONS[selectedLanguage].athletics,
      gymnastics: TRANSLATIONS[selectedLanguage].gymnastics,
      coach: TRANSLATIONS[selectedLanguage].coach,
      business: TRANSLATIONS[selectedLanguage].business,
      entertainment: TRANSLATIONS[selectedLanguage].entertainment,
      leadership: TRANSLATIONS[selectedLanguage].leadership,
      wisdom: TRANSLATIONS[selectedLanguage].wisdom,
      motivation: TRANSLATIONS[selectedLanguage].motivation,
      productivity: TRANSLATIONS[selectedLanguage].productivity,
      custom: TRANSLATIONS[selectedLanguage].customQuotes
    };
    return labels[category] || category;
  };
  const t = TRANSLATIONS[selectedLanguage];
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1b2a' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>⬅️ {t.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={styles.languageText}>
              🌐 {selectedLanguage.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>🌟 {t.dailyWisdom}</Text>
        <Text style={styles.subtitle}>{t.inspirationFrom}</Text>
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive
            ]}>
              📊 {t.all}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'football' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('football')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'football' && styles.categoryChipTextActive
            ]}>
              ⚽ {t.football}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'motivation' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('motivation')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'motivation' && styles.categoryChipTextActive
            ]}>
              🔥 {t.motivation}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'leadership' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('leadership')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'leadership' && styles.categoryChipTextActive
            ]}>
              👑 {t.leadership}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'wisdom' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('wisdom')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'wisdom' && styles.categoryChipTextActive
            ]}>
              📚 {t.wisdom}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'custom' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('custom')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'custom' && styles.categoryChipTextActive
            ]}>
              📝 {t.customQuotes}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {/* Add Quote Button */}
        <TouchableOpacity 
          style={styles.addQuoteButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addQuoteButtonText}>➕ {t.addQuote}</Text>
        </TouchableOpacity>
        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshButtonText}>🔄 {t.refreshQuotes}</Text>
        </TouchableOpacity>
        {/* Quotes Display */}
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((quote, index) => (
            <View key={index} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteCategory}>
                  {getCategoryIcon(quote.category)} {getCategoryLabel(quote.category)}
                </Text>
                {quote.isCustom && (
                  <Text style={styles.customBadge}>Custom</Text>
                )}
              </View>
              <Text style={styles.quoteText}>"{quote.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {quote.player}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No quotes found</Text>
            <Text style={styles.emptySubtext}>Try a different category or add your own!</Text>
          </View>
        )}
        {/* Language Picker Modal */}
        <Modal
          visible={showLanguagePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
              {['en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'it'].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageItem,
                    selectedLanguage === lang && styles.languageItemActive
                  ]}
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.languageItemText}>{lang.toUpperCase()}</Text>
                  {selectedLanguage === lang && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowLanguagePicker(false)}
              >
                <Text style={styles.closeModalText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Add Quote Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.addQuote}</Text>
              <Text style={styles.inputLabel}>{t.yourName}</Text>
              <TextInput
                style={styles.input}
                value={newQuoteName}
                onChangeText={setNewQuoteName}
                placeholder="e.g., Your Name"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputLabel}>{t.yourQuote}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newQuoteText}
                onChangeText={setNewQuoteText}
                placeholder={t.yourQuote}
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddQuote}
                >
                  <Text style={styles.submitButtonText}>{t.submit}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {/* Ad Banner */}
      <AdBanner />
    </View>
  );
};
export default AICoachScreen;
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8 },
  backText: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold' },
  languageButton: { backgroundColor: '#1b263b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  languageText: { color: '#ffd700', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#a8dadc', marginBottom: 20, textAlign: 'center' },
  categoryScroll: { marginBottom: 16 },
  categoryChip: { 
    backgroundColor: '#1b263b', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a3f5f'
  },
  categoryChipActive: { backgroundColor: '#ffd700', borderColor: '#ffd700' },
  categoryChipText: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#0d1b2a' },
  addQuoteButton: { 
    backgroundColor: '#28a745', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  addQuoteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  refreshButton: { 
    backgroundColor: '#6c5ce7', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyState: { 
    alignItems: 'center', 
    padding: 30, 
    backgroundColor: '#1b263b', 
    borderRadius: 12, 
    marginBottom: 20 
  },
  emptyText: { color: '#f1faee', fontSize: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { color: '#a8dadc', fontSize: 14, textAlign: 'center' },
  quoteCard: { 
    backgroundColor: '#1b263b', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700'
  },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quoteCategory: { fontSize: 14, fontWeight: 'bold', color: '#ffd700' },
  customBadge: { 
    backgroundColor: '#ffd700', 
    color: '#0d1b2a', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold'
  },
  quoteText: { fontSize: 15, color: '#f1faee', marginBottom: 10, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 14, color: '#a8dadc', textAlign: 'right', fontWeight: '600' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    backgroundColor: '#1b263b', 
    borderRadius: 16, 
    padding: 24, 
    width: '85%', 
    maxHeight: '80%' 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffd700', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#a8dadc', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { 
    backgroundColor: '#0d1b2a', 
    color: '#f1faee', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    fontSize: 15
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  cancelButton: { backgroundColor: '#6c757d' },
  cancelButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  submitButton: { backgroundColor: '#28a745' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  languageItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 14, 
    backgroundColor: '#0d1b2a', 
    borderRadius: 8, 
    marginBottom: 8 
  },
  languageItemActive: { backgroundColor: '#1e3a5f', borderWidth: 1, borderColor: '#ffd700' },
  languageItemText: { color: '#f1faee', fontSize: 15 },
  checkmark: { color: '#ffd700', fontSize: 20, fontWeight: 'bold' },
  closeModalButton: { 
    backgroundColor: '#6c757d', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 16 
  },
  closeModalText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
