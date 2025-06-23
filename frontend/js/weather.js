// Crop tips based on weather conditions
const cropTips = {
  rain: "Good for rice; delay pesticide application.",
  clouds: "Monitor tomatoes for blight risk.",
  clear: "Ideal for wheat; ensure irrigation if dry.",
  thunderstorm: "Protect crops from wind damage.",
  snow: "Cover sensitive crops to prevent frost damage.",
};

// Weather condition scale for plotting
const weatherScale = {
  clear: 1,
  clouds: 2,
  rain: 3,
  thunderstorm: 4,
  snow: 5,
  default: 0,
};

// Initialize favorites on page load
window.onload = updateFavorites;

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const units = document.getElementById("unitSelect").value;
  const apiKey = "948be06921dc1d1d744418924cd429f5";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
  const resultDiv = document.getElementById("weatherResult");

  if (!city) {
    resultDiv.innerHTML = "<p style='color:red;'>Please enter a city name.</p>";
    return;
  }

  resultDiv.innerHTML = "<p>Loading forecast...</p>";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found or API error");
    const data = await response.json();

    let output = `<h3>${data.city.name}, ${data.city.country}</h3>`;
    const dailyForecasts = [];
    data.list.forEach((forecast, index) => {
      const date = new Date(forecast.dt * 1000);
      if (
        date.getHours() === 12 ||
        (index === 0 && dailyForecasts.length === 0)
      ) {
        dailyForecasts.push(forecast);
      }
    });

    const temps = [];
    const weatherConditions = [];
    const dates = [];
    let irrigationAdvice = "<h4>Irrigation Planner</h4>";
    let dryDays = 0;

    dailyForecasts.slice(0, 5).forEach((forecast, index) => {
      const date = new Date(forecast.dt * 1000).toLocaleDateString();
      const temp = forecast.main.temp;
      const weatherDesc = forecast.weather[0].main.toLowerCase();
      const rain = forecast.rain ? forecast.rain["3h"] : 0;
      temps.push(temp);
      weatherConditions.push(
        weatherScale[weatherDesc] || weatherScale["default"]
      );
      dates.push(date);

      let alert = "";
      if (temp > (units === "metric" ? 35 : 95)) {
        alert = "<p class='alert'>Warning: High heat risk!</p>";
      } else if (forecast.wind.speed > 15) {
        alert = "<p class='alert'>Alert: Strong winds expected!</p>";
      } else if (weatherDesc.includes("thunderstorm")) {
        alert = "<p class='alert'>Alert: Thunderstorm risk!</p>";
      }

      output += `
        <div class="forecast-day">
          <p><strong>${date}:</strong></p>
          <p>Temperature: ${temp} ${units === "metric" ? "°C" : "°F"}</p>
          <p>Weather: ${forecast.weather[0].description}</p>
          <p>Humidity: ${forecast.main.humidity}%</p>
          <p>Rain: ${rain} ${units === "metric" ? "mm" : "in"}</p>
          ${alert}
          <p><strong>Crop Tip:</strong> ${
            cropTips[weatherDesc] || "No specific advice."
          }</p>
        </div>
      `;

      // Irrigation planner logic
      if (rain < 5) {
        // Less than 5mm/in considered "no significant rain"
        dryDays++;
        if (dryDays === 3) {
          irrigationAdvice += `<p>No rain expected for 3 days—irrigate on ${date}.</p>`;
        }
      } else {
        dryDays = 0; // Reset if significant rain occurs
      }
    });

    renderChart(dates, temps, weatherConditions, units);
    resultDiv.innerHTML = output + irrigationAdvice;

    renderHistoricalData(city, units);
  } catch (error) {
    resultDiv.innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
  }
}

function renderChart(dates, temps, weatherConditions, units) {
  const ctx = document.getElementById("weatherChart").getContext("2d");
  if (
    window.weatherChart &&
    typeof window.weatherChart.destroy === "function"
  ) {
    window.weatherChart.destroy();
  }

  window.weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: `Temperature (${units === "metric" ? "°C" : "°F"})`,
          data: temps,
          borderColor: "#2e7d32",
          yAxisID: "y-temp",
          fill: false,
        },
        {
          label: "Weather Condition (1=Clear, 5=Snow)",
          data: weatherConditions,
          borderColor: "#6a1b9a",
          yAxisID: "y-weather",
          fill: false,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      scales: {
        "y-temp": {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: `Temperature (${units === "metric" ? "°C" : "°F"})`,
          },
        },
        "y-weather": {
          type: "linear",
          position: "right",
          min: 0,
          max: 5,
          title: { display: true, text: "Weather Condition" },
          ticks: { stepSize: 1 },
        },
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function (context) {
              if (context.dataset.label.includes("Weather")) {
                const value = context.raw;
                return `Weather: ${
                  Object.keys(weatherScale).find(
                    (key) => weatherScale[key] === value
                  ) || "Unknown"
                }`;
              }
              return `${context.dataset.label}: ${context.raw}`;
            },
          },
        },
      },
    },
  });
}

function renderHistoricalData(city, units) {
  const historicalTemps = Array(7)
    .fill(0)
    .map((_, i) => ({
      date: new Date(
        Date.now() - (7 - i) * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      temp:
        Math.random() * (units === "metric" ? 30 : 86) +
        (units === "metric" ? 10 : 50),
    }));

  let historicalOutput = "<h4>Last 7 Days (Simulated)</h4>";
  historicalTemps.forEach((day) => {
    historicalOutput += `<p>${day.date}: ${day.temp.toFixed(1)} ${
      units === "metric" ? "°C" : "°F"
    }</p>`;
  });
  document.getElementById("weatherResult").innerHTML += historicalOutput;
}

function saveCity() {
  const city = document.getElementById("cityInput").value.trim();
  let favorites = JSON.parse(localStorage.getItem("favoriteCities") || "[]");
  if (city && !favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("favoriteCities", JSON.stringify(favorites));
    updateFavorites();
  }
}

function updateFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favoriteCities") || "[]");
  const favoritesDiv = document.getElementById("favorites");
  favoritesDiv.innerHTML = favorites
    .map((city) => `<button onclick="loadCity('${city}')">${city}</button>`)
    .join(" ");
}

function loadCity(city) {
  document.getElementById("cityInput").value = city;
  getWeather();
}

document.getElementById("unitSelect").addEventListener("change", getWeather);
