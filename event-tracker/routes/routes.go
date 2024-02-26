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


type GeoLocation struct {
    Country string `json:"country_name"`
    Continent  string `json:"continent_name"`
    City        string `json:"city"`
}


type Event struct {
    Name      string `json:"name"`
    UserId    string `json:"userId"`
    Timestamp time.Time `json:"timestamp"`
    Location  GeoLocation `json:"location"`
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
    // case strings.HasPrefix(r.URL.Path, es.Prefix + "report"):
    //     es.HandleReport(w, r)
    default:
        // Handle unknown path or return a 404 error
        http.NotFound(w, r)
    }
}