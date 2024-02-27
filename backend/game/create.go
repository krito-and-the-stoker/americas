package game

import (
	"net/http"
	"log"
	"encoding/json"
    "fmt"

    "github.com/satori/go.uuid"
)

const VERSION = 1

type CreateData struct {
    UserId      string `json:"userId"`
}

type CreateResponse struct {
    Ok              bool   `json:"ok"`
    Id              string `json:"id"`
    Redirect        string `json:"redirect"`
}

func (service *GameService) CreateGame(w http.ResponseWriter, r *http.Request) {
    var data CreateData
    err := json.NewDecoder(r.Body).Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if data.UserId == "" {
        http.Error(w, "userId is required", http.StatusBadRequest)
        return
    }

    // Set the content type to application/json
    w.Header().Set("Content-Type", "application/json")

    var game Game
    game.Name = pickName()
    game.Version = VERSION
    game.UserId = data.UserId
    game.Id = fmt.Sprintf("v%d--%s--%s", game.Version, slugify(game.Name), uuid.NewV4().String())

    _, err = service.Collection.InsertOne(r.Context(), game)
    if err != nil {
        log.Println("Error inserting game: ", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := CreateResponse{
        Ok: true,
        Id: game.Id,
        Redirect: fmt.Sprintf("/game/%s", game.Id),
    }

    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}