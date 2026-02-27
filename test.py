import requests

def get_weather_by_city(city_name):
    # 1. City name se coordinates (lat/lon) hasil karein
    geo_url = f"https://geocoding-api.open-meteo.com{city_name}&count=1&language=en&format=json"
    geo_response = requests.get(geo_url).json()
    
    if "results" in geo_response:
        location = geo_response["results"][0]
        lat, lon = location["latitude"], location["longitude"]
        
        # 2. In coordinates se weather hasil karein
        weather_url = f"https://api.open-meteo.com{lat}&longitude={lon}&current_weather=true"
        weather_data = requests.get(weather_url).json()
        
        temp = weather_data["current_weather"]["temperature"]
        print(f"{city_name} ka temperature {temp}°C hai.")
    else:
        print("City nahi mila!")

# Istemal karein
city = input("Shehar ka naam likhein: ")
get_weather_by_city(city)
