# Recipes App

React Native приложение для рецептов с использованием Expo и expo-router.

## Особенности

- 🎨 Современный дизайн на основе Figma макета
- 📱 Адаптивный интерфейс с поддержкой safe area
- 🔄 Экран онбординга
- 📋 Список рецептов с FlatList
- 🍳 Детальный экран рецепта с ингредиентами и шагами
- 🌐 Интеграция с API Ninjas для получения рецептов
- 🎯 TypeScript для типобезопасности

## Структура проекта

```
/app
  index.tsx            // Главная страница со списком рецептов
  [id].tsx             // Экран деталей рецепта
  onboarding.tsx       // Экран онбординга
  _layout.tsx          // Главный layout
/components
  RecipeCard.tsx       // Компонент карточки рецепта
/constants
  Colors.ts            // Цвета приложения
```

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. API ключ уже настроен в файле `app.config.js`. Если нужно изменить ключ, отредактируйте значение `apiNinjasKey` в секции `extra`.

3. Запустите проект:
```bash
npx expo start
```

## API

Приложение использует API Ninjas для получения рецептов:
- Endpoint: `https://api.api-ninjas.com/v1/recipe?query=pancake`
- Получите бесплатный API ключ на [api-ninjas.com](https://api-ninjas.com)

## Технологии

- React Native
- Expo
- expo-router
- TypeScript
- react-native-safe-area-context

## Дизайн

Приложение создано на основе дизайна из Figma с использованием:
- Темно-серый/черный цвет для кнопок и навигации
- Белый фон
- Зеленые акценты для чекбоксов
- Современная типографика
- Адаптивная верстка 