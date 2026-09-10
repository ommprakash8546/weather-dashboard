import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // City
  const [city, setCity] = useState(() => {
    return localStorage.getItem('lastCity') || ''
  })

  // Current weather
  const [weather, setWeather] = useState(() => {
    const savedWeather = localStorage.getItem('weather')

    return savedWeather ? JSON.parse(savedWeather) : null
  })

  // Forecast
  const [forecast, setForecast] = useState(() => {
    const savedForecast = localStorage.getItem('forecast')

    return savedForecast ? JSON.parse(savedForecast) : null
  })

  // Loading and error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Last updated
  const [lastUpdated, setLastUpdated] = useState(() => {
    return localStorage.getItem('lastUpdated') || ''
  })

  // Recent searches
  const [recentCities, setRecentCities] = useState(() => {
    const savedCities = localStorage.getItem('recentCities')

    if (!savedCities) {
      return []
    }

    try {
      const parsedCities = JSON.parse(savedCities)

      return Array.isArray(parsedCities)
        ? parsedCities
        : []
    } catch {
      return []
    }
  })

  // Save recent cities
  useEffect(() => {
    localStorage.setItem(
      'recentCities',
      JSON.stringify(recentCities)
    )
  }, [recentCities])

  // Save weather
  useEffect(() => {
    if (weather) {
      localStorage.setItem(
        'weather',
        JSON.stringify(weather)
      )
    }
  }, [weather])

  // Save forecast
  useEffect(() => {
    if (forecast) {
      localStorage.setItem(
        'forecast',
        JSON.stringify(forecast)
      )
    }
  }, [forecast])

  // Save last updated time
  useEffect(() => {
    if (lastUpdated) {
      localStorage.setItem(
        'lastUpdated',
        lastUpdated
      )
    }
  }, [lastUpdated])

  // Save last city
  useEffect(() => {
    if (city.trim()) {
      localStorage.setItem(
        'lastCity',
        city
      )
    }
  }, [city])

  // Add city to recent searches
  const addRecentCity = (cityName) => {
    setRecentCities((previousCities) => {
      const updatedCities = [
        cityName,
        ...previousCities.filter(
          (item) =>
            item.toLowerCase() !==
            cityName.toLowerCase()
        )
      ]

      return updatedCities.slice(0, 5)
    })
  }

  // Get weather by city
  const searchWeather = async (cityName = city) => {
    const searchCity = cityName.trim()

    if (!searchCity) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const apiKey =
        import.meta.env.VITE_WEATHER_API_KEY

      // Current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          searchCity
        )}&appid=${apiKey}&units=metric`
      )

      if (!weatherResponse.ok) {
        const errorData =
          await weatherResponse.json()

        throw new Error(
          errorData.message ||
            `Weather request failed (${weatherResponse.status})`
        )
      }

      const weatherData =
        await weatherResponse.json()

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          searchCity
        )}&appid=${apiKey}&units=metric`
      )

      if (!forecastResponse.ok) {
        const errorData =
          await forecastResponse.json()

        throw new Error(
          errorData.message ||
            'Unable to fetch forecast'
        )
      }

      const forecastData =
        await forecastResponse.json()

      // Update state
      setWeather(weatherData)
      setForecast(forecastData)
      setCity(weatherData.name)
      setLastUpdated(
        new Date().toLocaleTimeString()
      )

      addRecentCity(weatherData.name)

      console.log(
        'Weather data:',
        weatherData
      )

      console.log(
        'Forecast data:',
        forecastData
      )
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Get weather using current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(
        'Geolocation is not supported by your browser'
      )
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const {
          latitude,
          longitude
        } = position.coords

        try {
          const apiKey =
            import.meta.env.VITE_WEATHER_API_KEY

          // Current weather using latitude/longitude
          const weatherResponse =
            await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
            )

          if (!weatherResponse.ok) {
            const errorData =
              await weatherResponse.json()

            throw new Error(
              errorData.message ||
                'Unable to get current weather'
            )
          }

          const weatherData =
            await weatherResponse.json()

          // Forecast using latitude/longitude
          const forecastResponse =
            await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
            )

          if (!forecastResponse.ok) {
            const errorData =
              await forecastResponse.json()

            throw new Error(
              errorData.message ||
                'Unable to fetch forecast'
            )
          }

          const forecastData =
            await forecastResponse.json()

          // Update state
          setWeather(weatherData)
          setForecast(forecastData)
          setCity(weatherData.name)
          setLastUpdated(
            new Date().toLocaleTimeString()
          )

          addRecentCity(weatherData.name)

          console.log(
            'Current location weather:',
            weatherData
          )

          console.log(
            'Current location forecast:',
            forecastData
          )
        } catch (error) {
          setError(error.message)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLoading(false)
        setError(
          'Unable to access your location'
        )
      }
    )
  }

  // Forecast cards
  const forecastItems =
    forecast?.list
      ?.filter((item) =>
        item.dt_txt.includes('12:00:00')
      )
      .slice(0, 5) || []

  return (
    <div className="weather-app">

      {/* Header */}
      <header className="weather-header">
        <h1>Weather Dashboard</h1>

        <p>
          Check current weather conditions by city
        </p>
      </header>

      <main>

        {/* Search Section */}
        <section className="search-section">

          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchWeather()
              }
            }}
          />

          <button
            onClick={() => searchWeather()}
          >
            Search
          </button>

          <button
            className="location-btn"
            onClick={getCurrentLocation}
          >
            📍 Current Location
          </button>

        </section>

        {/* Recent Searches */}
        {recentCities.length > 0 && (
          <div className="recent-searches">

            <div className="recent-header">

              <p>Recent Searches</p>

              <button
                className="clear-recent"
                onClick={() =>
                  setRecentCities([])
                }
              >
                Clear
              </button>

            </div>

            <div className="recent-cities">

              {recentCities.map(
                (recentCity) => (
                  <button
                    key={recentCity}
                    onClick={() => {
                      setCity(recentCity)
                      searchWeather(
                        recentCity
                      )
                    }}
                  >
                    {recentCity}
                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading">

            <div className="spinner"></div>

            <p>
              Loading weather...
            </p>

          </div>
        )}

        {/* Error */}
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {/* Current Weather */}
        {weather && !loading && (
          <section className="weather-card">

            <div className="weather-main">

              <div className="weather-location">

                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt={
                    weather.weather[0]
                      .description
                  }
                />

                <div>

                  <h2>
                    {weather.name}
                  </h2>

                  <p className="weather-condition">
                    {
                      weather.weather[0]
                        .description
                    }
                  </p>

                </div>

              </div>

              <div className="temperature">
                {Math.round(
                  weather.main.temp
                )}
                °C
              </div>

            </div>

            {/* Refresh Button */}
            <button
              className="refresh-btn"
              onClick={() =>
                searchWeather(
                  weather.name
                )
              }
            >
              🔄 Refresh Weather
            </button>

            {/* Weather Details */}
            <div className="weather-details">

              <div className="weather-detail">

                <span>🌡️</span>

                <p>
                  Feels Like
                </p>

                <strong>
                  {Math.round(
                    weather.main
                      .feels_like
                  )}
                  °C
                </strong>

              </div>

              <div className="weather-detail">

                <span>💧</span>

                <p>
                  Humidity
                </p>

                <strong>
                  {weather.main.humidity}%
                </strong>

              </div>

              <div className="weather-detail">

                <span>💨</span>

                <p>
                  Wind Speed
                </p>

                <strong>
                  {weather.wind.speed} m/s
                </strong>

              </div>

              <div className="weather-detail">

                <span>🌡️</span>

                <p>
                  Pressure
                </p>

                <strong>
                  {weather.main.pressure} hPa
                </strong>

              </div>

              <div className="weather-detail">

                <span>👁️</span>

                <p>
                  Visibility
                </p>

                <strong>
                  {(
                    weather.visibility /
                    1000
                  ).toFixed(1)} km
                </strong>

              </div>

            </div>

            {/* Last Updated */}
            <p className="last-updated">
              Last updated:{' '}
              {lastUpdated}
            </p>

          </section>
        )}

        {/* 5-Day Forecast */}
        {forecast && !loading && (
          <section className="forecast-section">

            <h2>
              5-Day Forecast
            </h2>

            <div className="forecast-grid">

              {forecastItems.map(
                (item) => (
                  <div
                    className="forecast-card"
                    key={item.dt}
                  >

                    <p className="forecast-date">
                      {new Date(
                        item.dt * 1000
                      ).toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        }
                      )}
                    </p>

                    <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                      alt={
                        item.weather[0]
                          .description
                      }
                    />

                    <p className="forecast-condition">
                      {
                        item.weather[0]
                          .description
                      }
                    </p>

                    <strong>
                      {Math.round(
                        item.main.temp
                      )}
                      °C
                    </strong>

                  </div>
                )
              )}

            </div>

          </section>
        )}

      </main>

            <footer className="weather-footer">
        Weather data provided by OpenWeather
      </footer>

    </div>
  )
}

export default App