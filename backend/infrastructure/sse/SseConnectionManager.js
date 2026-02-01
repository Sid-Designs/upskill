class SseConnectionManager {
  constructor() {
    this.clients = new Map(); // sessionId → response
    this.pendingNotifications = new Map(); // sessionId → { event, payload, timestamp }[]
    this.PENDING_TTL = 30000; // 30 seconds TTL for pending notifications
  }

  addClient(sessionId, res) {
    this.clients.set(sessionId, res);
    
    // Send any pending notifications for this session
    this._flushPendingNotifications(sessionId);
  }

  removeClient(sessionId) {
    this.clients.delete(sessionId);
  }

  /**
   * Notify a client. If client not connected, queue the notification.
   * @param {string} sessionId 
   * @param {string} event 
   * @param {object} payload 
   * @param {object} options - { retry: boolean, maxRetries: number, retryDelay: number }
   */
  notify(sessionId, event, payload = {}, options = {}) {
    const { retry = true, maxRetries = 5, retryDelay = 500 } = options;
    
    const client = this.clients.get(sessionId);
    
    if (client) {
      try {
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Notified ${sessionId}: ${event}`);
        return true;
      } catch (err) {
        console.warn(`[SSE] Failed to write to client ${sessionId}:`, err.message);
        this.removeClient(sessionId);
      }
    }
    
    // Client not connected - queue notification if retry enabled
    if (retry) {
      this._queueNotification(sessionId, event, payload);
      this._startRetryLoop(sessionId, event, payload, maxRetries, retryDelay);
    }
    
    return false;
  }

  /**
   * Queue a notification for later delivery
   */
  _queueNotification(sessionId, event, payload) {
    if (!this.pendingNotifications.has(sessionId)) {
      this.pendingNotifications.set(sessionId, []);
    }
    
    this.pendingNotifications.get(sessionId).push({
      event,
      payload,
      timestamp: Date.now()
    });
    
    console.log(`[SSE] Queued notification for ${sessionId}: ${event}`);
  }

  /**
   * Flush pending notifications to a newly connected client
   */
  _flushPendingNotifications(sessionId) {
    const pending = this.pendingNotifications.get(sessionId);
    if (!pending || pending.length === 0) return;
    
    const client = this.clients.get(sessionId);
    if (!client) return;
    
    const now = Date.now();
    
    // Filter out expired notifications and send valid ones
    const validNotifications = pending.filter(n => (now - n.timestamp) < this.PENDING_TTL);
    
    for (const notification of validNotifications) {
      try {
        client.write(`event: ${notification.event}\n`);
        client.write(`data: ${JSON.stringify(notification.payload)}\n\n`);
        console.log(`[SSE] Flushed pending notification for ${sessionId}: ${notification.event}`);
      } catch (err) {
        console.warn(`[SSE] Failed to flush notification:`, err.message);
      }
    }
    
    // Clear pending notifications for this session
    this.pendingNotifications.delete(sessionId);
  }

  /**
   * Retry sending notification with exponential backoff
   */
  _startRetryLoop(sessionId, event, payload, maxRetries, retryDelay) {
    let attempts = 0;
    
    const tryNotify = () => {
      attempts++;
      
      const client = this.clients.get(sessionId);
      if (client) {
        try {
          client.write(`event: ${event}\n`);
          client.write(`data: ${JSON.stringify(payload)}\n\n`);
          console.log(`[SSE] Retry successful for ${sessionId}: ${event} (attempt ${attempts})`);
          
          // Remove from pending queue
          const pending = this.pendingNotifications.get(sessionId);
          if (pending) {
            const idx = pending.findIndex(n => n.event === event);
            if (idx !== -1) pending.splice(idx, 1);
            if (pending.length === 0) this.pendingNotifications.delete(sessionId);
          }
          return;
        } catch (err) {
          console.warn(`[SSE] Retry failed for ${sessionId}:`, err.message);
        }
      }
      
      if (attempts < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
        const delay = retryDelay * Math.pow(2, attempts - 1);
        setTimeout(tryNotify, delay);
      } else {
        console.warn(`[SSE] Max retries reached for ${sessionId}: ${event}`);
      }
    };
    
    // Start first retry after delay
    setTimeout(tryNotify, retryDelay);
  }

  /**
   * Check if client is connected
   */
  isConnected(sessionId) {
    return this.clients.has(sessionId);
  }
}

module.exports = new SseConnectionManager();
