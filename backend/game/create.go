package game

import (
	"net/http"
	"log"
	"encoding/json"
    "fmt"

    "github.com/satori/go.uuid"
)

func (service *GameService) CreateGame(w http.ResponseWriter, r *http.Request) {
	log.Println("CreateGame")

    // Set the content type to application/json
    w.Header().Set("Content-Type", "application/json")

    var game Game
    game.Version = 1
    game.UserId = "test"
    game.Id = fmt.Sprintf("v%d--%s", game.Version, uuid.NewV4().String())

    _, err := service.Collection.InsertOne(r.Context(), game)
    if err != nil {
        log.Println("Error inserting game: ", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := Response{
        Ok: true,
        Id: game.Id,
        Redirect: fmt.Sprintf("/game/%s", game.Id),
    }

    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}