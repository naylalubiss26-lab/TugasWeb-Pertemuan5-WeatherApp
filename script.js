const CONFIG = {
  apiKey: "049749413823d35d1d2701df60e7f8b2",
};

const el = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  weather: document.getElementById("weather"),
  cityName: document.getElementById("city-name"),
  temperature: document.getElementById("temperature"),
  description: document.getElementById("description"),
  humidity: document.getElementById("humidity"),
  icon: document.getElementById("weather-icon"),
  history: document.getElementById("history"),
  historyList: document.getElementById("history-list"),
  unitToggle: document.getElementById("unit-toggle"),
  forecast: document.getElementById("forecast"),
  forecastList: document.getElementById("forecast-list"),
};

let history = [];
try {
  const saved = JSON.parse(localStorage.getItem("weatherHistory"));
  if (Array.isArray(saved)) history = saved;
} catch {
  history = [];
}

let currentData = null;
let forecastDays = [];
let isCelsius = true;

const toF = (c) => Math.round((c * 9) / 5 + 32);

const showHistory = () => {
  if (history.length > 0) el.history.classList.remove("hidden");
};

const hideHistory = () => el.history.classList.add("hidden");

const renderHistory = () => {
  el.historyList.innerHTML = history
    .map((city) => `<button type="button" class="history-item" data-city="${city}">${city}</button>`)
    .join("");
};

const saveToHistory = (city) => {
  history = history.filter((item) => item.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  history = history.slice(0, 5);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
};

const renderTemperature = () => {
  if (!currentData) return;
  const c = Math.round(currentData.main.temp);
  el.temperature.textContent = isCelsius ? `${c}°C` : `${toF(c)}°F`;
  el.unitToggle.textContent = isCelsius ? "Tukar ke °F" : "Tukar ke °C";
};

const renderForecast = () => {
  el.forecastList.innerHTML = forecastDays
    .map((day) => {
      const dayName = new Date(day.dt_txt).toLocaleDateString("id-ID", { weekday: "short" });
      const temp = Math.round(day.main.temp);
      const suhu = isCelsius ? `${temp}°` : `${toF(temp)}°`;
      return `
        <div class="forecast-card">
          <p class="fc-day">${dayName}</p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="ikon cuaca">
          <p class="fc-temp">${suhu}</p>
        </div>`;
    })
    .join("");
  el.forecast.classList.toggle("hidden", forecastDays.length === 0);
};

const updateTheme = (data) => {
  const kondisi = data.weather[0].main;
  const malamHari = data.weather[0].icon.includes("n");
  const body = document.body;

  body.className = "default";

  if (kondisi === "Clear") body.className = malamHari ? "malam" : "cerah";
  else if (kondisi === "Clouds") body.className = "mendung";
  else if (["Rain", "Drizzle", "Thunderstorm"].includes(kondisi)) body.className = "hujan";
  else if (malamHari) body.className = "malam";
};

const getWeather = async (city) => {
  hideHistory();
  el.loading.classList.remove("hidden");
  el.error.classList.add("hidden");
  el.weather.classList.add("hidden");
  el.forecast.classList.add("hidden");

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "😢 Kota tidak ditemukan. Cek ejaannya ya!"
          : "⚠️ Ada masalah dengan server. Coba lagi nanti."
      );
    }

    const data = await response.json();

    currentData = data;

    el.cityName.textContent = data.name;
    renderTemperature();
    el.description.textContent = data.weather[0].description;
    el.humidity.textContent = `Kelembaban: ${data.main.humidity}%`;
    el.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    saveToHistory(data.name);
    updateTheme(data);
    el.weather.classList.remove("hidden");

    getForecast(city);
  } catch (err) {
    el.error.textContent =
      err.message === "Failed to fetch"
        ? "📡 Gagal terhubung. Cek koneksi internetmu!"
        : err.message;
    el.error.classList.remove("hidden");
  } finally {
    el.loading.classList.add("hidden");
  }
};

const getForecast = async (city) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!response.ok) return;

    const data = await response.json();
    forecastDays = data.list.filter((item) => item.dt_txt.includes("12:00:00"));
    renderForecast();
  } catch (err) {
    console.error("Forecast gagal dimuat:", err);
  }
};

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (!city) return;
  getWeather(city);
});

input.addEventListener("click", showHistory);
input.addEventListener("focus", showHistory);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-area")) hideHistory();
});

el.historyList.addEventListener("click", (event) => {
  const city = event.target.dataset.city;
  if (city) getWeather(city);
});

el.unitToggle.addEventListener("click", () => {
  isCelsius = !isCelsius;
  renderTemperature();
  renderForecast();
});

renderHistory();