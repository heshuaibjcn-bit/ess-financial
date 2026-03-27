# Week 4 Progress: API Layer and State Management

## Completed Tasks ✓

### 1. projectStore (Zustand) ✓
**File**: `src/stores/projectStore.ts`

Features:
- **State Management**:
  - `currentProject`: Currently edited project
  - `savedProjects`: List of saved projects
  - `selectedProjectId`: Currently selected project
  - `validationErrors`: Validation error messages
  - `isSaving`: Auto-save state
  - `lastSaved`: Last save timestamp

- **Actions**:
  - `setCurrentProject(input)`: Set current project
  - `updateProjectField(field, value)`: Update single field with auto-validation
  - `saveProject(name?, description?)`: Save project to list
  - `loadProject(id)`: Load project by ID
  - `deleteProject(id)`: Delete project
  - `duplicateProject(id)`: Clone project
  - `validateCurrentProject()`: Validate using Zod

- **Persistence**: localStorage middleware for savedProjects

### 2. calculationStore (Zustand) ✓
**File**: `src/stores/calculationStore.ts`

Features:
- **State Management**:
  - `result`: Calculation result
  - `loading`: Calculation in progress
  - `error`: Error message
  - `lastCalculated`: Last calculation timestamp
  - `cacheKey`: Input hash for caching

- **Actions**:
  - `calculate(input, options)`: Trigger calculation
  - `clearResult()`: Clear cached result
  - `clearError()`: Clear error state
  - `retry()`: Retry last calculation

- **Computed Values**:
  - `isValid`: Result validation passed
  - `hasResult`: Result exists
  - `recommendation`: 1-5 star rating
  - Auto-calculation hooks with debouncing

### 3. uiStore (Zustand) ✓
**File**: `src/stores/uiStore.ts`

Features:
- **State Management**:
  - `currentStep`: Form wizard step (0-3)
  - `totalSteps`: Total steps (4)
  - `language`: 'zh' | 'en'
  - `theme`: 'light' | 'dark'
  - `sidebarOpen`: Sidebar state
  - `showResults`: Results panel state
  - `showAdvanced`: Advanced options toggle
  - Dialog states: Save/Share/DeleteConfirm

- **Actions**:
  - Navigation: `setCurrentStep`, `nextStep`, `prevStep`, `resetSteps`
  - Language: `setLanguage`, `toggleLanguage`
  - Theme: `setTheme`, `toggleTheme` (with document class update)
  - UI components: `setSidebarOpen`, `setShowResults`, `setShowAdvanced`
  - Dialogs: `setShowSaveDialog`, `setShowShareDialog`, `setShowDeleteConfirm`

- **Helper Hooks**:
  - `useIsFirstStep()`, `useIsLastStep()`
  - `useStepLabels()`, `useStepDescriptions()`

### 4. Calculator API ✓
**File**: `src/api/calculatorApi.ts`

Features:
- **Main Functions**:
  - `calculateProject(input, options)`: End-to-end calculation
  - `validateInput(input)`: Input validation with warnings
  - `calculateRevenue(input, province)`: Revenue only
  - `calculateCashFlow(input, province)`: Cash flows only
  - `calculateMetrics(input, cashFlow, rate)`: Financial metrics only

- **Province Management**:
  - `loadProvince(slug)`: Load single province
  - `loadProvinces(slugs)`: Batch load
  - `getSupportedProvinces()`: Get all 31 provinces
  - `preloadProvinces(slugs)`: Preload for performance
  - `isProvinceSupported(slug)`: Check support

- **Batch Operations**:
  - `calculateProjects(inputs)`: Parallel calculations
  - `clearCache()`: Clear calculation cache
  - `getCacheSize()`: Get cache size

- **Sharing**:
  - `exportForSharing(result, input)`: Generate shareable URL
  - `importFromSharing(searchParams)`: Import shared project

- **Recommendations**:
  - `getRecommendation(result)`: Get 5-star rating

- **Error Classes**:
  - `ValidationError`: Input validation errors
  - `CalculationError`: Calculation failures
  - `ProvinceNotFoundError`: Province not found

### 5. React Hooks ✓
**Files**: `src/hooks/useCalculator.ts`, `useProject.ts`, `useProvince.ts`

#### useCalculator
- `triggerCalculation(input?)`: Manually trigger calculation
- `retry`: Retry last calculation
- `reset`: Clear cache and result
- Auto-calculation with debouncing (300ms default)
- State: `result`, `loading`, `error`, `isValid`, `hasResult`

#### useProject
- CRUD operations: `save`, `load`, `remove`, `duplicate`
- Field updates: `updateField(field, value)`
- Validation: `validate()`, `isValid`, `validationErrors`
- Change detection: `hasUnsavedChanges`
- State: `currentProject`, `savedProjects`, `selectedProject`

#### useProvince
- Single province: `useProvince(slug)` → { province, loading, error }
- Multiple provinces: `useProvinces(slugs)` → { provinces, loading, errors }
- Province list: `useSupportedProvinces()`
- Preloading: `usePreloadProvinces(slugs)` → { loading, loaded }
- Support check: `useIsProvinceSupported(slug)`
- Helpers: `useProvinceNames()`, `useProvinceOptions()`

## Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Store Logic Tests | 10 | ✓ |
| Previous Tests | 154 | ✓ |
| **Total** | **164** | **✓** |

## Files Created This Week

### State Management
- `src/stores/projectStore.ts` - Project state management
- `src/stores/calculationStore.ts` - Calculation results state
- `src/stores/uiStore.ts` - UI state management
- `src/stores/index.ts` - Export barrel

### API Layer
- `src/api/calculatorApi.ts` - Functional API layer

### React Hooks
- `src/hooks/useCalculator.ts` - Calculator hook
- `src/hooks/useProject.ts` - Project management hook
- `src/hooks/useProvince.ts` - Province data hook
- `src/hooks/index.ts` - Export barrel

### Tests
- `src/test/unit/stores/stores.test.ts` - Store logic tests

## Key Features

### 1. Automatic Calculation
- Auto-calculates when project changes (300ms debounce)
- Caches results by input hash
- Loading and error states

### 2. Data Persistence
- localStorage for saved projects
- localStorage for UI preferences (language, theme)
- Auto-save on change

### 3. Input Validation
- Real-time validation with Zod
- Field-level validation
- Cross-field validation (DOD ≤ efficiency)

### 4. Province Management
- 31 provinces support
- Lazy loading with caching
- Preloading for performance

### 5. Internationalization Ready
- Language toggle (zh/en)
- Localized labels and descriptions
- Easy to extend with i18next

## API Surface Example

```typescript
// Calculate project
import { calculateProject } from '@/api/calculatorApi';

const result = await calculateProject(projectInput, {
  discountRate: 0.08,
  projectLifetime: 10,
});

// Use in component
import { useCalculator } from '@/hooks/useCalculator';

function MyComponent() {
  const { result, loading, triggerCalculation } = useCalculator();

  useEffect(() => {
    triggerCalculation();
  }, []);
}
```

## Store Usage Example

```typescript
// Project store
import { useProjectStore } from '@/stores/projectStore';

function ProjectEditor() {
  const { currentProject, updateField, save, validationErrors } = useProjectStore();

  const handleProvinceChange = (value) => {
    updateField('province', value);
  };

  const handleSave = () => {
    save('My Project', 'Description');
  };
}

// Calculation store
import { useCalculationStore } from '@/stores/calculationStore';

function Results() {
  const { result, loading, error } = useCalculationStore();
  const { recommendation } = useRecommendation();

  return <div>Rating: {recommendation.rating}/5</div>;
}
```

## Performance Optimizations

1. **Calculation Caching**: Results cached by input hash
2. **Debouncing**: 300ms debounce for auto-calculation
3. **Lazy Loading**: Provinces loaded on demand
4. **Preloading**: Common provinces can be preloaded
5. **localStorage**: Fast state restoration

## Next Steps (Week 5-6)

The state management and API layer is now complete. Next week will focus on:
- Week 5: Sensitivity Analysis Engine
  - SensitivityAnalyzer (single-factor analysis)
  - ScenarioBuilder (multi-scenario comparison)
  - Tornado chart data preparation

- Week 6: Calculator Form UI
  - React Hook Form + Zod integration
  - 4-step wizard form
  - Real-time calculation display
  - Error boundary handling
