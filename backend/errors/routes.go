package errors

import (
    "strings"
    "time"
    "net/http"

    "go.mongodb.org/mongo-driver/mongo"
)


type ErrorCapture struct {
    Version     int16 `json:"version"`
    Message     string `json:"message"`
    GameId          string `json:"gameid"`
    SaveGame    string `json:"savegame"`
    Timestamp   time.Time `json:"timestamp"`
}



// EventService provides an interface to handle events
type ErrorService struct {
    Collection *mongo.Collection
}


func Handle(collection *mongo.Collection, prefix string, mux *http.ServeMux) {
    // Ensure the prefix ends with a slash
    if !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }

    service := ErrorService{
        Collection: collection,
    }

    mux.HandleFunc("POST " + prefix + "create", service.CreateError)
    mux.HandleFunc("GET " + prefix + "list", service.ListErrors)
    mux.HandleFunc("GET " + prefix + "get/{id}", service.GetError)
}
