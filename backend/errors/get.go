package errors


import(
    "log"
    "net/http"
    "encoding/json"
    "go.mongodb.org/mongo-driver/bson"
)


type GetResponse struct {
    ErrorCapture ErrorCapture `json:"error"`
}

func (service *ErrorService) GetError(w http.ResponseWriter, r *http.Request) {
    gameId := ""

    if gameId == "" {
        http.Error(w, "gameId is required", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")

    log.Println("Looking for game: ", gameId)
    result := service.Collection.FindOne(r.Context(), bson.D{{Key: "gameid", Value: gameId}})
    if result == nil {
        http.Error(w, "Error not found", http.StatusNotFound)
        return
    }

    var capture ErrorCapture
    result.Decode(&capture)

    response := GetResponse{
        ErrorCapture: capture,
    }

    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}