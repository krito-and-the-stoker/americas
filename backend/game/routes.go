package game

import (
    "strings"
    "time"
    "log"
    "net/http"

    "go.mongodb.org/mongo-driver/mongo"
)


type Game struct {
    Version     int16 `json:"version"`
    UserId      string `json:"userId"`
    Id         string `json:"id"`
    Savegame    string `json:"savegame"`
    LastSaved   time.Time `json:"lastSaved"`
}

type Response struct {
    Ok              bool   `json:"ok"`
    Id              string `json:"id"`
    Redirect        string `json:"redirect"`
}



// EventService provides an interface to handle events
type GameService struct {
    Collection *mongo.Collection
    Prefix string
}


func NewGameService(collection *mongo.Collection, prefix string) *GameService {
    // Ensure the prefix ends with a slash
    if !strings.HasSuffix(prefix, "/") {
        prefix += "/"
    }

    return &GameService{
        Collection: collection,
        Prefix:     prefix,
    }
}

func (service *GameService) Handle(w http.ResponseWriter, r *http.Request) {
    log.Println("Requested: ", r.URL.Path)
    switch {
        case strings.HasPrefix(r.URL.Path, service.Prefix + "create"):
            service.CreateGame(w, r)
        case strings.HasPrefix(r.URL.Path, service.Prefix + "save"):
            service.SaveGame(w, r)
        // case strings.HasPrefix(r.URL.Path, service.Prefix + "load"):
            // service.LoadGame(w, r)
        default:
            // Handle unknown path or return a 404 error
            http.NotFound(w, r)
    }
}