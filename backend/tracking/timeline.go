package tracking

import (
    "encoding/json"
    "net/http"
    "log"
    "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type EventCount struct {
	PageView int32 `json:"PageView"`
	NewGame int32 `json:"NewGame"`
	ResumeGame int32 `json:"ResumeGame"`
	AutoSave int32 `json:"AutoSave"`
	Error int32 `json:"Error"`
	Users int32 `json:"Users"`
}

// CountResult represents the structure of our count results
type TimelineResult struct {
    CountByDay     map[string]EventCount `json:"countByDay"`
}

// HandleSummary handles the route for counting events
func (es *EventService) HandleTimeline(w http.ResponseWriter, r *http.Request) {
    now := time.Now()
    thirtyDaysAgo := now.AddDate(0, 0, -ThirtyDays)

    limitToThirtyDaysAgo := bson.D{
        {Key: "$match", Value: bson.D{
            {Key: "timestamp", Value: bson.D{
                {Key: "$gte", Value: primitive.NewDateTimeFromTime(thirtyDaysAgo)},
            }},
        }},
    }

    // Count by Day
	groupByDay := bson.D{

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
	        {Key: "NewGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "NewGame"}}},
	            1, 0}}}}}},
	        {Key: "ResumeGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "ResumeGame"}}},
	            1, 0}}}}}},
	        {Key: "AutoSave", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "Autosave"}}},
	            1, 0}}}}}},
	        {Key: "Error", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
	            bson.D{{Key: "$eq", Value: bson.A{"$name", "Error"}}},
	            1, 0}}}}}},
			{Key: "Users", Value: bson.D{{Key: "$addToSet", Value: "$userid"}}},
	    }},
	}

    countUsers := bson.D{
        {Key: "$project", Value: bson.D{
            {Key: "PageView", Value: "$PageView"},
            {Key: "NewGame", Value: "$NewGame"},
            {Key: "ResumeGame", Value: "$ResumeGame"},
            {Key: "AutoSave", Value: "$AutoSave"},
            {Key: "Error", Value: "$Error"},
            {Key: "Users", Value: bson.D{
                {Key: "$size", Value: "$Users"},
            }},
        }},
    }

    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{
    	limitToThirtyDaysAgo,
    	groupByDay,
    	countUsers,
   	})
	if err != nil {
	    log.Println("Error executing aggregation:", err)
	    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	    return
	}

    var resultDays []bson.M
	if err = cursor.All(r.Context(), &resultDays); err != nil {
	    log.Println("Error fetching aggregation results:", err)
	    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	    return
	}

    result := TimelineResult{
        CountByDay:     make(map[string]EventCount),
    }
	for _, dayResult := range resultDays {
	    // Extract the date from the cursor
	    _id := dayResult["_id"].(primitive.M) // or bson.M if you prefer
		date, ok := _id["date"].(string)
		if !ok {
		    http.Error(w, "Error parsing date", http.StatusInternalServerError)
		}

	    // Create an EventCount object for the current day
	    eventCount := EventCount{
	        PageView:   dayResult["PageView"].(int32),
	        NewGame:  dayResult["NewGame"].(int32),
	        ResumeGame: dayResult["ResumeGame"].(int32),
	        AutoSave:   dayResult["AutoSave"].(int32),
	        Error:      dayResult["Error"].(int32),
	        Users:		dayResult["Users"].(int32),
	    }

	    // Assign the EventCount object to the CountByDay map
	    result.CountByDay[date] = eventCount
	}

	// make sure to insert 0 data points if no event exists for a day
	endDate := time.Now()
	for i := 0; i < ThirtyDays; i++ {
	    date := endDate.AddDate(0, 0, -i).Format("2006-01-02")

	    if _, exists := result.CountByDay[date]; !exists {
	        result.CountByDay[date] = EventCount{
	            PageView:   0,
	            NewGame:    0,
	            ResumeGame: 0,
	            AutoSave:   0,
	            Error:      0,
	            Users:      0,
	        }
	    }
	}

    json.NewEncoder(w).Encode(result)
}
