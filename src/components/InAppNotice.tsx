import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InAppNoticeProps {
  message: string;
  type?: 'success' | 'error';
}

export const InAppNotice: React.FC<InAppNoticeProps> = ({ message, type = 'success' }) => {
  return (
    <View style={[styles.container, type === 'success' ? styles.success : styles.error]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 1100,
  },
  success: {
    backgroundColor: '#16a34a',
  },
  error: {
    backgroundColor: '#dc2626',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
});
