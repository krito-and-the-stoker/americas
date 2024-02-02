package routes

import (
    "time"
    "strings"
    "log"
    "net/http"

	"go.mongodb.org/mongo-driver/mongo"
)

// EventService provides an interface to handle events
type EventService struct {
    Collection *mongo.Collection
    Prefix string
}

// Event represents the structure of our resource
type Event struct {
    Name      string `json:"name"`
    UserId    string `json:"userId"`
    Timestamp time.Time `json:"timestamp"`
}

func NewEventService(collection *mongo.Collection, prefix string) *EventService {
    // Ensure the prefix ends with a slash
    if !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }

    return &EventService{
        Collection: collection,
        Prefix:     prefix,
    }
}

func (es *EventService) Handle(w http.ResponseWriter, r *http.Request) {
    log.Println("Requested: ", r.URL.Path)
    switch {
    case strings.HasPrefix(r.URL.Path, es.Prefix + "event"):
        es.HandleEvent(w, r)
    case strings.HasPrefix(r.URL.Path, es.Prefix + "summary"):
        es.HandleSummary(w, r)
    default:
        // Handle unknown path or return a 404 error
        http.NotFound(w, r)
    }
}