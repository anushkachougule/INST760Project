// Set up the canvas and context
const width = 800;
const height = 720;
const canvas = document.getElementById("globeCanvas");
const context = canvas.getContext("2d");

const countryNameDiv = document.getElementById("countryName");

// Country name mapping for consistent formatting
const countryNameMapping = {
  "USA": "United States of America",
  "UK": "United Kingdom",
  "Russia": "Russian Federation",
  "South Korea": "Korea, Republic of",
  "Venezuela": "Venezuela (Bolivarian Republic of)",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  "Iran": "Iran (Islamic Republic of)",
  "Vietnam": "Viet Nam",
  "UAE": "United Arab Emirates",
  "Australia": "Australia",
  "Qatar": "Qatar",
  "Sweden": "Sweden",
  "Azerbaijan": "Azerbaijan",
  "Spain": "Spain",
  "Germany": "Germany",
  "Switzerland": "Switzerland",
  "Belgium": "Belgium",
  "Hungary": "Hungary",
  "Argentina": "Argentina",
  "Morocco": "Morocco",
  "France": "France",
  "South Africa": "South Africa",
  "Portugal": "Portugal",
  "Turkey": "Turkey",
  "Saudi Arabia": "Saudi Arabia",
  "Malaysia": "Malaysia",
  "Singapore": "Singapore",
  "Mexico": "Mexico",
  "Monaco": "Monaco",
  "Canada": "Canada",
  "Italy": "Italy",
  "Japan": "Japan",
  "Brazil": "Brazil",
  "China": "China",
  "Austria": "Austria",
  "India": "India",
  "Netherlands": "Netherlands",
  "Korea": "Korea, Republic of",
  "Bahrain": "Bahrain",
  "Singapore": "Singapore",
  "Monaco": "Monaco",
  "USA": "United States of America"  // for Las Vegas

};

// Helper function to get the correct country name
function getMappedCountryName(country) {
  return countryNameMapping[country] || country;
}

// Set up the globe projection and path generator
const projection = d3.geoOrthographic().fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" });
const path = d3.geoPath(projection, context);

// Load the world map and F1 circuits data
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"), // World map data
  d3.csv("circuits.csv") // Circuit data
]).then(([worldData, circuits]) => {
  const land = topojson.feature(worldData, worldData.objects.countries).features;
  const borders = topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b);

  // Render function to draw the globe and circuits
  function render(highlightCountry, highlightLocation, circuitName) {
    context.clearRect(0, 0, width, height);
  
    // Log the country and circuit being processed
    console.log(`Rendering for country: ${highlightCountry}, circuit: ${circuitName}`);
  
    // Highlight the country
    land.forEach(country => {
      context.beginPath();
      path(country);
  
      const mappedCountryName = getMappedCountryName(highlightCountry);
      const countryNameInData = country.properties.name;
  
      if (countryNameInData === mappedCountryName) {
        context.fillStyle = "#f00";  // Highlight country in red
        console.log(`Highlighting: ${countryNameInData}`);
      } else {
        context.fillStyle = "#ccc";  // Default fill for other countries
      }
      context.fill();
    });
  
    // Draw country borders
    context.beginPath();
    path(borders);
    context.strokeStyle = "#fff";
    context.lineWidth = 0.75;
    context.stroke();
  
    // Ensure that multiple circuit locations are marked and labeled even if they are in the same country
    if (highlightLocation) {
      const [x, y] = projection([highlightLocation.lng, highlightLocation.lat]);
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = "black";
      context.fill();
  
      // Add the circuit name label near the marker
      console.log(`Placing marker for ${circuitName} at ${highlightLocation.lng}, ${highlightLocation.lat}`);
      context.font = "14px Arial";
      context.fillStyle = "black";
      context.fillText(circuitName, x + 7, y);
    }
  }
  

  // Initial render with no circuit highlighted
  render();

  // Rotate and highlight circuits one by one
  let p1 = [0, 0], p2 = [0, 0];
  let r1 = [0, 0, 0], r2 = [0, 0, 0];

  circuits.forEach((circuit, i) => {
    const country = circuit.country;
    const location = { lat: +circuit.lat, lng: +circuit.lng };
    const circuitName = circuit.name;

    setTimeout(() => {
      countryNameDiv.innerText = `Country: ${country} | Circuit: ${circuitName}`;

      p1 = p2, p2 = [location.lng, location.lat];
      r1 = r2, r2 = [-p2[0], 20 - p2[1], 0]; // Adjust rotation based on circuit location
      const iv = d3.interpolate(r1, r2);

      d3.transition()
        .duration(1250)
        .tween("rotate", () => t => {
          projection.rotate(iv(t));
          render(country, location, circuitName);
        });
    }, i * 2000); // Delay between each transition
  });
});
