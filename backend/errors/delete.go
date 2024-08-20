package errors

import (
    "log"
    "net/http"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

func (service *ErrorService) DeleteError(w http.ResponseWriter, r *http.Request) {
    log.Printf("DeleteError: %v", r.URL.Path)
    id := r.PathValue("id")

    if id == "" {
        http.Error(w, "id is required", http.StatusBadRequest)
        return
    }

    log.Println("Looking for error with id: ", id)
    objectId, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    result, err := service.Collection.DeleteOne(r.Context(), bson.D{{Key: "_id", Value: objectId}})
    if err != nil {
        http.Error(w, "Failed to delete the error", http.StatusInternalServerError)
        return
    }

    if result.DeletedCount == 0 {
        http.Error(w, "Error not found", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusOK) // Respond with an empty 200 OK
}
