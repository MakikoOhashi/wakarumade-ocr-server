import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { requestCameraPermission } from './CameraPermission';
import { SERVER_URL } from './config';

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [showText, setShowText] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const status = await requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureAndProcessImage = async () => {
    if (!cameraRef.current || isLoading) return;

    setIsLoading(true);
    setExtractedText('');
    setShowText(false);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePhoto({
        quality: 0.8,
        enableShutterSound: false,
      });

      // Convert to base64
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64data = reader.result;

        try {
          // Send image to server for OCR processing
          const serverResponse = await fetch(`${SERVER_URL}/ocr`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64data
            }),
          });

          if (!serverResponse.ok) {
            const errorData = await serverResponse.json();
            throw new Error(errorData.error || 'Server processing failed');
          }

          const result = await serverResponse.json();
          const formattedText = JSON.stringify(result, null, 2);
          setExtractedText(formattedText);
          setShowText(true);
        } catch (error) {
          console.error('Server Error:', error);
          Alert.alert('Error', 'Failed to process image: ' + error.message);
        } finally {
          setIsLoading(false);
        }
      };

    } catch (error) {
      console.error('Capture Error:', error);
      Alert.alert('Error', 'Failed to capture image: ' + error.message);
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {showText && (
        <View style={styles.textOverlay}>
          <Text style={styles.extractedText}>{extractedText}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowText(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={captureAndProcessImage}
          disabled={isLoading}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    justifyContent: 'center',
  },
  extractedText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
