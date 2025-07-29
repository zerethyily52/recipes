import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import { useFavorites } from '../context/FavoritesContext';
import HeartIcon from '../components/HeartIcon';

const { width } = Dimensions.get('window');

interface RecipeDetail {
  id: string;
  title: string;
  ingredients: string;
  measures: string;
  category: string;
  area: string;
  instructions: string;
  image: string;
}

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<{ 
    id: string;
    title: string;
    ingredients: string;
    measures: string;
    category: string;
    area: string;
    instructions: string;
    image: string;
  }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { isFavorite, toggleFavorite } = useFavorites();

  // Функция для улучшенного парсинга инструкций
  const parseInstructions = (instructions: string): string[] => {
    if (!instructions) return [];
    
    // Удаляем лишние пробелы и переносы строк
    let cleaned = instructions.trim().replace(/\s+/g, ' ');
    
    // Разделяем по различным разделителям
    let steps: string[] = [];
    
    // Сначала пробуем разделить по "STEP" или "Step"
    if (cleaned.includes('STEP') || cleaned.includes('Step')) {
      steps = cleaned.split(/(?:STEP|Step)\s*\d+[:\s]*/i).filter(step => step.trim().length > 0);
    }
    // Если нет STEP, пробуем по точкам с заглавными буквами (новые предложения)
    else if (/[A-Z]/.test(cleaned)) {
      steps = cleaned.split(/(?<=\.)\s+(?=[A-Z])/).filter(step => step.trim().length > 0);
    }
    // Если ничего не работает, делим по точкам
    else {
      steps = cleaned.split('.').filter(step => step.trim().length > 0);
    }
    
    // Очищаем каждый шаг
    return steps.map(step => step.trim()).filter(step => step.length > 10); // Минимум 10 символов
  };

  useEffect(() => {
    // Используем переданные параметры вместо запроса к API
    if (params.title && params.ingredients && params.category && params.area && params.instructions) {
      setRecipe({
        id: params.id,
        title: params.title,
        ingredients: params.ingredients,
        measures: params.measures || '',
        category: params.category,
        area: params.area,
        instructions: params.instructions,
        image: params.image,
      });
    } else {
      // Fallback - делаем запрос к API если параметры не переданы
      fetchRecipeDetail();
    }
  }, [params.title, params.ingredients, params.category, params.area, params.instructions]);

  const fetchRecipeDetail = async () => {
    try {
      // Получаем рецепт из глобального состояния или делаем новый запрос
      const response = await fetch('https://api.api-ninjas.com/v1/recipe?query=pancake', {
        headers: {
          'X-Api-Key': (Constants.expoConfig?.extra?.apiNinjasKey as string) || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }

      const data = await response.json();
      const recipeIndex = parseInt(params.id || '0');
      
      if (data[recipeIndex]) {
        console.log('Recipe detail data:', data[recipeIndex]);
        setRecipe(data[recipeIndex]);
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleIngredientToggle = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleStartCooking = () => {
    setActiveTab('steps');
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (recipe) {
      const steps = parseInstructions(recipe.instructions);
      if (currentStep < steps.length - 1) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(currentStep + 1);
      } else {
        // Завершаем приготовление
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        handleFinishCooking();
      }
    }
  };

  const handleFinishCooking = () => {
    // Проверяем, есть ли рецепт уже в избранном
    const isAlreadyFavorite = recipe ? isFavorite(recipe.id) : false;
    
    if (isAlreadyFavorite) {
      // Если рецепт уже в избранном, просто показываем поздравление
      Alert.alert(
        '🎉 Congratulations!',
        'You have successfully completed the recipe!',
        [
          {
            text: 'OK',
            onPress: () => resetCookingState(),
          },
        ]
      );
    } else {
      // Если рецепт не в избранном, предлагаем добавить
      Alert.alert(
        '🎉 Congratulations!',
        'You have successfully completed the recipe! Would you like to add it to your favorites?',
        [
          {
            text: 'No, thanks',
            onPress: () => resetCookingState(),
          },
          {
            text: 'Add to Favorites',
            onPress: () => {
              if (recipe) {
                toggleFavorite({
                  idMeal: recipe.id,
                  strMeal: recipe.title,
                  strCategory: recipe.category,
                  strArea: recipe.area,
                  strInstructions: recipe.instructions,
                  strMealThumb: recipe.image,
                  strTags: '',
                  strYoutube: '',
                  ingredients: recipe.ingredients ? recipe.ingredients.split('|') : [],
                  measures: recipe.measures ? recipe.measures.split('|') : [],
                });
              }
              resetCookingState();
            },
          },
        ]
      );
    }
  };

  const resetCookingState = () => {
    setCheckedIngredients(new Set());
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setActiveTab('ingredients');
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      const newCompleted = new Set(completedSteps);
      newCompleted.delete(currentStep - 1);
      setCompletedSteps(newCompleted);
      setCurrentStep(currentStep - 1);
    }
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{recipe.title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={() => toggleFavorite({
            idMeal: recipe.id,
            strMeal: recipe.title,
            strCategory: recipe.category,
            strArea: recipe.area,
            strInstructions: recipe.instructions,
            strMealThumb: recipe.image,
            strTags: '',
            strYoutube: '',
            ingredients: recipe.ingredients ? recipe.ingredients.split('|') : [],
            measures: [],
          })}
        >
          <HeartIcon isActive={isFavorite(recipe.id)} size={32} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <Image 
          source={{ uri: recipe.image || `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&${params.id}` }} 
          style={styles.recipeImage} 
          resizeMode="cover" 
        />

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              Ingredients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'steps' && styles.activeTab]}
            onPress={() => setActiveTab('steps')}
          >
            <Text style={[styles.tabText, activeTab === 'steps' && styles.activeTabText]}>
              Steps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.tabContent}>
          {activeTab === 'ingredients' ? (
            <View>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe.ingredients && recipe.ingredients.split('|').map((ingredient, index) => {
                const measure = recipe.measures ? recipe.measures.split('|')[index] : '';
                const isChecked = checkedIngredients.has(index);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.ingredientItem}
                    onPress={() => handleIngredientToggle(index)}
                    disabled={activeTab === 'steps' as any}
                  >
                    <View style={styles.ingredientInfo}>
                      <Text style={[
                        styles.ingredientName,
                        isChecked && styles.ingredientNameChecked
                      ]}>
                        {measure && measure.trim() ? `${measure.trim()} ` : ''}{ingredient.trim()}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      isChecked && styles.checkboxChecked
                    ]}>
                      {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
                           ) : (
                   <View>
                     <Text style={styles.sectionTitle}>Steps</Text>
                     {recipe.instructions && parseInstructions(recipe.instructions).map((step, index) => {
                       const isCurrentStep = index === currentStep;
                       const isCompleted = completedSteps.has(index);
                       const isCookingStarted = checkedIngredients.size === (recipe?.ingredients?.split('|').length || 0);
                       const shouldHighlight = isCookingStarted && isCurrentStep;
                       const shouldShowCompleted = isCookingStarted && isCompleted;
                       
                       return (
                         <View key={index} style={[
                           styles.stepItem,
                           shouldHighlight && styles.currentStepItem,
                           shouldShowCompleted && styles.completedStepItem
                         ]}>
                           <View style={[
                             styles.stepNumber,
                             shouldHighlight && styles.currentStepNumber,
                             shouldShowCompleted && styles.completedStepNumber
                           ]}>
                             <Text style={[
                               styles.stepNumberText,
                               shouldShowCompleted && styles.completedStepNumberText
                             ]}>
                               {shouldShowCompleted ? '✓' : index + 1}
                             </Text>
                           </View>
                           <Text style={[
                             styles.stepText,
                             shouldShowCompleted && styles.completedStepText
                           ]}>
                             {step}
                           </Text>
                         </View>
                       );
                     })}
                   </View>
                 )}
        </View>
      </ScrollView>

      {/* Cooking Button */}
      <View style={styles.buttonContainer}>
        {activeTab === 'ingredients' ? (
          <TouchableOpacity 
            style={[
              styles.startButton, 
              checkedIngredients.size === (recipe?.ingredients?.split('|').length || 0) && styles.startButtonActive
            ]} 
            onPress={activeTab === 'steps' as any ? () => setActiveTab('ingredients') : handleStartCooking}
            disabled={checkedIngredients.size !== (recipe?.ingredients?.split('|').length || 0)}
          >
            <Text style={[
              styles.startButtonText,
              checkedIngredients.size === (recipe?.ingredients?.split('|').length || 0) && styles.startButtonTextActive
            ]}>
              {activeTab === 'steps' as any ? 'Back to Cooking' : 'Start Cooking'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cookingButtons}>
            <TouchableOpacity 
              style={[styles.cookingButton, styles.previousButton]} 
              onPress={handlePreviousStep}
              disabled={currentStep === 0}
            >
              <Text style={styles.cookingButtonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cookingButton, styles.nextButton]} 
              onPress={handleNextStep}
              disabled={checkedIngredients.size !== (recipe?.ingredients?.split('|').length || 0)}
            >
              <Text style={[
                styles.cookingButtonText,
                checkedIngredients.size !== (recipe?.ingredients?.split('|').length || 0) && styles.cookingButtonTextDisabled
              ]}>
                {currentStep >= (recipe?.instructions ? parseInstructions(recipe.instructions).length - 1 : 0) ? 'Finish' : 'Next Step'}
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 16,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
  },
  favoriteButton: {
    padding: 16,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#666666',
  },
  favoriteIconActive: {
    color: '#FF6B35',
  },
  content: {
    flex: 1,
  },
  recipeImage: {
    width: width,
    height: width * 0.6,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ingredientNameChecked: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
  },
  currentStepItem: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  completedStepItem: {
    opacity: 0.7,
  },
  currentStepNumber: {
    backgroundColor: '#FF6B35',
  },
  completedStepNumber: {
    backgroundColor: '#4CAF50',
  },
  completedStepNumberText: {
    color: '#FFFFFF',
  },
  completedStepText: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonActive: {
    backgroundColor: '#FF6B35',
  },
  startButtonText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '700',
  },
  startButtonTextActive: {
    color: '#FFFFFF',
  },
  cookingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cookingButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  previousButton: {
    backgroundColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
  },
  cookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  cookingButtonTextDisabled: {
    color: '#CCCCCC',
  },

}); 