const prices = {
    Wheat: {
      Delhi: "₹2100/quintal",
      Mumbai: "₹2300/quintal",
      Kolkata: "₹2150/quintal"
    },
    Rice: {
      Delhi: "₹1900/quintal",
      Mumbai: "₹2050/quintal",
      Kolkata: "₹2000/quintal"
    },
    Tomato: {
      Delhi: "₹900/quintal",
      Mumbai: "₹1100/quintal",
      Kolkata: "₹950/quintal"
    }
  };
  
  function showPrices() {
    const crop = document.getElementById("cropSelect").value;
    const data = prices[crop];
    if (!data) return;
  
    let output = `<h3>${crop} Prices</h3>`;
    for (let city in data) {
      output += `<p><strong>${city}:</strong> ${data[city]}</p>`;
    }
    document.getElementById("priceResult").innerHTML = output;
  }
  