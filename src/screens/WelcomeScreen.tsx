import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type WelcomeScreenProps = {
  onGetStarted: () => void;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.backgroundCircleTop} />
      <View style={styles.backgroundCircleBottom} />

      <View style={styles.content}>
        <Text style={styles.badge}>✨ ClothMatch</Text>

        <Text style={styles.title}>Having trouble with your wardrobe?</Text>
        <Text style={styles.subtitle}>ClothMatch is for you.</Text>

        <Text style={styles.description}>
          Discover better outfit combinations, get style recommendations, and
          build looks in seconds.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}
          onPress={onGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  backgroundCircleTop: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#dbeafe',
  },
  backgroundCircleBottom: {
    position: 'absolute',
    bottom: -130,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#e0e7ff',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#2563eb',
  },
  description: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
  button: {
    marginTop: 28,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
