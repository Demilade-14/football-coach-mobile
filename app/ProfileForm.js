// app/ProfileForm.js
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity, 
  Alert, Image, Modal, FlatList, Platform, Dimensions 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import DraggableSlider from '../src/components/DraggableSlider';
import PlayerCardFC26 from '../src/components/PlayerCardFC26';
import { 
  calculateOverall, 
  getImprovementTips, 
  recommendPosition, 
  getMaxStatByAge,
  getMinStatByAge,
  savePlayer,
  getTotalPlayersCount,
  canSaveMorePlayers
} from '../src/utils/playerDatabase';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;
const ProfileForm = () => {
  const router = useRouter();
  // State declarations
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('15');
  const [height, setHeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [club, setClub] = useState('');
  const [jersey, setJersey] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [skillMoves, setSkillMoves] = useState(3);
  const [weakFoot, setWeakFoot] = useState(3);
  const [image, setImage] = useState(null);
  const [disability, setDisability] = useState(false);
  const [mentalStress, setMentalStress] = useState(false);
  const [template, setTemplate] = useState('Custom');
  const [formProgress, setFormProgress] = useState(0);
  const [cardData, setCardData] = useState(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [attrs, setAttrs] = useState({
    acceleration: 0, sprintSpeed: 0, finishing: 0, shotPower: 0, longShots: 0,
    volleys: 0, penalties: 0, vision: 0, crossing: 0, shortPassing: 0,
    longPassing: 0, curve: 0, agility: 0, balance: 0, reactions: 0,
    ballControl: 0, dribbling: 0, composure: 0, interceptions: 0,
    headingAccuracy: 0, marking: 0, standingTackle: 0, slidingTackle: 0,
    jumping: 0, stamina: 0, strength: 0, aggression: 0, diving: 0,
    handling: 0, kicking: 0, positioning: 0, reflexes: 0,
  });
  const calculateAgeFromDOB = (dob) => {
    if (!dob) return '15';
    const birthDate = new Date(dob);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ageYears--;
    return Math.max(4, Math.min(56, ageYears)).toString();
  };
  const getMaxStarsByAge = (ageStr) => {
    const numAge = parseInt(ageStr) || 15;
    if (numAge < 12) return 3;
    if (numAge < 16) return 4;
    return 5;
  };
  // Update card data when form changes
  useEffect(() => {
    const numAge = parseInt(age) || 15;
    const opts = { disability, mentalStress };
    // Safe calls with fallbacks
    const overall = typeof calculateOverall === 'function' 
      ? calculateOverall(attrs, numAge, opts) 
      : 50;
    const positions = typeof recommendPosition === 'function'
      ? recommendPosition(attrs, numAge, preferredFoot)
      : 'Midfielder';
    const tips = typeof getImprovementTips === 'function'
      ? getImprovementTips(positions, attrs, opts)
      : ['Complete your profile for tips'];
    setCardData(prev => prev ? {
      ...prev,
      age: numAge,
      height,
      preferredFoot,
      nationality,
      club,
      jersey,
      skillMoves,
      weakFoot,
      image,
      attrs,
      overall,
      positions,
      tips,
    } : null);
  }, [name, age, height, preferredFoot, nationality, club, jersey, skillMoves, weakFoot, image, attrs, disability, mentalStress]);
  // Update form progress
  useEffect(() => {
    const fields = [name, age, height, nationality, club];
    const attributeCount = Object.values(attrs).filter(val => val > 0).length;
    const basicProgress = fields.filter(field => field && field.toString().trim()).length / fields.length;
    const attrProgress = attributeCount / Object.keys(attrs).length;
    setFormProgress(Math.round((basicProgress * 0.3 + attrProgress * 0.7) * 100));
  }, [name, age, height, nationality, club, attrs]);
  // Request image permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to photos to add your face!');
      }
    })();
  }, []);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const templates = {
    'Striker': { finishing: 85, shotPower: 82, acceleration: 78, sprintSpeed: 79 },
    'Winger': { acceleration: 85, sprintSpeed: 82, dribbling: 80, crossing: 75 },
    'Midfielder': { shortPassing: 80, vision: 78, stamina: 80, ballControl: 75 },
    'Defender': { interceptions: 80, standingTackle: 82, marking: 80, headingAccuracy: 75 },
    'Goalkeeper': { reflexes: 85, handling: 82, positioning: 78, diving: 80 },
  };
  const applyTemplate = (templateName) => {
    const numAge = parseInt(age) || 15;
    const maxStat = typeof getMaxStatByAge === 'function' 
      ? getMaxStatByAge(numAge, 'pace') 
      : 99;
    const base = { ...attrs };
    Object.keys(base).forEach(key => base[key] = 0);
    const updates = templates[templateName] || {};
    const clampedUpdates = {};
    Object.keys(updates).forEach(key => {
      clampedUpdates[key] = Math.min(maxStat, updates[key]);
    });
    setAttrs({ ...base, ...clampedUpdates });
    setTemplate(templateName);
  };
  const handleSubmit = async () => {
    const numAge = parseInt(age) || 15;
    if (numAge < 4 || numAge > 56) {
      Alert.alert('Invalid Age', 'Please enter an age between 4 and 56.');
      return;
    }
    const opts = { disability, mentalStress };
    const overall = typeof calculateOverall === 'function' 
      ? calculateOverall(attrs, numAge, opts) 
      : 50;
    const positions = typeof recommendPosition === 'function'
      ? recommendPosition(attrs, numAge, preferredFoot)
      : 'Midfielder';
    const tips = typeof getImprovementTips === 'function'
      ? getImprovementTips(positions, attrs, opts)
      : ['Complete your profile for tips'];
    const data = {
      id: Date.now().toString(),
      name: name || "Anonymous",
      age: numAge,
      height,
      preferredFoot,
      nationality,
      club,
      jersey,
      skillMoves,
      weakFoot,
      image,
      attrs,
      overall,
      positions,
      tips,
      createdAt: new Date().toISOString(),
    };
    setCardData(data);
    try {
      const totalPlayers = typeof getTotalPlayersCount === 'function' 
        ? await getTotalPlayersCount() 
        : 0;
      const canSave = typeof canSaveMorePlayers === 'function'
        ? await canSaveMorePlayers(totalPlayers)
        : totalPlayers < 5;
      if (!canSave) {
        Alert.alert(
          'Player Limit Reached',
          'You can save up to 5 players on the FREE plan. Upgrade to VIP for unlimited saves!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to VIP', onPress: () => router.push('/VIPSubscription') },
          ]
        );
        return;
      }
      const saveResult = typeof savePlayer === 'function'
        ? await savePlayer(data)
        : { success: true };
      if (saveResult?.success) {
        Alert.alert('Success!', 'Player card generated!', [
          {
            text: 'View Card',
            onPress: () => router.push('/PlayerCardScreen')
          },
        ]);
      } else {
        Alert.alert('Error', saveResult?.error || 'Failed to save player');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>? Player Profile</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Profile Completion: {formProgress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${formProgress}%` }]} />
        </View>
      </View>
      <View style={styles.imageSection}>
        <Text style={styles.label}>?? Add Your Face (Optional)</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
          {image ? (
            <Image source={{ uri: image }} style={styles.playerImage} />
          ) : (
            <Text style={styles.imageButtonText}>+ Choose Photo</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>? Quick Templates</Text>
      <View style={styles.templateGrid}>
        {['Custom', 'Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'].map((temp) => (
          <TouchableOpacity
            key={temp}
            onPress={() => applyTemplate(temp)}
            style={[styles.templateButton, template === temp && styles.templateButtonActive]}
          >
            <Text style={[styles.templateText, template === temp && styles.templateTextActive]}>{temp}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Name (optional)" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={(text) => { setDateOfBirth(text); if (text) setAge(calculateAgeFromDOB(text)); }}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Age (4-56)"
        value={age}
        onChangeText={(text) => { const n = parseInt(text)||4; if (n>=4 && n<=56) setAge(text); }}
        keyboardType="numeric"
      />
      <TextInput style={styles.input} placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
      <TouchableOpacity style={styles.input} onPress={() => setShowCountryPicker(true)}>
        <Text style={nationality ? styles.selectedCountry : styles.placeholderText}>
          {nationality || '?? Select Nationality'}
        </Text>
      </TouchableOpacity>
      <TextInput style={styles.input} placeholder="Club / Team" value={club} onChangeText={setClub} />
      <TextInput style={styles.input} placeholder="Jersey Number" value={jersey} onChangeText={setJersey} keyboardType="numeric" />
      <Text style={styles.label}>?? Preferred Foot</Text>
      <View style={styles.footOptions}>
        {['Right', 'Left', 'Both'].map((foot) => (
          <TouchableOpacity
            key={foot}
            style={[styles.footButton, preferredFoot === foot && styles.footButtonActive]}
            onPress={() => setPreferredFoot(foot)}
          >
            <Text style={[styles.footText, preferredFoot === foot && styles.footTextActive]}>{foot}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.skillRow}>
        <View style={styles.skillItem}>
          <Text style={styles.label}>? Skill Moves</Text>
          <View style={styles.starContainer}>
            {[...Array(5)].map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setSkillMoves(i + 1)} style={styles.starButton}>
                <Text style={[styles.star, i < skillMoves ? styles.starActive : styles.starInactive]}>
                  {i < skillMoves ? '?' : '?'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.suggestionText}>Max {getMaxStarsByAge(age)}? for age {age}</Text>
        </View>
        <View style={styles.skillItem}>
          <Text style={styles.label}>?? Weak Foot</Text>
          <View style={styles.starContainer}>
            {[...Array(5)].map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setWeakFoot(i + 1)} style={styles.starButton}>
                <Text style={[styles.star, i < weakFoot ? styles.starActive : styles.starInactive]}>
                  {i < weakFoot ? '?' : '?'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.suggestionText}>Max {getMaxStarsByAge(age)}? for age {age}</Text>
        </View>
      </View>
      <View style={styles.conditionsSection}>
        <TouchableOpacity style={[styles.conditionButton, disability && styles.conditionActive]} onPress={() => setDisability(!disability)}>
          <Text style={[styles.conditionText, disability && styles.conditionTextActive]}>? Disability Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.conditionButton, mentalStress && styles.conditionActive]} onPress={() => setMentalStress(!mentalStress)}>
          <Text style={[styles.conditionText, mentalStress && styles.conditionTextActive]}>?? Mental Health Support</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>?? Player Attributes</Text>
      <Text style={styles.categoryTitle}>?? Pace</Text>
      <DraggableSlider label="Acceleration" value={attrs.acceleration} onChange={(value) => setAttrs({ ...attrs, acceleration: value })} age={parseInt(age)} statName="acceleration" />
      <DraggableSlider label="Sprint Speed" value={attrs.sprintSpeed} onChange={(value) => setAttrs({ ...attrs, sprintSpeed: value })} age={parseInt(age)} statName="sprintSpeed" />
      <Text style={styles.categoryTitle}>? Shooting</Text>
      <DraggableSlider label="Finishing" value={attrs.finishing} onChange={(value) => setAttrs({ ...attrs, finishing: value })} age={parseInt(age)} statName="finishing" />
      <DraggableSlider label="Shot Power" value={attrs.shotPower} onChange={(value) => setAttrs({ ...attrs, shotPower: value })} age={parseInt(age)} statName="shotPower" />
      <DraggableSlider label="Long Shots" value={attrs.longShots} onChange={(value) => setAttrs({ ...attrs, longShots: value })} age={parseInt(age)} statName="longShots" />
      <DraggableSlider label="Volleys" value={attrs.volleys} onChange={(value) => setAttrs({ ...attrs, volleys: value })} age={parseInt(age)} statName="volleys" />
      <DraggableSlider label="Penalties" value={attrs.penalties} onChange={(value) => setAttrs({ ...attrs, penalties: value })} age={parseInt(age)} statName="penalties" />
      <Text style={styles.categoryTitle}>?? Passing</Text>
      <DraggableSlider label="Vision" value={attrs.vision} onChange={(value) => setAttrs({ ...attrs, vision: value })} age={parseInt(age)} statName="vision" />
      <DraggableSlider label="Crossing" value={attrs.crossing} onChange={(value) => setAttrs({ ...attrs, crossing: value })} age={parseInt(age)} statName="crossing" />
      <DraggableSlider label="Short Passing" value={attrs.shortPassing} onChange={(value) => setAttrs({ ...attrs, shortPassing: value })} age={parseInt(age)} statName="shortPassing" />
      <DraggableSlider label="Long Passing" value={attrs.longPassing} onChange={(value) => setAttrs({ ...attrs, longPassing: value })} age={parseInt(age)} statName="longPassing" />
      <DraggableSlider label="Curve" value={attrs.curve} onChange={(value) => setAttrs({ ...attrs, curve: value })} age={parseInt(age)} statName="curve" />
      <Text style={styles.categoryTitle}>?? Dribbling</Text>
      <DraggableSlider label="Agility" value={attrs.agility} onChange={(value) => setAttrs({ ...attrs, agility: value })} age={parseInt(age)} statName="agility" />
      <DraggableSlider label="Balance" value={attrs.balance} onChange={(value) => setAttrs({ ...attrs, balance: value })} age={parseInt(age)} statName="balance" />
      <DraggableSlider label="Reactions" value={attrs.reactions} onChange={(value) => setAttrs({ ...attrs, reactions: value })} age={parseInt(age)} statName="reactions" />
      <DraggableSlider label="Ball Control" value={attrs.ballControl} onChange={(value) => setAttrs({ ...attrs, ballControl: value })} age={parseInt(age)} statName="ballControl" />
      <DraggableSlider label="Dribbling" value={attrs.dribbling} onChange={(value) => setAttrs({ ...attrs, dribbling: value })} age={parseInt(age)} statName="dribbling" />
      <DraggableSlider label="Composure" value={attrs.composure} onChange={(value) => setAttrs({ ...attrs, composure: value })} age={parseInt(age)} statName="composure" />
      <Text style={styles.categoryTitle}>??? Defending</Text>
      <DraggableSlider label="Interceptions" value={attrs.interceptions} onChange={(value) => setAttrs({ ...attrs, interceptions: value })} age={parseInt(age)} statName="interceptions" />
      <DraggableSlider label="Heading Accuracy" value={attrs.headingAccuracy} onChange={(value) => setAttrs({ ...attrs, headingAccuracy: value })} age={parseInt(age)} statName="headingAccuracy" />
      <DraggableSlider label="Marking" value={attrs.marking} onChange={(value) => setAttrs({ ...attrs, marking: value })} age={parseInt(age)} statName="marking" />
      <DraggableSlider label="Standing Tackle" value={attrs.standingTackle} onChange={(value) => setAttrs({ ...attrs, standingTackle: value })} age={parseInt(age)} statName="standingTackle" />
      <DraggableSlider label="Sliding Tackle" value={attrs.slidingTackle} onChange={(value) => setAttrs({ ...attrs, slidingTackle: value })} age={parseInt(age)} statName="slidingTackle" />
      <Text style={styles.categoryTitle}>?? Physical</Text>
      <DraggableSlider label="Jumping" value={attrs.jumping} onChange={(value) => setAttrs({ ...attrs, jumping: value })} age={parseInt(age)} statName="jumping" />
      <DraggableSlider label="Stamina" value={attrs.stamina} onChange={(value) => setAttrs({ ...attrs, stamina: value })} age={parseInt(age)} statName="stamina" />
      <DraggableSlider label="Strength" value={attrs.strength} onChange={(value) => setAttrs({ ...attrs, strength: value })} age={parseInt(age)} statName="strength" />
      <DraggableSlider label="Aggression" value={attrs.aggression} onChange={(value) => setAttrs({ ...attrs, aggression: value })} age={parseInt(age)} statName="aggression" />
      <Text style={styles.categoryTitle}>?? Goalkeeping</Text>
      <DraggableSlider label="Diving" value={attrs.diving} onChange={(value) => setAttrs({ ...attrs, diving: value })} age={parseInt(age)} statName="diving" />
      <DraggableSlider label="Handling" value={attrs.handling} onChange={(value) => setAttrs({ ...attrs, handling: value })} age={parseInt(age)} statName="handling" />
      <DraggableSlider label="Kicking" value={attrs.kicking} onChange={(value) => setAttrs({ ...attrs, kicking: value })} age={parseInt(age)} statName="kicking" />
      <DraggableSlider label="Positioning" value={attrs.positioning} onChange={(value) => setAttrs({ ...attrs, positioning: value })} age={parseInt(age)} statName="positioning" />
      <DraggableSlider label="Reflexes" value={attrs.reflexes} onChange={(value) => setAttrs({ ...attrs, reflexes: value })} age={parseInt(age)} statName="reflexes" />
      {cardData && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>?? Live Preview</Text>
          <PlayerCardFC26 player={cardData} />
        </View>
      )}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>?? Generate Player Card</Text>
      </TouchableOpacity>
      <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>?? Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}><Text style={styles.closeButton}>?</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} placeholder="?? Search country..." value={countrySearch} onChangeText={setCountrySearch} autoFocus />
            <FlatList
              data={COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => { setNationality(item); setShowCountryPicker(false); setCountrySearch(''); }}>
                  <Text style={styles.countryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
export default ProfileForm;
const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium','Brazil','Canada','China','Denmark','Egypt','England','France','Germany','India','Italy','Japan','Mexico','Netherlands','Nigeria','Norway','Poland','Portugal','Russia','Saudi Arabia','Scotland','South Africa','South Korea','Spain','Sweden','Switzerland','Turkey','Ukraine','United States','Wales'];
const styles = StyleSheet.create({
  container: { 
    padding: isSmallScreen ? 12 : 20, 
    backgroundColor: '#f5f5f5', 
    flexGrow: 1,
    paddingBottom: 40,
  },
  title: { 
    fontSize: isSmallScreen ? 24 : 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: isSmallScreen ? 15 : 20, 
    color: '#2c3e50' 
  },
  progressContainer: { marginBottom: isSmallScreen ? 15 : 20 },
  progressText: { textAlign: 'center', marginBottom: 8, color: '#34495e', fontWeight: '600', fontSize: isSmallScreen ? 12 : 14 },
  progressBar: { height: 8, backgroundColor: '#ecf0f1', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#27ae60', borderRadius: 4 },
  imageSection: { alignItems: 'center', marginBottom: isSmallScreen ? 15 : 20 },
  imageButton: { 
    width: isSmallScreen ? 80 : 100, 
    height: isSmallScreen ? 80 : 100, 
    borderRadius: isSmallScreen ? 40 : 50, 
    backgroundColor: '#3498db', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#2980b9',
  },
  playerImage: { width: '100%', height: '100%', borderRadius: isSmallScreen ? 40 : 50 },
  imageButtonText: { color: 'white', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: isSmallScreen ? 15 : 20, justifyContent: 'center' },
  templateButton: { 
    backgroundColor: '#ecf0f1', 
    padding: isSmallScreen ? 8 : 10, 
    margin: 3, 
    borderRadius: 8, 
    minWidth: isSmallScreen ? 70 : 80, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  templateButtonActive: { backgroundColor: '#3498db', borderColor: '#2980b9' },
  templateText: { color: '#2c3e50', fontWeight: 'bold', fontSize: isSmallScreen ? 10 : 12 },
  templateTextActive: { color: 'white' },
  input: { 
    backgroundColor: 'white', 
    padding: isSmallScreen ? 12 : 15, 
    marginBottom: isSmallScreen ? 8 : 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd',
    fontSize: isSmallScreen ? 14 : 16,
  },
  label: { fontSize: isSmallScreen ? 14 : 16, fontWeight: 'bold', marginBottom: isSmallScreen ? 8 : 10, color: '#2c3e50' },
  footOptions: { flexDirection: 'row', marginBottom: isSmallScreen ? 15 : 20, justifyContent: 'center' },
  footButton: { 
    backgroundColor: '#ecf0f1', 
    padding: isSmallScreen ? 8 : 10, 
    margin: 3, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  footButtonActive: { backgroundColor: '#27ae60', borderColor: '#219653' },
  footText: { color: '#2c3e50', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14 },
  footTextActive: { color: 'white' },
  skillRow: { flexDirection: 'row', marginBottom: isSmallScreen ? 15 : 20, justifyContent: 'space-around' },
  skillItem: { flex: 1, marginHorizontal: isSmallScreen ? 3 : 5, alignItems: 'center' },
  starContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 5 },
  starButton: { padding: 2 },
  star: { fontSize: 20, marginHorizontal: 2 },
  starActive: { color: '#FFD700' },
  starInactive: { color: '#ddd' },
  suggestionText: { fontSize: 10, color: '#3498db', marginBottom: 5, fontStyle: 'italic', textAlign: 'center' },
  conditionsSection: { marginBottom: isSmallScreen ? 15 : 20 },
  conditionButton: { 
    backgroundColor: '#ecf0f1', 
    padding: isSmallScreen ? 12 : 15, 
    marginBottom: isSmallScreen ? 8 : 10, 
    borderRadius: 8, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  conditionActive: { backgroundColor: '#e74c3c', borderColor: '#c0392b' },
  conditionText: { color: '#2c3e50', fontWeight: 'bold', fontSize: isSmallScreen ? 13 : 14 },
  conditionTextActive: { color: 'white' },
  sectionTitle: { 
    fontSize: isSmallScreen ? 18 : 20, 
    fontWeight: 'bold', 
    marginTop: isSmallScreen ? 15 : 20, 
    marginBottom: isSmallScreen ? 12 : 15, 
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    paddingBottom: 5,
  },
  categoryTitle: { 
    fontSize: isSmallScreen ? 14 : 16, 
    fontWeight: 'bold', 
    marginTop: isSmallScreen ? 12 : 15, 
    marginBottom: isSmallScreen ? 8 : 10, 
    color: '#34495e',
    backgroundColor: '#ecf0f1',
    padding: isSmallScreen ? 6 : 8,
    borderRadius: 6,
  },
  previewSection: { marginTop: isSmallScreen ? 15 : 20, alignItems: 'center', padding: isSmallScreen ? 10 : 20, backgroundColor: 'white', borderRadius: 12, marginHorizontal: isSmallScreen ? 5 : 0 },
  submitButton: { 
    backgroundColor: '#27ae60', 
    padding: isSmallScreen ? 15 : 20, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: isSmallScreen ? 20 : 30, 
    marginBottom: isSmallScreen ? 15 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      },
    }),
  },
  submitText: { color: 'white', fontSize: isSmallScreen ? 16 : 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '80%', 
    paddingBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      },
    }),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: isSmallScreen ? 15 : 20, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  modalTitle: { fontSize: isSmallScreen ? 18 : 20, fontWeight: 'bold', color: '#2c3e50' },
  closeButton: { fontSize: isSmallScreen ? 24 : 28, color: '#7f8c8d', fontWeight: 'bold', padding: 5 },
  searchInput: { 
    backgroundColor: '#f5f5f5', 
    padding: isSmallScreen ? 12 : 15, 
    margin: isSmallScreen ? 10 : 15, 
    borderRadius: 10, 
    fontSize: isSmallScreen ? 14 : 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  countryItem: { padding: isSmallScreen ? 12 : 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  countryText: { fontSize: isSmallScreen ? 14 : 16, color: '#2c3e50' },
  selectedCountry: { color: '#2c3e50', fontSize: isSmallScreen ? 14 : 16 },
  placeholderText: { color: '#999', fontSize: isSmallScreen ? 14 : 16 },
});
