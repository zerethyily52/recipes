import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import RecipeCard from '../components/RecipeCard';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация поднятия поисковой строки
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      setLoading(true);
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.meals) {
            const recipes = data.meals.map((meal: any) => parseMealToRecipe(meal));
            console.log(`Search results: ${recipes.length} recipes for query: ${query}`);
            setRecipes(recipes);
          } else {
            setRecipes([]);
          }
        } else {
          setRecipes([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    } else {
      setRecipes([]);
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

  const handleRecipePress = (index: number) => {
    const selectedRecipe = recipes[index];
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

  const handleBack = () => {
    router.back();
  };

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <RecipeCard
      title={item.strMeal}
      ingredients={item.ingredients.join(', ')} // Join with comma for proper counting
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
      {/* Animated Search Bar */}
      <Animated.View style={[
        styles.searchBar,
        {
          transform: [{
            translateY: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : recipes.length > 0 ? (
          <FlatList
            data={recipes}
            renderItem={renderRecipe}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery.length > 2 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start typing to search recipes</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    color: Colors.background,
  },
  searchInput: {
    flex: 1,
    color: Colors.background,
    fontSize: 16,
  },
  clearButton: {
    fontSize: 18,
    color: Colors.background,
    marginLeft: 12,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
}); 