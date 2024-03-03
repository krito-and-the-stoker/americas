package errors


import(
	"time"
	"log"
	"net/http"
	"encoding/json"
    "go.mongodb.org/mongo-driver/bson"
)

type ErrorCapturePreview struct {
	Id          string `json:"id" bson:"_id"`
	Version     int16 `json:"version"`
	Message     string `json:"message"`
	GameId      string `json:"gameid"`
	Timestamp   time.Time `json:"timestamp"`
}

type ListResponse struct {
	Errors []ErrorCapturePreview `json:"errors"`
}

func (service *ErrorService) ListErrors(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    cursor, err := service.Collection.Find(r.Context(), bson.D{})
	defer cursor.Close(r.Context())
    if err != nil {
    	log.Println("Error finding errors: ", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var errors []ErrorCapturePreview
	for cursor.Next(r.Context()) {
		var capture ErrorCapturePreview
		if err := cursor.Decode(&capture); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		errors = append(errors, capture)
	}

	response := ListResponse{
		Errors: errors,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}