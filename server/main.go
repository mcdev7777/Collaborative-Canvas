package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

var clients = make(map[*websocket.Conn]int)         // Connected clients
var clientColors = make(map[*websocket.Conn]string) // Colors for each client
var userCount = 0                                   // Total number of connected users
var broadcast = make(chan []byte)                   // Channel to broadcast messages
var mu sync.Mutex                                   // Mutex to protect shared data

var colors = []string{
	"#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil) // Upgrade HTTP connection to WebSocket
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer ws.Close() // Ensure the connection is closed when the function exits

	mu.Lock()
	userCount++                                      // Increment user count
	clients[ws] = len(clients) + 1                   // Add new client to the map
	clientColors[ws] = colors[userCount%len(colors)] // Assign a color to the client
	broadcastUserCount()                             // Broadcast the initial user count
	mu.Unlock()

	for {
		_, msg, err := ws.ReadMessage() // Read message from client
		if err != nil {
			log.Println("Error reading message:", err)
			mu.Lock()
			delete(clients, ws)      // Remove client if there's an error
			delete(clientColors, ws) // Remove client's color
			broadcastUserCount()     // Broadcast updated user count
			mu.Unlock()
			break
		}
		var payload map[string]interface{}
		err = json.Unmarshal(msg, &payload) // Unmarshal the message into a map
		if err != nil {
			log.Println("Invalid JSON payload:", err)
			continue
		}

		if payload["type"] == "chat" {
			payload["username"] = fmt.Sprintf("User %d", clients[ws]) // Default username if not provided
			payload["userColor"] = clientColors[ws]                   // Get the client's color
			payload["timestamp"] = time.Now().UnixMilli()             // Add timestamp
			msg, _ = json.Marshal(payload)                            // Convert payload to JSON
		}

		broadcast <- msg // Send the message to the broadcast channel
	}
}

func broadcastUserCount() {
	count := len(clients)
	msg := map[string]interface{}{
		"type":  "user_count",
		"count": count,
	}
	data, _ := json.Marshal(msg) // Convert message to JSON
	for client := range clients {
		client.WriteMessage(websocket.TextMessage, data) // Send user count to each client
	}
}

func handleMessages() {
	for {
		msg := <-broadcast // Wait for a message to broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, msg) // Send message to each client
			if err != nil {
				log.Println("Error writing message:", err)
				client.Close()          // Close the connection if there's an error
				delete(clients, client) // Remove the client from the map
				mu.Lock()
				delete(clientColors, client) // Remove client's color
				broadcastUserCount()         // Broadcast updated user count
				mu.Unlock()
			}
		}
	}
}

func jsonNow() int64 {
	return time.Now().Unix()
}

func main() {
	http.HandleFunc("/ws", handleConnections) // Set up WebSocket endpoint

	go handleMessages() // Start the message handler in a goroutine

	fmt.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil) // Start the server
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
