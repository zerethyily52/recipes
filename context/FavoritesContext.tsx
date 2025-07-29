import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteRecipe {
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

interface FavoritesContextType {
  favorites: FavoriteRecipe[];
  addToFavorites: (recipe: FavoriteRecipe) => void;
  removeFromFavorites: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipe: FavoriteRecipe) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);

  // Загружаем избранные рецепты из AsyncStorage при запуске
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites: FavoriteRecipe[]) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addToFavorites = (recipe: FavoriteRecipe) => {
    const newFavorites = [...favorites, recipe];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const removeFromFavorites = (recipeId: string) => {
    const newFavorites = favorites.filter(recipe => recipe.idMeal !== recipeId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const isFavorite = (recipeId: string) => {
    return favorites.some(recipe => recipe.idMeal === recipeId);
  };

  const toggleFavorite = (recipe: FavoriteRecipe) => {
    if (isFavorite(recipe.idMeal)) {
      removeFromFavorites(recipe.idMeal);
    } else {
      addToFavorites(recipe);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      toggleFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}; 