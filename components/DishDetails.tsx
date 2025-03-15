import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dish } from '../types';

// Update section titles and labels
const dishDetailsTitle = "Détails du plat";
const ingredientsTitle = "Ingrédients";
const servingsText = "portions";
const minutesText = "min";

const preparationTimeText = "Temps de préparation";
const cookingTimeText = "Temps de cuisson";
const totalTimeText = "Temps total";
const instructionsTitle = "Instructions";
const nutritionFactsTitle = "Valeurs nutritionnelles";

const DishDetailsComponent = ({ dish }: { dish: Dish }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{dishDetailsTitle}</Text>
            <Text style={styles.sectionTitle}>{ingredientsTitle}</Text>
            <Text>{dish.ingredients.join(', ')}</Text>
            <Text style={styles.sectionTitle}>{preparationTimeText}</Text>
            <Text>{dish.preparationTime} {minutesText}</Text>
            <Text style={styles.sectionTitle}>{cookingTimeText}</Text>
            <Text>{dish.cookingTime} {minutesText}</Text>
            <Text style={styles.sectionTitle}>{totalTimeText}</Text>
            <Text>{dish.totalTime} {minutesText}</Text>
            <Text style={styles.sectionTitle}>{instructionsTitle}</Text>
            <Text>{dish.instructions}</Text>
            <Text style={styles.sectionTitle}>{nutritionFactsTitle}</Text>
            <Text>{dish.nutritionFacts}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
});

export default DishDetailsComponent;
const DishDetails = {
    title: dishDetailsTitle,
    ingredientsTitle: ingredientsTitle,
    servingsText: servingsText,
    minutesText: minutesText,
    preparationTimeText: preparationTimeText,
    cookingTimeText: cookingTimeText,
    totalTimeText: totalTimeText,
    instructionsTitle: instructionsTitle,
    nutritionFactsTitle: nutritionFactsTitle,
};

export { DishDetails };
export {
    dishDetailsTitle,
    ingredientsTitle,
    servingsText,
    minutesText,
    preparationTimeText,
    cookingTimeText,
    totalTimeText,
    instructionsTitle,
    nutritionFactsTitle,
};

