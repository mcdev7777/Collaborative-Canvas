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

var clients = make(map[*websocket.Conn]int)
var clientColors = make(map[*websocket.Conn]string)
var userCount = 0
var broadcast = make(chan []byte)
var mu sync.Mutex

var colors = []string{
	"#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer ws.Close()

	mu.Lock()
	userCount++
	clients[ws] = len(clients) + 1
	clientColors[ws] = colors[userCount%len(colors)]
	broadcastUserCount()
	mu.Unlock()

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			mu.Lock()
			delete(clients, ws)
			delete(clientColors, ws)
			broadcastUserCount()
			mu.Unlock()
			break
		}

		var payload map[string]interface{}
		err = json.Unmarshal(msg, &payload)
		if err != nil {
			log.Println("Invalid JSON payload:", err)
			continue
		}

		log.Println("Incoming raw payload:", payload)

		switch payload["type"] {
		case "chat":
			payload["username"] = fmt.Sprintf("User %d", clients[ws])
			payload["userColor"] = clientColors[ws]
			payload["timestamp"] = time.Now().UnixMilli()
			msg, _ = json.Marshal(payload)

		case "draw", "shape":
			log.Println("Received draw/shape message:", payload)
			msg, err = json.Marshal(payload)
			if err != nil {
				log.Println("Error marshaling payload:", err)
				continue
			}
		default:
			log.Println("Unknown message type:", payload["type"])
			continue
		}

		broadcast <- msg
	}
}

func broadcastUserCount() {
	count := len(clients)
	msg := map[string]interface{}{
		"type":  "user_count",
		"count": count,
	}
	data, _ := json.Marshal(msg)
	for client := range clients {
		client.WriteMessage(websocket.TextMessage, data)
	}
}

func handleMessages() {
	for {
		msg := <-broadcast

		mu.Lock()
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Println("Error writing message:", err)
				client.Close()
				delete(clients, client)
				delete(clientColors, client)
			}
		}
		mu.Unlock()

		log.Println("Broadcasting message:", string(msg))
		broadcastUserCount()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)
	go handleMessages()

	fmt.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
