package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
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

var ctx = context.Background()
var rdb *redis.Client
var cleanupTimer *time.Timer

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer ws.Close()

	mu.Lock()
	if cleanupTimer != nil {
		cleanupTimer.Stop()
		cleanupTimer = nil
		log.Println("Cleanup timer stopped")
	}
	userCount++
	clients[ws] = userCount
	clientColors[ws] = colors[userCount%len(colors)]
	broadcastUserCount()
	mu.Unlock()
	chatKeys, err := rdb.Keys(ctx, "chat:*").Result()
	if err != nil {
		log.Println("Error fetching chat keys:", err)
	} else {
		// Sort keys so chat history appears in order
		sort.Strings(chatKeys)
		for _, key := range chatKeys {
			val, err := rdb.Get(ctx, key).Result()
			if err != nil {
				log.Println("Error reading chat key:", err)
				continue
			}
			if json.Valid([]byte(val)) {
				ws.WriteMessage(websocket.TextMessage, []byte(val))
			} else {
				log.Println("Invalid JSON in chat key:", key)
			}
		}
	}

	drawKeys, err := rdb.Keys(ctx, "draw:*").Result()
	if err != nil {
		log.Println("Error fetching draw keys:", err)
	} else {
		// Sort keys so draw history appears in order
		for _, key := range drawKeys {
			val, err := rdb.Get(ctx, key).Result()
			if err != nil {
				log.Println("Error reading draw key:", err)
				continue
			}
			if json.Valid([]byte(val)) {
				ws.WriteMessage(websocket.TextMessage, []byte(val))
			} else {
				log.Println("Invalid JSON in draw key:", key)
			}
		}
	}

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			mu.Lock()
			delete(clients, ws)
			delete(clientColors, ws)
			broadcastUserCount()

			if len(clients) == 0 {
				if cleanupTimer != nil {
					cleanupTimer.Stop()
					cleanupTimer = nil
				}
				cleanupTimer = time.AfterFunc(3*time.Minute, func() {
					log.Println("No active users for the last 3 minutes, cleaning up...")

					keys, err := rdb.Keys(ctx, "*").Result()
					if err != nil {
						log.Println("Error fetching keys from Redis:", err)
						return
					}

					if len(keys) > 0 {
						err = rdb.Del(ctx, keys...).Err()
						if err != nil {
							log.Println("Error deleting keys from Redis:", err)
						} else {
							log.Println("All keys deleted from Redis")
						}
					}
				})
			}
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

			key := fmt.Sprintf("chat:%d", time.Now().UnixNano())
			err = rdb.Set(ctx, key, msg, 15*time.Minute).Err()
			if err != nil {
				log.Println("Error saving chat message to Redis:", err)
			} else {
				log.Println("Chat message saved to Redis with key:", key)
			}

		case "draw", "shape":
			log.Println("Received draw/shape message:", payload)
			msg, err = json.Marshal(payload)
			if err != nil {
				log.Println("Error marshaling payload:", err)
				continue
			}

			key := fmt.Sprintf("draw:%d", time.Now().UnixNano())
			err = rdb.Set(ctx, key, msg, 15*time.Minute).Err()
			if err != nil {
				log.Println("Error saving draw message to Redis:", err)
			} else {
				log.Println("Draw message saved to Redis with key:", key)
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
		//broadcastUserCount()
	}
}

func main() {
	rdb = redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})
	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Could not connect to Redis:", err)
	}
	fmt.Println("Connected to Redis:", pong)

	http.HandleFunc("/ws", handleConnections)
	go handleMessages()

	fmt.Println("Server started on :8080")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
