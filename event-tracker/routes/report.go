package routes

import (
    "context"
    "encoding/json"
    "net/http"
    "log"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
)

// CountResult represents the structure of our count results
type CountResult struct {
    TotalCount     int64            `json:"totalCount"`
    CountByUserID  map[string]int64 `json:"countByUserID"`
    CountByName    map[string]int64 `json:"countByName"`
    CountByDay     map[string]int64 `json:"countByDay"`
}

// HandleCountEvents handles the route for counting events
func (es *EventService) HandleCountEvents(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
        return
    }

    // Total count
    totalCount, err := es.Collection.CountDocuments(context.Background(), bson.D{})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    result := CountResult{
        TotalCount:     totalCount,
        CountByUserID:  make(map[string]int64),
        CountByName:    make(map[string]int64),
        CountByDay:     make(map[string]int64),
    }

    // Count by UserID
    groupByUserID := bson.D{{"$group", bson.D{{"_id", "$userId"}, {"count", bson.D{{"$sum", 1}}}}}}
    cursor, err := es.Collection.Aggregate(context.Background(), mongo.Pipeline{groupByUserID})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsUserID []bson.M
    if err = cursor.All(context.Background(), &resultsUserID); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsUserID {
        id, ok := res["_id"].(string)
        if !ok {
            // Handle the case where _id is not a string or is nil
            log.Printf("Invalid type or nil id encountered in CountByUserID: %v", res["_id"])
            continue
        }
        result.CountByUserID[id] = res["count"].(int64)
    }
    // Count by Name
    groupByName := bson.D{{"$group", bson.D{{"_id", "$name"}, {"count", bson.D{{"$sum", 1}}}}}}
    cursor, err = es.Collection.Aggregate(context.Background(), mongo.Pipeline{groupByName})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsName []bson.M
    if err = cursor.All(context.Background(), &resultsName); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsName {
        var count int64
        switch c := res["count"].(type) {
        case int32:
            count = int64(c)
        case int64:
            count = c
        default:
            // Handle unexpected type
        }

        result.CountByName[res["_id"].(string)] = count
    }

    // Count by Day
    groupByDay := bson.D{
        {"$group", bson.D{
            {"_id", bson.D{
                {"$dateToString", bson.D{
                    {"format", "%Y-%m-%d"},
                    {"date", "$timestamp"},
                }},
            }},
            {"count", bson.D{{"$sum", 1}}},
        }},
    }
    cursor, err = es.Collection.Aggregate(context.Background(), mongo.Pipeline{groupByDay})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsDay []bson.M
    if err = cursor.All(context.Background(), &resultsDay); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsDay {
        var count int64
        switch c := res["count"].(type) {
        case int32:
            count = int64(c)
        case int64:
            count = c
        default:
            // Handle unexpected type
        }

        result.CountByDay[res["_id"].(string)] = count
    }

    json.NewEncoder(w).Encode(result)
}
