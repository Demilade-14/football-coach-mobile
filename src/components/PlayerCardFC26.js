import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getCardType } from '../utils/playerDatabase';
const PlayerCardFC26 = ({ player }) => {
  const cardStyle = getCardType(player.overall);
  // Calculate individual stats
  const pace = Math.round((player.attrs?.acceleration + player.attrs?.sprintSpeed) / 2);
  const shooting = Math.round((player.attrs?.finishing + player.attrs?.shotPower + player.attrs?.longShots) / 3);
  const passing = Math.round((player.attrs?.vision + player.attrs?.shortPassing + player.attrs?.longPassing) / 3);
  const dribbling = Math.round((player.attrs?.dribbling + player.attrs?.ballControl + player.attrs?.agility) / 3);
  const defending = Math.round((player.attrs?.marking + player.attrs?.standingTackle + player.attrs?.interceptions) / 3);
  const physical = Math.round((player.attrs?.strength + player.attrs?.stamina + player.attrs?.jumping) / 3);
  return (
    <View style={[styles.cardContainer, { borderColor: cardStyle.glow }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.ratingSection}>
          <Text style={[styles.overallRating, { color: cardStyle.glow }]}>{player.overall}</Text>
          <Text style={styles.position}>{player.position}</Text>
        </View>
        <Text style={styles.playerName}>{player.name}</Text>
      </View>
      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Player Image */}
        <View style={styles.imageContainer}>
          {player.image ? (
            <Image source={{ uri: player.image }} style={styles.playerImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: cardStyle.color + '40' }]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        {/* Club & Country */}
        <View style={styles.infoRow}>
          <View style={styles.clubBadge}>
            <Text style={styles.clubText}>{player.club?.substring(0, 3).toUpperCase() || 'CLB'}</Text>
          </View>
          <View style={styles.countryFlag}>
            <Text style={styles.flagText}>{player.nationality?.substring(0, 2).toUpperCase() || 'NG'}</Text>
          </View>
        </View>
      </View>
      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pace}</Text>
            <Text style={styles.statLabel}>PAC</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shooting}</Text>
            <Text style={styles.statLabel}>SHO</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{passing}</Text>
            <Text style={styles.statLabel}>PAS</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dribbling}</Text>
            <Text style={styles.statLabel}>DRI</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{defending}</Text>
            <Text style={styles.statLabel}>DEF</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{physical}</Text>
            <Text style={styles.statLabel}>PHY</Text>
          </View>
        </View>
      </View>
      {/* Additional Info */}
      <View style={styles.footer}>
        <Text style={styles.cardType}>{cardStyle.type}</Text>
        <View style={styles.extras}>
          <Text style={styles.extraText}>{player.skillMoves || 4}★ SM</Text>
          <Text style={styles.extraText}>{player.weakFoot || 4}★ WF</Text>
        </View>
      </View>
      {/* Glow Effect */}
      <View style={[styles.glowEffect, { backgroundColor: cardStyle.glow + '20' }]} />
    </View>
  );
};
const styles = StyleSheet.create({
  cardContainer: {
    width: 300,
    height: 450,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    opacity: 0.3,
  },
  cardHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overallRating: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 8,
  },
  position: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  playerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  clubBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  clubText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countryFlag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  flagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  footer: {
    padding: 8,
    alignItems: 'center',
  },
  cardType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  extras: {
    flexDirection: 'row',
    gap: 12,
  },
  extraText: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: '600',
  },
});
export default PlayerCardFC26;
