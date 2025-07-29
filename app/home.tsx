import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecipeCard from '../components/RecipeCard';
import AnimatedIndicator from '../components/AnimatedIndicator';
import Colors from '../constants/Colors';
import { useFavorites } from '../context/FavoritesContext';

interface Recipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string;
  strYoutube: string;
  ingredients: string[];
  measures: string[];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Beef');
  const [categoryPositions, setCategoryPositions] = useState<{ [key: string]: number }>({});
  const spinValue = useRef(new Animated.Value(0)).current;
  const { favorites } = useFavorites();


  useEffect(() => {
    // При загрузке экрана сначала проверяем онбординг
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (loading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [loading]);

  const checkOnboardingStatus = async () => {
    try {
      // Добавляем небольшую задержку чтобы AsyncStorage успел сохраниться
      await new Promise(resolve => setTimeout(resolve, 200));
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        // Показываем онбординг только если пользователь его ещё не видел
        router.replace('/');
      } else {
        // Если онбординг уже был показан, загружаем рецепты
        fetchRecipes('Beef');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // В случае ошибки показываем онбординг
      router.replace('/');
    }
  };

  const fetchRecipes = async (category: string = 'Beef') => {
    try {
      setLoading(true);
      let allRecipes: Recipe[] = [];
      
      console.log(`Fetching recipes for category: ${category}`);
      
      // Получаем рецепты из конкретной категории
      const categoryResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`);
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        console.log(`API response for ${category}:`, categoryData);
        
        if (categoryData.meals && categoryData.meals.length > 0) {
          console.log(`Found ${categoryData.meals.length} meals for category ${category}`);
          
          // Перемешиваем массив рецептов для получения случайных
          const shuffledMeals = categoryData.meals.sort(() => Math.random() - 0.5);
          // Берем первые 25 случайных рецептов (больше для компенсации фильтрации)
          const selectedMeals = shuffledMeals.slice(0, 25);
          console.log(`Selected ${selectedMeals.length} meals for processing`);
          
          // Получаем детали для каждого рецепта
          for (const meal of selectedMeals) {
            try {
              console.log(`Fetching details for meal: ${meal.strMeal} (ID: ${meal.idMeal})`);
              const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.meals && detailData.meals[0]) {
                  const recipe = parseMealToRecipe(detailData.meals[0]);
                  console.log(`Parsed recipe: ${recipe.strMeal}, Category: ${recipe.strCategory}, Ingredients: ${recipe.ingredients.length}`);
                  
                  // Применяем фильтрацию - добавляем только хорошие рецепты
                  if (filterBadRecipes(recipe, category)) {
                    console.log(`✅ Recipe passed filter: ${recipe.strMeal}`);
                    allRecipes.push(recipe);
                  } else {
                    console.log(`❌ Recipe failed filter: ${recipe.strMeal}`);
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching meal details for ${meal.idMeal}:`, err);
            }
          }
        } else {
          console.log(`No meals found for category: ${category}`);
          setError(`No recipes found for ${category} category`);
        }
      } else {
        console.error(`Failed to fetch category ${category}:`, categoryResponse.status);
        setError(`Failed to fetch ${category} category`);
      }

      console.log(`Final result: ${allRecipes.length} recipes for category: ${category}`);
      console.log('Recipes:', allRecipes.map(r => `${r.strMeal} (${r.strCategory})`));
      
      setRecipes(allRecipes);
      setFilteredRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseMealToRecipe = (meal: any): Recipe => {
    const ingredients: string[] = [];
    const measures: string[] = [];
    
    // Собираем ингредиенты и меры
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== "") {
        ingredients.push(ingredient);
        measures.push(measure || '');
      }
    }

    return {
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strCategory: meal.strCategory,
      strArea: meal.strArea,
      strInstructions: meal.strInstructions,
      strMealThumb: meal.strMealThumb,
      strTags: meal.strTags,
      strYoutube: meal.strYoutube,
      ingredients,
      measures,
    };
  };

  // Функция для фильтрации плохих рецептов
  const filterBadRecipes = (recipe: Recipe, expectedCategory?: string): boolean => {
    // Проверяем количество ингредиентов (должно быть минимум 3)
    if (recipe.ingredients.length < 3) {
      console.log(`❌ Recipe ${recipe.strMeal} failed: too few ingredients (${recipe.ingredients.length})`);
      return false;
    }
    
    // Проверяем длину инструкций (должно быть минимум 50 символов)
    if (!recipe.strInstructions || recipe.strInstructions.length < 50) {
      console.log(`❌ Recipe ${recipe.strMeal} failed: instructions too short (${recipe.strInstructions?.length || 0} chars)`);
      return false;
    }
    
    // Проверяем наличие изображения
    if (!recipe.strMealThumb || recipe.strMealThumb === '') {
      console.log(`❌ Recipe ${recipe.strMeal} failed: no image`);
      return false;
    }
    
    // Проверяем название рецепта (должно быть не пустым)
    if (!recipe.strMeal || recipe.strMeal.trim() === '') {
      console.log(`❌ Recipe ${recipe.strMeal} failed: empty name`);
      return false;
    }
    
    // Проверяем категорию (должна быть не пустой)
    if (!recipe.strCategory || recipe.strCategory.trim() === '') {
      console.log(`❌ Recipe ${recipe.strMeal} failed: empty category`);
      return false;
    }
    
    // Проверяем соответствие категории (если указана ожидаемая категория)
    if (expectedCategory && recipe.strCategory.toLowerCase() !== expectedCategory.toLowerCase()) {
      console.log(`❌ Recipe ${recipe.strMeal} failed: category mismatch. Expected: ${expectedCategory}, Got: ${recipe.strCategory}`);
      return false;
    }
    
    return true;
  };

  const handleCategoryPress = (category: string) => {
    console.log(`Category pressed: ${category}`);
    setSelectedCategory(category);
    
    if (category === 'Favorites') {
      // Показываем избранные рецепты
      setFilteredRecipes(favorites);
      setLoading(false);
    } else {
      // Загружаем рецепты из API для конкретной категории
      fetchRecipes(category);
    }
  };

  const handleCategoryLayout = (category: string, event: any) => {
    const { x } = event.nativeEvent.layout;
    setCategoryPositions(prev => ({
      ...prev,
      [category]: x
    }));
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  // Добавим логирование для отладки
  useEffect(() => {
    console.log(`Recipes updated: ${recipes.length} recipes`);
    if (recipes.length > 0) {
      console.log('First recipe data:', recipes[0]);
    }
  }, [recipes.length]);

  const handleRecipePress = (index: number) => {
    const selectedRecipe = filteredRecipes[index];
    router.push({
      pathname: '/[id]' as any,
      params: {
        id: selectedRecipe.idMeal,
        title: selectedRecipe.strMeal,
        ingredients: selectedRecipe.ingredients.join('|'),
        measures: selectedRecipe.measures.join('|'),
        category: selectedRecipe.strCategory,
        area: selectedRecipe.strArea,
        instructions: selectedRecipe.strInstructions,
        image: selectedRecipe.strMealThumb,
      }
    });
  };



  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <RecipeCard
      title={item.strMeal}
      ingredients={item.ingredients.join(', ')}
      measures={item.measures.join(', ')}
      servings={`${item.strCategory} • ${item.strArea}`}
      instructions={item.strInstructions}
      image={item.strMealThumb}
      index={index}
      onPress={handleRecipePress}
    />
  );





  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: '#FF6B35' }]}>
        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search....</Text>
        </TouchableOpacity>
        
        {/* Categories */}
        <View style={styles.categories}>
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={styles.categoryTextItem}
              onPress={() => handleCategoryPress('Beef')}
              onLayout={(event) => handleCategoryLayout('Beef', event)}
            >
              <AnimatedIndicator 
                isActive={selectedCategory === 'Beef'}
                position={0}
                width={50}
              />
              <Text style={[styles.categoryTextNew, selectedCategory === 'Beef' && styles.categoryTextActiveNew]}>
                Beef
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryTextItem}
              onPress={() => handleCategoryPress('Chicken')}
              onLayout={(event) => handleCategoryLayout('Chicken', event)}
            >
              <AnimatedIndicator 
                isActive={selectedCategory === 'Chicken'}
                position={0}
                width={60}
              />
              <Text style={[styles.categoryTextNew, selectedCategory === 'Chicken' && styles.categoryTextActiveNew]}>
                Chicken
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryTextItem}
              onPress={() => handleCategoryPress('Seafood')}
              onLayout={(event) => handleCategoryLayout('Seafood', event)}
            >
              <AnimatedIndicator 
                isActive={selectedCategory === 'Seafood'}
                position={0}
                width={60}
              />
              <Text style={[styles.categoryTextNew, selectedCategory === 'Seafood' && styles.categoryTextActiveNew]}>
                Seafood
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryTextItem}
              onPress={() => handleCategoryPress('Vegetarian')}
              onLayout={(event) => handleCategoryLayout('Vegetarian', event)}
            >
              <AnimatedIndicator 
                isActive={selectedCategory === 'Vegetarian'}
                position={0}
                width={70}
              />
              <Text style={[styles.categoryTextNew, selectedCategory === 'Vegetarian' && styles.categoryTextActiveNew]}>
                Vegetarian
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryTextItem}
              onPress={() => handleCategoryPress('Favorites')}
              onLayout={(event) => handleCategoryLayout('Favorites', event)}
            >
              <AnimatedIndicator 
                isActive={selectedCategory === 'Favorites'}
                position={0}
                width={70}
              />
              <Text style={[styles.categoryTextNew, selectedCategory === 'Favorites' && styles.categoryTextActiveNew]}>
                Favorites
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Loading Area */}
      {loading && (
        <View style={styles.loadingArea}>
          <View style={styles.loadingContainer}>
            <Animated.View 
              style={[
                styles.loadingSpinner,
                {
                  transform: [{
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.spinnerCircle} />
            </Animated.View>
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        </View>
      )}

      {/* Recipes List */}
      {!loading && (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background for bottom section
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA', // Light background for recipe list
  },
  header: {
    paddingVertical: 20,
  },
           headerContainer: {
           paddingHorizontal: 20,
           paddingTop: 8,
           paddingBottom: 4,
           backgroundColor: '#FF6B35', // Orange background like recipe screens
           borderBottomWidth: 0,
         },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White search bar on orange background
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#666666', // Dark icon on white search bar
  },
  searchInput: {
    flex: 1,
    color: Colors.background,
    fontSize: 16,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#666666', // Dark text on white search bar
    fontSize: 16,
    fontWeight: '500',
  },
  profileIcon: {
    fontSize: 16,
  },
  cancelButton: {
    fontSize: 18,
    color: Colors.background,
    fontWeight: 'bold',
  },
           categories: {
           flexDirection: 'row',
           justifyContent: 'space-around',
           marginBottom: 16,
           paddingHorizontal: 10,
           marginTop: 8,
           marginLeft: -10,
         },
         categoryItem: {
           alignItems: 'center',
           minWidth: 60,
         },
         categoryText: {
           color: '#FFFFFF',
           fontSize: 11,
           fontWeight: '600',
           textAlign: 'center',
           marginTop: 6,
         },
         categoryItemActive: {
           // No additional styling for active state in this design
         },
         categoryTextActive: {
           color: '#FFFFFF',
           fontWeight: 'bold',
         },
         categoryIconContainer: {
           alignItems: 'center',
           marginBottom: 8,
         },
         categoryIcon: {
           fontSize: 24,
           opacity: 0.6,
         },
         categoryIconActive: {
           opacity: 1,
         },
         customIcon: {
           width: 32,
           height: 32,
           justifyContent: 'center',
           alignItems: 'center',
           opacity: 0.6,
         },
         customIconActive: {
           opacity: 1,
         },
         categoryIconText: {
           fontSize: 18,
         },
         categoryCircle: {
           width: 40,
           height: 40,
           borderRadius: 20,
           backgroundColor: 'rgba(255, 255, 255, 0.2)',
           justifyContent: 'center',
           alignItems: 'center',
           marginBottom: 4,
           borderWidth: 1,
           borderColor: 'rgba(255, 255, 255, 0.3)',
         },
         categoryCircleActive: {
           backgroundColor: '#FFFFFF',
           borderColor: '#FFFFFF',
         },
         categoryContainer: {
           flexDirection: 'row',
           justifyContent: 'flex-start',
           alignItems: 'center',
           width: '100%',
           paddingHorizontal: 0,
         },
         categoryTextItem: {
           alignItems: 'center',
           paddingVertical: 8,
           paddingHorizontal: 4,
           minWidth: 60,
         },
         categoryTextNew: {
           color: 'rgba(255, 255, 255, 0.8)',
           fontSize: 16,
           fontWeight: '500',
           textAlign: 'center',
           marginTop: 6,
         },
         categoryTextActiveNew: {
           color: '#FFFFFF',
           fontWeight: '600',
         },
  // Pancake stack icon
  pancakeStack: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pancake1: {
    width: 20,
    height: 4,
    backgroundColor: '#FFB74D',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
  },
  pancake2: {
    width: 18,
    height: 4,
    backgroundColor: '#FFB74D',
    borderRadius: 2,
    position: 'absolute',
    top: 6,
  },
  pancake3: {
    width: 16,
    height: 4,
    backgroundColor: '#FFB74D',
    borderRadius: 2,
    position: 'absolute',
    top: 12,
  },
  // Salad bowl icon
  saladBowl: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bowl: {
    width: 20,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  lettuce: {
    width: 16,
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    position: 'absolute',
    top: 2,
  },
  tomato: {
    width: 6,
    height: 6,
    backgroundColor: '#F44336',
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 2,
  },
  // Plate with fork and knife icon
  plate: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateCircle: {
    width: 18,
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  fork: {
    width: 2,
    height: 12,
    backgroundColor: '#666666',
    position: 'absolute',
    left: 4,
    top: 2,
  },
  knife: {
    width: 2,
    height: 12,
    backgroundColor: '#666666',
    position: 'absolute',
    right: 4,
    top: 2,
  },
  fullScreenSearch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 999,
  },
  searchResultsContainer: {
    flex: 1,
    paddingTop: 100,
  },
  searchResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingIndicator: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F8F9FA', // Light background
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#F0F0F0',
    borderTopColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinnerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },

}); 