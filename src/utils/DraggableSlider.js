// src/components/DraggableSlider.js

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';

export default function DraggableSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 99, 
  label, 
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Calculate percentage for visual fill
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Pan responder for touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        if (!disabled) setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabled || !sliderRef.current) return;
        
        sliderRef.current.measure((x, y, width, height, pageX) => {
          const dragX = gestureState.moveX - pageX;
          const newPercentage = Math.max(0, Math.min(100, (dragX / width) * 100));
          const newValue = Math.round(min + (newPercentage / 100) * (max - min));
          const clampedValue = Math.min(max, Math.max(min, newValue));
          
          if (onChange) {
            onChange(clampedValue);
          }
        });
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // Handle mouse events for web - FIXED VERSION
  const handleMouseDown = (e) => {
    if (disabled || !sliderRef.current) return;
    setIsDragging(true);
    
    // Use ref instead of currentTarget for reliability
    sliderRef.current.measure((x, y, width, height, pageX) => {
      const rect = { left: pageX, width };
      const mouseX = e.nativeEvent?.locationX ?? (e.clientX - rect.left);
      const newPercentage = Math.max(0, Math.min(100, (mouseX / width) * 100));
      const newValue = Math.round(min + (newPercentage / 100) * (max - min));
      const clampedValue = Math.min(max, Math.max(min, newValue));
      
      if (onChange) {
        onChange(clampedValue);
      }
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || disabled || !sliderRef.current) return;
    
    // FIXED: Add proper null checks
    sliderRef.current.measure((x, y, width, height, pageX) => {
      if (!width || width === 0) return;
      
      const rect = { left: pageX, width };
      const mouseX = e.nativeEvent?.locationX ?? (e.clientX - rect.left);
      const newPercentage = Math.max(0, Math.min(100, (mouseX / width) * 100));
      const newValue = Math.round(min + (newPercentage / 100) * (max - min));
      const clampedValue = Math.min(max, Math.max(min, newValue));
      
      if (onChange) {
        onChange(clampedValue);
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse listeners for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View 
        ref={sliderRef}
        style={styles.track}
        {...panResponder.panHandlers}
        onMouseDown={handleMouseDown}
      >
        <View style={styles.trackBackground} />
        <View style={[styles.trackFill, { width: `${percentage}%` }]} />
        <View 
          style={[
            styles.thumb, 
            { left: `${percentage}%` },
            isDragging && styles.thumbDragging
          ]} 
        />
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.minText}>{min}</Text>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.maxText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginVertical: 12,
    paddingHorizontal: 5,
  },
  label: { 
    fontSize: 14, 
    color: '#a8dadc', 
    marginBottom: 8,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1b263b',
    position: 'relative',
    marginHorizontal: 4,
    cursor: 'pointer',
  },
  trackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1b263b',
    borderRadius: 4,
  },
  trackFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#1e88e5',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffd700',
    marginLeft: -10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbDragging: {
    transform: [{ scale: 1.2 }],
    backgroundColor: '#ff9800',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  minText: {
    fontSize: 10,
    color: '#666',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  maxText: {
    fontSize: 10,
    color: '#666',
  },
});