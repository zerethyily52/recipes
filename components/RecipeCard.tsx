import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

interface RecipeCardProps {
  title: string;
  ingredients: string;
  measures: string;
  servings: string;
  instructions: string;
  image?: string;
  index: number;
  onPress: (index: number) => void;
}

export default function RecipeCard({ 
  title, 
  ingredients, 
  measures,
  servings, 
  instructions, 
  image,
  index, 
  onPress 
}: RecipeCardProps) {
  // Правильно считаем количество ингредиентов (разделяем по запятой)
  const ingredientsCount = ingredients.split(',').filter(ingredient => ingredient.trim().length > 0).length;
  
  // Улучшенный подсчет шагов
  const getStepsCount = (instructions: string): number => {
    if (!instructions) return 0;
    
    let cleaned = instructions.trim().replace(/\s+/g, ' ');
    let steps: string[] = [];
    
    // Сначала пробуем разделить по "STEP" или "Step"
    if (cleaned.includes('STEP') || cleaned.includes('Step')) {
      steps = cleaned.split(/(?:STEP|Step)\s*\d+[:\s]*/i).filter(step => step.trim().length > 0);
    }
    // Если нет STEP, пробуем по точкам с заглавными буквами
    else if (/[A-Z]/.test(cleaned)) {
      steps = cleaned.split(/(?<=\.)\s+(?=[A-Z])/).filter(step => step.trim().length > 0);
    }
    // Если ничего не работает, делим по точкам
    else {
      steps = cleaned.split('.').filter(step => step.trim().length > 0);
    }
    
    return steps.filter(step => step.trim().length > 10).length; // Минимум 10 символов
  };
  
  const stepsCount = getStepsCount(instructions);
  
  // Определяем сложность на основе количества шагов
  const getDifficulty = (steps: number) => {
    if (steps <= 15) return { text: 'Easy', color: '#4CAF50', bgColor: '#E8F5E8' };
    if (steps <= 30) return { text: 'Medium', color: '#FF9800', bgColor: '#FFF3E0' };
    return { text: 'Hard', color: '#F44336', bgColor: '#FFEBEE' };
  };
  
  const difficulty = getDifficulty(stepsCount);
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(index)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {image ? (
            <Image 
              source={{ uri: image }} 
              style={styles.recipeImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imagePlaceholder}>🏔️</Text>
          )}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: difficulty.bgColor }]}>
              <Text style={[styles.tagText, { color: difficulty.color }]}>{difficulty.text}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: difficulty.bgColor }]}>
              <Text style={[styles.tagText, { color: difficulty.color }]}>{stepsCount} Steps</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.tagText, { color: '#1976D2' }]}>{ingredientsCount} ingredients</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    fontSize: 24,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  details: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
    flexShrink: 1,
  },
  tagEasy: {
    backgroundColor: '#E8F5E8',
  },
  tagSteps: {
    backgroundColor: '#E8F5E8',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 6,
  },
  servingsContainer: {
    backgroundColor: Colors.searchBar,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  servingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
  },
  content: {
    flex: 1,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  preview: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
}); 