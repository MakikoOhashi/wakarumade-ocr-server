import { Camera } from 'react-native-vision-camera';

export async function requestCameraPermission() {
  try {
    const permission = await Camera.requestCameraPermission();
    return permission;
  } catch (error) {
    console.error('Camera permission error:', error);
    return 'denied';
  }
}
