/**
 * WebSocket client adapter for uWebSockets.js
 * This provides a Socket.IO-like interface for easier migration
 */
class WebSocketClient {
    constructor(url = '') {
        this.url = url || window.location.origin.replace(/^http/, 'ws');
        this.socket = null;
        this.eventHandlers = {};
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        
        this.connect();
    }
    
    connect() {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this._trigger('connect');
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.connected = false;
            this._trigger('disconnect');
            this._attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this._trigger('error', error);
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type && message.data !== undefined) {
                    this._trigger(message.type, message.data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }
    
    _attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
            console.error('Max reconnect attempts reached. Please refresh the page.');
        }
    }
    
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
        return this;
    }
    
    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        }
        return this;
    }
    
    emit(type, data) {
        if (!this.connected) {
            console.warn('Cannot emit event: WebSocket is not connected');
            return this;
        }
        
        try {
            const message = JSON.stringify({ type, data });
            this.socket.send(message);
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
        }
        
        return this;
    }
    
    _trigger(event, ...args) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => callback(...args));
        }
    }
}

// Create a Socket.IO-like interface
function io(url = '') {
    return new WebSocketClient(url);
}