package game

import (
    "net/http"
    "log"
    "encoding/json"
    "time"

    "go.mongodb.org/mongo-driver/bson"
)

type SaveData struct {
    Id      string `json:"id"`
    Game     string `json:"game"`
}


func (service *GameService) SaveGame(w http.ResponseWriter, r *http.Request) {
    var data SaveData
    err := json.NewDecoder(r.Body).Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    var game Game
    filter := bson.M{"url": data.Id}
    err = service.Collection.FindOne(r.Context(), filter).Decode(&game)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }

    update := bson.M{
        "$set": bson.M{
            "savegame": data.Game,
            "lastsave": time.Now(),
        },
    }

    _, err = service.Collection.UpdateOne(r.Context(), filter, update)
    if err != nil {
        log.Println("Error updating game: ", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := Response{
        Ok: true,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
   }
}