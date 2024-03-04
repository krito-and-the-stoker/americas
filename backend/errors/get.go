package errors

import (
	"encoding/json"
	"log"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


type GetResponse struct {
    ErrorCapture ErrorCapture `json:"error"`
}


func (service *ErrorService) GetError(w http.ResponseWriter, r *http.Request) {
    log.Printf("GetError: %v", r.URL.Path)
    id := r.PathValue("id")

    if id == "" {
        http.Error(w, "id is required", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")

    log.Println("Looking for game: ", id)
    objectId, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    result := service.Collection.FindOne(r.Context(), bson.D{{Key: "_id", Value: objectId}})
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