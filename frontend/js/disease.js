let currentLanguage = "en";

function changeLanguage() {
  currentLanguage = document.getElementById("langSelect").value;
  renderPage();
}

function renderPage() {
  const trans = translations[currentLanguage].disease;
  document.getElementById("diseaseHeader").innerHTML = trans.header;
  document.getElementById("diseaseHeader").nextElementSibling.textContent =
    trans.subHeader;
  document.getElementById("imageUpload").nextElementSibling.textContent =
    trans.uploadPrompt; // Placeholder for prompt
  document.getElementById("analyzeBtn").textContent = trans.analyze;
  document.getElementById("homeLink").textContent = trans.home;
}

window.onload = function () {
  renderPage();
};

async function predictDisease() {
  const fileInput = document.getElementById("imageUpload");
  const resultDiv = document.getElementById("result");
  const weatherWarningDiv = document.getElementById("weatherWarning");

  if (!fileInput.files[0]) {
    resultDiv.innerHTML = translations[currentLanguage].disease.uploadPrompt;
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    resultDiv.innerHTML = "Analyzing...";
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      resultDiv.innerHTML = `${
        translations[currentLanguage].disease.resultPrefix
      } <strong>${data.disease}</strong> (${
        translations[currentLanguage].disease.confidence
      } ${(data.confidence * 100).toFixed(2)}%)`;

      const weatherData = await getWeatherForCorrelation("Delhi"); // Replace with dynamic city
      checkWeatherDiseaseCorrelation(
        weatherData,
        data.disease,
        weatherWarningDiv
      );
    } else {
      resultDiv.innerHTML = `${translations[currentLanguage].weather.error}: ${data.error}`;
    }
  } catch (error) {
    resultDiv.innerHTML = `${translations[currentLanguage].weather.error}: ${error.message}`;
  }
}

async function getWeatherForCorrelation(city) {
  const units = "metric";
  const apiKey = "948be06921dc1d1d744418924cd429f5";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.list.slice(0, 5);
}

function checkWeatherDiseaseCorrelation(weatherData, disease, warningDiv) {
  let warning = "";
  const avgHumidity =
    weatherData.reduce((sum, forecast) => sum + forecast.main.humidity, 0) /
    weatherData.length;

  if (
    avgHumidity > 80 &&
    (disease.toLowerCase().includes("blight") ||
      disease.toLowerCase().includes("rust"))
  ) {
    warning = `${translations[currentLanguage].weather.warning}: ${
      translations[currentLanguage].weather.highHumidityRisk ||
      "High humidity may increase fungal disease risk."
    }`;
  }
  warningDiv.innerHTML = warning;
}
