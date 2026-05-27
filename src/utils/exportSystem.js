// src/utils/exportSystem.js
// ✅ Minimal export functions - NO VIP/SUBSCRIPTION FEATURES

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Export all app data as JSON string (for copying/sharing)
 */
export const exportAllData = async () => {
  try {
    const players = await AsyncStorage.getItem('football_coach_players');
    const sessions = await AsyncStorage.getItem('training_sessions');
    
    const data = {
      players: players ? JSON.parse(players) : [],
      sessions: sessions ? JSON.parse(sessions) : [],
      exportedAt: new Date().toISOString()
    };
    
    // Return as JSON string - user can copy/share manually
    return { 
      success: true, 
      data: JSON.stringify(data, null, 2),
      message: 'Data exported successfully. Copy the JSON below:'
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export training sessions as CSV string
 */
export const exportTrainingSessions = async () => {
  try {
    const sessionsData = await AsyncStorage.getItem('training_sessions');
    const sessions = sessionsData ? JSON.parse(sessionsData) : [];
    
    if (sessions.length === 0) {
      return { success: false, error: 'No training sessions to export' };
    }
    
    // Create CSV content
    const csvHeaders = 'Date,Duration (min),Type,Notes,Rating\n';
    const csvRows = sessions.map(session => {
      return `${session.date || ''},${session.duration || ''},${session.type || ''},"${session.notes || ''}",${session.rating || ''}`;
    }).join('\n');
    
    return { 
      success: true, 
      data: csvHeaders + csvRows,
      message: 'Sessions exported as CSV. Copy the text below:'
    };
  } catch (error) {
    console.error('Export sessions error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate simple progress report
 */
export const generateProgressReport = async () => {
  try {
    const playersData = await AsyncStorage.getItem('football_coach_players');
    const sessionsData = await AsyncStorage.getItem('training_sessions');
    
    const players = playersData ? JSON.parse(playersData) : [];
    const sessions = sessionsData ? JSON.parse(sessionsData) : [];
    
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    
    const report = {
      summary: {
        totalPlayers: players.length,
        totalSessions,
        totalHours,
        generatedAt: new Date().toISOString()
      },
      players: players.map(p => ({
        name: p.name,
        position: p.position,
        overall: p.overall
      }))
    };
    
    return { 
      success: true, 
      data: JSON.stringify(report, null, 2),
      message: 'Report generated. Copy the JSON below:'
    };
  } catch (error) {
    console.error('Report generation error:', error);
    return { success: false, error: error.message };
  }
};