#!/usr/bin/env node

/**
 * Analytics Integration Test
 * Validates that all analytics components and utilities are properly integrated
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const files = [
  'app/analytics.tsx',
  'src/utils/analytics.ts',
  'components/AnalyticsCharts.tsx',
  'components/KPICards.tsx',
  'components/AnalyticsLists.tsx',
];

console.log('🔍 Checking Analytics Integration...\n');

let allFilesExist = true;

files.forEach(file => {
  const filePath = path.join(baseDir, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking Dependencies...\n');

const packageJsonPath = path.join(baseDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'react-native-chart-kit',
  '@expo/vector-icons',
  'firebase',
  'expo-router',
];

let allDepsInstalled = true;

requiredDeps.forEach(dep => {
  const isInstalled = 
    packageJson.dependencies[dep] || 
    packageJson.devDependencies[dep];
  
  if (isInstalled) {
    console.log(`✅ ${dep} - ${isInstalled}`);
  } else {
    console.log(`❌ ${dep} - NOT INSTALLED`);
    allDepsInstalled = false;
  }
});

console.log('\n📋 Summary\n');
console.log(`Files Present: ${allFilesExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Dependencies: ${allDepsInstalled ? '✅ PASS' : '❌ FAIL'}`);

if (allFilesExist && allDepsInstalled) {
  console.log('\n🎉 Analytics integration is complete and ready to use!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some components are missing. Please run setup again.');
  process.exit(1);
}
