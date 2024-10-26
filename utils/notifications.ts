import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Mock mode emülatörde kullanmak için
const MOCK_MODE = true;

export async function sendPushNotification(expoPushToken: string, message: string) {
    if (MOCK_MODE) {
        // Emülatör/simülatör için mock bildirimi
        Alert.alert('Mock Notification', `Title: Price Drop Alert!\nBody: ${message}`);
        console.log('Mock Notification:', message);
        return;
    }

    // Gerçek bildirim gönderimi
    const messageData = {
        to: expoPushToken,
        sound: 'default',
        title: 'Price Drop Alert!',
        body: message,
        data: { message },
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            console.error('Failed to send push notification:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export async function registerForPushNotificationsAsync() {
    if (MOCK_MODE) {
        // Emülatör/simülatör için mock token
        return 'Mock-Expo-Push-Token';
    }

    let token;
    if (Device.isDevice) {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Push notification token:', token);
        } catch (error) {
            console.error('Error getting push notification permissions:', error);
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}
