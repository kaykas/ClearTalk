import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

/**
 * Get available biometric types
 */
export async function getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
  return await LocalAuthentication.supportedAuthenticationTypesAsync();
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return 'Biometric';
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to access ClearTalk',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'Authentication error occurred',
    };
  }
}

/**
 * Enable biometric login
 */
export async function enableBiometricLogin(): Promise<boolean> {
  try {
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return false;
    }

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Error enabling biometric login:', error);
    return false;
  }
}

/**
 * Disable biometric login
 */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error('Error disabling biometric login:', error);
  }
}

/**
 * Check if biometric login is enabled
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking biometric login status:', error);
    return false;
  }
}
