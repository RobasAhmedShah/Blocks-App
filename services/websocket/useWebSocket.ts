import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

interface UseWebSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, onConnect, onDisconnect, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connectSocket = async () => {
      try {
        setIsConnecting(true);
        
        // Get auth token
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          console.warn('[WebSocket] No auth token found, skipping connection');
          return;
        }

        // Create socket connection
        const socket = io(`${API_BASE_URL}/mobile`, {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
          console.log('[WebSocket] Connected');
          setIsConnected(true);
          setIsConnecting(false);
          onConnect?.();
        });

        socket.on('disconnect', (reason) => {
          console.log('[WebSocket] Disconnected:', reason);
          setIsConnected(false);
          onDisconnect?.();
        });

        socket.on('connect_error', (error) => {
          console.error('[WebSocket] Connection error:', error);
          setIsConnecting(false);
          onError?.(error);
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('[WebSocket] Failed to connect:', error);
        setIsConnecting(false);
        onError?.(error as Error);
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('[WebSocket] Disconnecting...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, onConnect, onDisconnect, onError]);

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!socketRef.current) {
      console.warn('[WebSocket] Cannot subscribe: socket not connected');
      return () => {};
    }

    socketRef.current.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  };

  const emit = (event: string, data?: any) => {
    if (!socketRef.current) {
      console.warn('[WebSocket] Cannot emit: socket not connected');
      return;
    }
    socketRef.current.emit(event, data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    subscribe,
    emit,
  };
}

