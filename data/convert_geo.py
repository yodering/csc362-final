import googlemaps
import pandas as pd

# Initialize the client with your API key
gmaps = googlemaps.Client(key='')

# Define function to fetch coordinates
def get_coordinates(location):
    geocode_result = gmaps.geocode(location)
    if geocode_result:
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
        return pd.Series([lat, lng])
    return pd.Series([None, None])

# Load data and apply function
data = pd.read_csv('filtered_competitions.csv')
data[['latitude', 'longitude']] = data['venue'].apply(get_coordinates)
data.to_csv('updated_data1.csv', index=False)
