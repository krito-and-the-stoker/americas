package routes

import (
    "context"
    "encoding/json"
    "net/http"
    "time"
    "log"

    "go.mongodb.org/mongo-driver/mongo"
)

// Event represents the structure of our resource
type Event struct {
    Name      string `json:"name"`
    Timestamp time.Time `json:"timestamp"`
}

// EventService provides an interface to handle events
type EventService struct {
    Collection *mongo.Collection
}

// HandleEvent is responsible for handling the /event route
func (es *EventService) HandleEvent(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
        return
    }

    var event Event
    err := json.NewDecoder(r.Body).Decode(&event)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    event.Timestamp = time.Now()

    // Insert a single document
    insertResult, err := es.Collection.InsertOne(context.Background(), event)
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    log.Println("Inserted a single document: ", insertResult.InsertedID)
    json.NewEncoder(w).Encode(event)
}
