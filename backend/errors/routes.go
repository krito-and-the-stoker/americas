package errors

import (
    "strings"
    "time"
    "log"
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
    Prefix string
}


func NewErrorService(collection *mongo.Collection, prefix string) *ErrorService {
    // Ensure the prefix ends with a slash
    if !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }

    return &ErrorService{
        Collection: collection,
        Prefix:     prefix,
    }
}

func (service *ErrorService) Handle(w http.ResponseWriter, r *http.Request) {
    log.Println("Requested: ", r.URL.Path)
    switch {
        case strings.HasPrefix(r.URL.Path, service.Prefix + "create"):
            service.CreateError(w, r)
        case strings.HasPrefix(r.URL.Path, service.Prefix + "list"):
            service.ListErrors(w, r)
        case strings.HasPrefix(r.URL.Path, service.Prefix + "get/{gameId}"):
            service.GetError(w, r)
        default:
            http.NotFound(w, r)
    }
}