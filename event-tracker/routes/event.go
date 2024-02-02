package routes

import (
    "context"
    "encoding/json"
    "net/http"
    "time"
    "log"
)

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

    log.Println("Inserted a single document: ", insertResult.InsertedID, event)
    json.NewEncoder(w).Encode(event)
}
