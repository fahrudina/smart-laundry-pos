// Feature flag system for gradual rollout of duration types
export const FeatureFlags = {
  // Main feature flags
  USE_DURATION_TYPES: process.env.VITE_USE_DURATION_TYPES === 'true',
  USE_DURATION_SELECTION: process.env.VITE_USE_DURATION_SELECTION === 'true',
  
  // Testing flags
  INTERNAL_TESTING: process.env.VITE_INTERNAL_TESTING === 'true',
  BETA_TESTING: process.env.VITE_BETA_TESTING === 'true',
  
  // Rollout control
  ROLLOUT_PERCENTAGE: parseInt(process.env.VITE_ROLLOUT_PERCENTAGE || '0', 10),
  BETA_STORES: process.env.VITE_BETA_STORES?.split(',') || [],
  
  // Debug flags
  DEBUG_DURATION_TYPES: process.env.VITE_DEBUG_DURATION_TYPES === 'true',
} as const;

// Helper function to check if a store should use duration types
export const shouldUseDurationTypes = (storeId?: string): boolean => {
  // If feature is globally disabled, return false
  if (!FeatureFlags.USE_DURATION_TYPES) {
    return false;
  }
  
  // If internal testing is enabled, allow for testing
  if (FeatureFlags.INTERNAL_TESTING) {
    return true;
  }
  
  // If store is in beta list
  if (storeId && FeatureFlags.BETA_STORES.includes(storeId)) {
    return true;
  }
  
  // If beta testing is enabled globally
  if (FeatureFlags.BETA_TESTING) {
    return true;
  }
  
  // Percentage-based rollout
  if (FeatureFlags.ROLLOUT_PERCENTAGE > 0 && storeId) {
    // Simple hash function to determine if store falls within rollout percentage
    const hash = storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const percentage = hash % 100;
    return percentage < FeatureFlags.ROLLOUT_PERCENTAGE;
  }
  
  return false;
};

// Helper function to check if duration selection UI should be shown
export const shouldUseDurationSelection = (storeId?: string): boolean => {
  return FeatureFlags.USE_DURATION_SELECTION && shouldUseDurationTypes(storeId);
};

// Debug helper
export const getDurationTypesDebugInfo = (storeId?: string) => {
  if (!FeatureFlags.DEBUG_DURATION_TYPES) {
    return null;
  }
  
  return {
    featureFlags: FeatureFlags,
    storeId,
    shouldUseDurationTypes: shouldUseDurationTypes(storeId),
    shouldUseDurationSelection: shouldUseDurationSelection(storeId),
  };
};

// Environment validation
export const validateEnvironment = () => {
  const issues: string[] = [];
  
  // Check for conflicting flags
  if (FeatureFlags.USE_DURATION_SELECTION && !FeatureFlags.USE_DURATION_TYPES) {
    issues.push('VITE_USE_DURATION_SELECTION requires VITE_USE_DURATION_TYPES to be enabled');
  }
  
  // Check rollout percentage
  if (FeatureFlags.ROLLOUT_PERCENTAGE < 0 || FeatureFlags.ROLLOUT_PERCENTAGE > 100) {
    issues.push('VITE_ROLLOUT_PERCENTAGE must be between 0 and 100');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Hook for React components
export const useFeatureFlags = () => {
  return {
    ...FeatureFlags,
    shouldUseDurationTypes,
    shouldUseDurationSelection,
    getDurationTypesDebugInfo,
    validateEnvironment,
  };
};
