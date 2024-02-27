package errors

import (
    "net/http"
    "log"
    "encoding/json"
    "time"

    "backend/game"
)

type CreateData struct {
    Message     string `json:"error"`
    GameId    string `json:"id"`
    Game      string `json:"game"`
}

type CreateResponse struct {
    Ok              bool   `json:"ok"`
}

func (service *ErrorService) CreateError(w http.ResponseWriter, r *http.Request) {
    var data CreateData
    err := json.NewDecoder(r.Body).Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if data.GameId == "" {
        http.Error(w, "userId is required", http.StatusBadRequest)
        return
    }

    // Set the content type to application/json
    w.Header().Set("Content-Type", "application/json")

    var capture ErrorCapture
    capture.Version = game.SAVEGAME_VERSION
    capture.Message = data.Message
    capture.GameId = data.GameId
    capture.SaveGame = data.Game
    capture.Timestamp = time.Now()

    _, err = service.Collection.InsertOne(r.Context(), capture)
    if err != nil {
        log.Println("Error inserting game: ", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := CreateResponse{
        Ok: true,
    }

    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}