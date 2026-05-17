// src/components/DraggableSlider.js

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';

export default function DraggableSlider({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // FIX 1: Keep a ref to `disabled` so PanResponder (created once) always
  // reads the current value without needing to be recreated.
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  // FIX 2: Keep a ref to `onChange` so callbacks always call the latest version.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Helper: given a raw pixel X position relative to the track's left edge,
  // compute, clamp and emit the new value.
  const emitValueFromX = useCallback(
    (localX, trackWidth) => {
      if (!trackWidth || trackWidth === 0) return;
      const pct = Math.max(0, Math.min(1, localX / trackWidth));
      const newValue = Math.round(min + pct * (max - min));
      onChangeRef.current?.(newValue);
    },
    [min, max]
  );

  // ------------------------------------------------------------------
  // Native (iOS / Android) – PanResponder
  // FIX 1 cont.: use disabledRef.current inside callbacks.
  // ------------------------------------------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (e) => {
        if (disabledRef.current || !sliderRef.current) return;
        setIsDragging(true);
        sliderRef.current.measure((_x, _y, width, _h, pageX) => {
          emitValueFromX(e.nativeEvent.pageX - pageX, width);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current || !sliderRef.current) return;
        sliderRef.current.measure((_x, _y, width, _h, pageX) => {
          emitValueFromX(gestureState.moveX - pageX, width);
        });
      },
      onPanResponderRelease: () => setIsDragging(false),
      onPanResponderTerminate: () => setIsDragging(false),
    })
  ).current;

  // ------------------------------------------------------------------
  // Web – mouse events
  // FIX 3: Use a single, stable approach: store the track's bounding rect
  // on mousedown and reuse it for all subsequent mousemove events.
  // FIX 4: Use refs for the handlers so addEventListener / removeEventListener
  // always receive the exact same function reference → no leaks, clean removal.
  // ------------------------------------------------------------------
  const trackRectRef = useRef(null); // { left, width } captured on mousedown

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    trackRectRef.current = null;
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!trackRectRef.current) return;
      const localX = e.clientX - trackRectRef.current.left;
      emitValueFromX(localX, trackRectRef.current.width);
    },
    [emitValueFromX]
  );

  // Store latest handlers in refs so the effect cleanup removes the right fn.
  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleMouseUpRef = useRef(handleMouseUp);
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onMove = (e) => handleMouseMoveRef.current(e);
    const onUp = (e) => handleMouseUpRef.current(e);

    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]); // re-run only when drag starts/stops

  const handleMouseDown = useCallback(
    (e) => {
      if (disabled || !sliderRef.current) return;
      // Capture the track rect once; reused in mousemove.
      const domNode = e.currentTarget;
      const rect = domNode.getBoundingClientRect();
      trackRectRef.current = { left: rect.left, width: rect.width };
      setIsDragging(true);
      emitValueFromX(e.clientX - rect.left, rect.width);
    },
    [disabled, emitValueFromX]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        ref={sliderRef}
        style={[styles.track, disabled && styles.trackDisabled]}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        // Web only:
        onMouseDown={Platform.OS === 'web' ? handleMouseDown : undefined}
      >
        <View style={styles.trackBackground} />
        <View style={[styles.trackFill, { width: `${percentage}%` }]} />
        <View
          style={[
            styles.thumb,
            { left: `${percentage}%` },
            isDragging && styles.thumbDragging,
            disabled && styles.thumbDisabled,
          ]}
        />
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.minText}>{min}</Text>
        <Text style={[styles.valueText, disabled && styles.valueTextDisabled]}>
          {value}
        </Text>
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
  trackDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
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
  thumbDisabled: {
    backgroundColor: '#888',
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
  valueTextDisabled: {
    color: '#888',
  },
  maxText: {
    fontSize: 10,
    color: '#666',
  },
});