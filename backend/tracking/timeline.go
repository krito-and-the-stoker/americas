package tracking

import (
    "encoding/json"
    "net/http"
    "log"
    // "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type EventCount struct {
	PageView int32 `json:"PageView"`
	StartGame int32 `json:"StartGame"`
	ResumeGame int32 `json:"ResumeGame"`
	AutoSave int32 `json:"AutoSave"`
	Error int32 `json:"Error"`
}

// CountResult represents the structure of our count results
type TimelineResult struct {
    CountByDay     map[string]EventCount `json:"countByDay"`
}

// HandleSummary handles the route for counting events
func (es *EventService) HandleTimeline(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
        return
    }

	// now := time.Now()
	// thirtyDaysAgo := now.AddDate(0, 0, -30)

    // Count by Day
	groupByDay := bson.D{
	    // {Key: "$match", Value: bson.D{
	    //     {Key: "timestamp", Value: bson.D{
	    //         {Key: "$gte", Value: thirtyDaysAgo},
	    //     }},
	    // }},
	    {Key: "$group", Value: bson.D{
	        {Key: "_id", Value: bson.D{
	            {Key: "date", Value: bson.D{
	                {Key: "$dateToString", Value: bson.D{
	                    {Key: "format", Value: "%Y-%m-%d"},
	                    {Key: "date", Value: "$timestamp"},
	                }},
	            }},
	        }},
	        {Key: "PageView", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "PageView"}}},
	            1, 0}}}}}},
	        {Key: "StartGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "StartGame"}}},
	            1, 0}}}}}},
	        {Key: "ResumeGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "ResumeGame"}}},
	            1, 0}}}}}},
	        {Key: "AutoSave", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "AutoSave"}}},
	            1, 0}}}}}},
	        {Key: "Error", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "Error"}}},
	            1, 0}}}}}},
	    }},
	}


    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{groupByDay})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    var resultDays []bson.M
    if err = cursor.All(r.Context(), &resultDays); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    result := TimelineResult{
        CountByDay:     make(map[string]EventCount),
    }
	for _, dayResult := range resultDays {
	    // Extract the date from the cursor
	    _id := dayResult["_id"].(primitive.M) // or bson.M if you prefer
		date, ok := _id["date"].(string)
		if !ok {
		    log.Fatal("date is not a string")
		}

	    // Create an EventCount object for the current day
	    eventCount := EventCount{
	        PageView:   dayResult["PageView"].(int32),
	        StartGame:  dayResult["StartGame"].(int32),
	        ResumeGame: dayResult["ResumeGame"].(int32),
	        AutoSave:   dayResult["AutoSave"].(int32),
	        Error:      dayResult["Error"].(int32),
	    }

	    // Assign the EventCount object to the CountByDay map
	    result.CountByDay[date] = eventCount
	}

    json.NewEncoder(w).Encode(result)
}
