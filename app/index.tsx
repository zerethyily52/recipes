import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const handleGetStarted = async () => {
    try {
      // Сохраняем статус что онбординг был показан
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      // Добавляем небольшую задержку чтобы AsyncStorage успел сохраниться
      await new Promise(resolve => setTimeout(resolve, 100));
      // Navigate to home screen and load recipes
      router.replace('/home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // В случае ошибки всё равно переходим на главный экран
      router.replace('/home');
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Recipes</Text>
          </View>
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              Discover thousands of delicious recipes from around the world. 
              Cook with confidence using our step-by-step instructions and 
              interactive cooking mode. Save your favorites and create 
              amazing dishes in your kitchen.
            </Text>
          </View>
          
          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 