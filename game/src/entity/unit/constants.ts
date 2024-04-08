import Time from 'timeline/time'


export const FOOD_COST = 2
export const TERRAFORM_TOOLS_CONSUMPTION = 10
export const PIONEER_MAX_TOOLS = 5 * TERRAFORM_TOOLS_CONSUMPTION
export const MINIMAL_EQUPIMENT = 0.1
export const UNIT_FOOD_CAPACITY = 20
export const PASSENGER_WEIGHT = 100

export const RADIUS_GROWTH = 1.0 / (2 * Time.WEEK)

export const TRAVEL_EQUIPMENT = {
    water: ['wood', 'tools', 'cloth'],
    sea: ['wood', 'tools', 'cloth'],
    wagon: ['wood', 'tools'],
    horse: ['horses'],
    nativeHorse: ['horses'],
}
