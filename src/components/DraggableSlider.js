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
  // Refs for latest values (avoid stale closures)
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { valueRef.current = value; }, [value]);
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  // Calculate new value from pixel position
  const calculateValue = useCallback((localX, trackWidth) => {
    if (!trackWidth || trackWidth <= 0) return valueRef.current;
    // Clamp localX to track bounds
    const clampedX = Math.max(0, Math.min(trackWidth, localX));
    const pct = clampedX / trackWidth;
    const newValue = Math.round(min + pct * (max - min));
    // Clamp to min/max range
    return Math.max(min, Math.min(max, newValue));
  }, [min, max]);
  // Emit value change
  const emitValue = useCallback((newValue) => {
    if (newValue !== valueRef.current) {
      onChangeRef.current?.(newValue);
    }
  }, []);
  // ── NATIVE (iOS/Android) PanResponder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (e) => {
        if (disabledRef.current || !sliderRef.current) return;
        setIsDragging(true);
        sliderRef.current.measure((_x, _y, width, _h, pageX) => {
          const localX = e.nativeEvent.pageX - pageX;
          const newValue = calculateValue(localX, width);
          emitValue(newValue);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current || !sliderRef.current) return;
        sliderRef.current.measure((_x, _y, width, _h, pageX) => {
          // Calculate position relative to track start
          const localX = gestureState.moveX - pageX;
          const newValue = calculateValue(localX, width);
          emitValue(newValue);
        });
      },
      onPanResponderRelease: () => setIsDragging(false),
      onPanResponderTerminate: () => setIsDragging(false),
    })
  ).current;
  // ── WEB Mouse Events ──
  const trackDataRef = useRef(null); // { left, width } captured on drag start
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    trackDataRef.current = null;
  }, []);
  const handleDragMove = useCallback((clientX) => {
    if (!trackDataRef.current) return;
    const { left, width } = trackDataRef.current;
    const localX = clientX - left;
    const newValue = calculateValue(localX, width);
    emitValue(newValue);
  }, [calculateValue, emitValue]);
  // Global mouse listeners for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleDragMove(e.clientX);
      }
    };
    const onUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    if (isDragging) {
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('mouseleave', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);
  const handleDragStart = useCallback((e) => {
    if (disabled || !sliderRef.current) return;
    e.preventDefault();
    // Get accurate track position using the ref, not event target
    const domNode = sliderRef.current;
    if (!domNode || !domNode.getBoundingClientRect) return;
    const rect = domNode.getBoundingClientRect();
    trackDataRef.current = { left: rect.left, width: rect.width };
    setIsDragging(true);
    // Calculate initial value
    const localX = e.clientX - rect.left;
    const newValue = calculateValue(localX, rect.width);
    emitValue(newValue);
  }, [disabled, calculateValue, emitValue]);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        ref={sliderRef}
        style={[styles.track, disabled && styles.trackDisabled]}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        onMouseDown={Platform.OS === 'web' ? handleDragStart : undefined}
        // Prevent text selection while dragging on web
        onDragStart={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
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
          // Make thumb itself draggable for better UX
          {...(Platform.OS !== 'web' ? {} : {
            onMouseDown: Platform.OS === 'web' ? (e) => {
              e.stopPropagation();
              handleDragStart(e);
            } : undefined
          })}
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
  container: { marginVertical: 12, paddingHorizontal: 5 },
  label: { fontSize: 14, color: '#a8dadc', marginBottom: 8, fontWeight: '500' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1b263b',
    position: 'relative',
    marginHorizontal: 4,
    cursor: 'pointer',
    // Prevent text selection on web while dragging
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
  },
  trackDisabled: { opacity: 0.4, cursor: 'not-allowed' },
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
    cursor: 'grab',
  },
  thumbDragging: {
    transform: [{ scale: 1.2 }],
    backgroundColor: '#ff9800',
    cursor: 'grabbing',
  },
  thumbDisabled: { backgroundColor: '#888', cursor: 'not-allowed' },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  minText: { fontSize: 10, color: '#666' },
  valueText: { fontSize: 14, fontWeight: 'bold', color: '#1e88e5' },
  valueTextDisabled: { color: '#888' },
  maxText: { fontSize: 10, color: '#666' },
});
