package tracking

import (
    "time"
    "strings"
    "net/http"

	"go.mongodb.org/mongo-driver/mongo"
)

// EventService provides an interface to handle events
type EventService struct {
    Collection *mongo.Collection
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

func Handle(collection *mongo.Collection, prefix string, mux *http.ServeMux) {
    // Ensure the prefix ends with a slash
    if !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }

    es := EventService{
        Collection: collection,
    }

    mux.HandleFunc("POST " + prefix + "create", es.CreateEvent)
    mux.HandleFunc("GET " + prefix + "summary", es.HandleSummary)
    mux.HandleFunc("GET " + prefix + "timeline", es.HandleTimeline)
}

