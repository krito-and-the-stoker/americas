package game

import (
    "net/http"
    "encoding/json"

    "go.mongodb.org/mongo-driver/bson"
)

type LoadData struct {
    Id      string `json:"id"`
}

type LoadResponse struct {
    Name    string `json:"name"`
    UserId  string `json:"userId"`
    Game    string `json:"game"`
    Ok      bool `json:"ok"`
}


func (service *GameService) LoadGame(w http.ResponseWriter, r *http.Request) {
    var data SaveData
    err := json.NewDecoder(r.Body).Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    var game Game
    filter := bson.M{"id": data.Id}
    err = service.Collection.FindOne(r.Context(), filter).Decode(&game)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }


    response := LoadResponse{
        Name: game.Name,
        UserId: game.UserId,
        Ok: true,
        Game: game.Savegame,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
   }
}