package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

var clients = make(map[*websocket.Conn]bool) // Connected clients
var broadcast = make(chan []byte) // Channel to broadcast messages

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil) // Upgrade HTTP connection to WebSocket
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer ws.Close() // Ensure the connection is closed when the function exits

	clients[ws] = true // Add new client to the map

	broadcastUserCount() // Broadcast the initial user count

	for {
		_, msg, err := ws.ReadMessage() // Read message from client
		if err != nil {
			log.Println("Error reading message:", err)
			delete(clients, ws) // Remove client if there's an error
			break
		}
		broadcast <- msg // Broadcast the message to all clients
	}
}

func broadcastUserCount() {

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
			}
		}
	}
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
