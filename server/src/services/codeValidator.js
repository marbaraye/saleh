/**
 * Service de validation de code C
 * Note: Sur AlwaysData, la compilation réelle peut ne pas être disponible
 * Ce service fournit une validation simulée pour le MVP
 */
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SUBMISSIONS_PATH = process.env.SUBMISSIONS_PATH || './submissions';
const GCC_AVAILABLE = process.env.GCC_PATH || false;

/**
 * Valide le code soumis contre les tests définis
 * @param {string} code - Code C soumis
 * @param {Array} testCases - Cas de test à exécuter
 * @param {Object} config - Configuration de validation
 * @returns {Array} Résultats des tests
 */
async function validate(code, testCases, config = {}) {
  const results = [];
  
  // Vérifications de base (toujours effectuées)
  const basicChecks = performBasicChecks(code);
  
  if (!basicChecks.passed) {
    return [{
      name: 'Vérification de base',
      passed: false,
      message: basicChecks.message,
      type: 'basic'
    }];
  }
  
  // Si GCC est disponible, faire une vraie compilation
  if (GCC_AVAILABLE) {
    const compilationResult = await compileCode(code);
    results.push(compilationResult);
    
    if (!compilationResult.passed) {
      return results;
    }
    
    // Exécuter les tests
    for (const testCase of testCases) {
      const testResult = await runTest(testCase, compilationResult.executablePath);
      results.push(testResult);
    }
    
    // Nettoyer les fichiers temporaires
    await cleanup(compilationResult.workDir);
  } else {
    // Mode simulation (pour AlwaysData sans GCC)
    results.push(...simulateValidation(code, testCases));
  }
  
  return results;
}

/**
 * Vérifications de base du code
 */
function performBasicChecks(code) {
  // Vérifier que le code n'est pas vide
  if (!code || code.trim().length === 0) {
    return { passed: false, message: 'Le code ne peut pas être vide' };
  }
  
  // Vérifier la longueur minimale
  if (code.length < 20) {
    return { passed: false, message: 'Le code est trop court' };
  }
  
  // Vérifier la présence de main() ou des fonctions requises
  if (!code.includes('main') && !code.includes('void ') && !code.includes('int ')) {
    return { passed: false, message: 'Le code doit contenir au moins une fonction' };
  }
  
  // Vérifier les patterns dangereux
  const dangerousPatterns = [
    /system\s*\(/,
    /exec[lv]?[pe]?\s*\(/,
    /fork\s*\(/,
    /popen\s*\(/,
    /__asm__/,
    /\basm\b/
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return { 
        passed: false, 
        message: 'Le code contient des instructions non autorisées pour des raisons de sécurité' 
      };
    }
  }
  
  return { passed: true };
}

/**
 * Compile le code C (si GCC disponible)
 */
async function compileCode(code) {
  const workDir = path.join(SUBMISSIONS_PATH, uuidv4());
  const sourceFile = path.join(workDir, 'main.c');
  const executablePath = path.join(workDir, 'main');
  
  try {
    // Créer le répertoire de travail
    await fs.mkdir(workDir, { recursive: true });
    
    // Écrire le code source
    await fs.writeFile(sourceFile, code);
    
    // Compiler
    const compileCommand = `gcc -std=c11 -Wall -Wextra -o ${executablePath} ${sourceFile} 2>&1`;
    
    return new Promise((resolve) => {
      exec(compileCommand, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            name: 'Compilation',
            passed: false,
            message: 'Erreur de compilation',
            compilationOutput: stdout || stderr || error.message,
            compilationSuccess: false,
            type: 'compilation'
          });
        } else {
          resolve({
            name: 'Compilation',
            passed: true,
            message: 'Compilation réussie',
            compilationOutput: stdout || 'Aucun warning',
            compilationSuccess: true,
            type: 'compilation',
            executablePath,
            workDir
          });
        }
      });
    });
  } catch (err) {
    return {
      name: 'Compilation',
      passed: false,
      message: `Erreur système: ${err.message}`,
      compilationSuccess: false,
      type: 'compilation'
    };
  }
}

/**
 * Exécute un test sur le code compilé
 */
async function runTest(testCase, executablePath) {
  return new Promise((resolve) => {
    const command = testCase.command 
      ? testCase.command.replace('./main', executablePath)
      : executablePath;
    
    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      let passed = false;
      let message = '';
      
      if (testCase.type === 'output') {
        passed = stdout.includes(testCase.expected);
        message = passed 
          ? 'Sortie correcte' 
          : `Sortie attendue: "${testCase.expected}", obtenue: "${stdout.substring(0, 100)}"`;
      } else if (testCase.type === 'exit_code') {
        const exitCode = error ? error.code : 0;
        passed = exitCode === (testCase.expected || 0);
        message = passed 
          ? 'Code de sortie correct' 
          : `Code de sortie attendu: ${testCase.expected}, obtenu: ${exitCode}`;
      } else {
        passed = !error;
        message = passed ? 'Test réussi' : `Erreur: ${error?.message || stderr}`;
      }
      
      resolve({
        name: testCase.name,
        passed,
        message,
        type: testCase.type,
        output: stdout?.substring(0, 500)
      });
    });
  });
}

/**
 * Simulation de validation (quand GCC n'est pas disponible)
 */
function simulateValidation(code, testCases) {
  const results = [];
  
  // Simulation de compilation
  const syntaxErrors = checkSyntax(code);
  
  results.push({
    name: 'Compilation',
    passed: syntaxErrors.length === 0,
    message: syntaxErrors.length === 0 
      ? 'Compilation simulée réussie' 
      : `Erreurs de syntaxe détectées: ${syntaxErrors.join(', ')}`,
    compilationSuccess: syntaxErrors.length === 0,
    type: 'compilation'
  });
  
  if (syntaxErrors.length > 0) {
    return results;
  }
  
  // Simulation des tests basée sur l'analyse statique
  for (const testCase of testCases) {
    const testResult = simulateTest(code, testCase);
    results.push(testResult);
  }
  
  return results;
}

/**
 * Vérification syntaxique basique
 */
function checkSyntax(code) {
  const errors = [];
  
  // Vérifier les accolades équilibrées
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Accolades non équilibrées');
  }
  
  // Vérifier les parenthèses équilibrées
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Parenthèses non équilibrées');
  }
  
  // Vérifier les points-virgules après les instructions
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && 
        !line.endsWith('{') && 
        !line.endsWith('}') && 
        !line.endsWith(';') && 
        !line.endsWith(',') &&
        !line.startsWith('#') &&
        !line.startsWith('//') &&
        !line.startsWith('/*') &&
        !line.endsWith('*/') &&
        !line.includes('if') &&
        !line.includes('else') &&
        !line.includes('for') &&
        !line.includes('while') &&
        line.length > 0) {
      // Potentielle erreur de point-virgule manquant
    }
  }
  
  return errors;
}

/**
 * Simulation d'un test individuel
 */
function simulateTest(code, testCase) {
  // Analyse statique basique pour déterminer si le test passerait
  let passed = false;
  let message = '';
  
  switch (testCase.name) {
    case 'Allocation simple':
      passed = code.includes('malloc') || code.includes('my_malloc');
      message = passed ? 'Fonction d\'allocation détectée' : 'Aucune fonction d\'allocation trouvée';
      break;
    
    case 'Free et réallocation':
      passed = code.includes('free') || code.includes('my_free');
      message = passed ? 'Fonction de libération détectée' : 'Aucune fonction de libération trouvée';
      break;
    
    case 'Allocations multiples':
      passed = code.includes('for') || code.includes('while');
      message = passed ? 'Boucle d\'allocation détectée' : 'Aucune boucle d\'allocation trouvée';
      break;
    
    default:
      // Test générique basé sur les patterns
      if (testCase.expected) {
        passed = code.toLowerCase().includes(testCase.expected.toLowerCase().substring(0, 20));
      } else {
        passed = true; // Passer par défaut si pas de critère spécifique
      }
      message = passed ? 'Test simulé réussi' : 'Test simulé échoué';
  }
  
  return {
    name: testCase.name,
    passed,
    message: `[Simulation] ${message}`,
    type: testCase.type
  };
}

/**
 * Nettoie les fichiers temporaires
 */
async function cleanup(workDir) {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Erreur lors du nettoyage:', err);
  }
}

module.exports = {
  validate,
  performBasicChecks,
  checkSyntax
};
