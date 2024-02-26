package routes

import (
    "encoding/json"
    "net/http"
    "time"
    "strings"
    "os"
    "log"
    "io/ioutil"
    "fmt"
)

func FetchLocation(ip string) (GeoLocation, error) {
    var geoLocation GeoLocation
    apiKey := os.Getenv("GEOLOCATION_API_KEY")
    if apiKey == "" {
        log.Println("GEOLOCATION_API_KEY is not set")
    }

    log.Println("Fetching location for IP: ", ip)
    url := fmt.Sprintf("https://api.ipgeolocation.io/ipgeo?apiKey=%s&ip=%s", apiKey, ip)
    response, err := http.Get(url)
    if err != nil {
        return geoLocation, err
    }
    defer response.Body.Close()

    if response.StatusCode != http.StatusOK {
        return geoLocation, fmt.Errorf("Failed to fetch location: %s", response.Status)
    }

    body, err := ioutil.ReadAll(response.Body)
    if err != nil {
        return geoLocation, err
    }

    fmt.Printf("Response (%d): %s\n", response.StatusCode, body)

    if err := json.Unmarshal(body, &geoLocation); err != nil {
        return geoLocation, err
    }

    return geoLocation, nil
}

// HandleEvent is responsible for handling the /event route
func (es *EventService) HandleEvent(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
        return
    }

    var event Event
    err := json.NewDecoder(r.Body).Decode(&event)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    event.Timestamp = time.Now()

    ip := r.Header.Get("X-Real-IP")
    geoLocation, err := FetchLocation(ip)
    if err != nil {
        log.Println("Failed to fetch location: ", err)
    }
    event.Location = geoLocation

    // Insert document
    _, err = es.Collection.InsertOne(r.Context(), event)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }

    w.WriteHeader(http.StatusOK)
}
