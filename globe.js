// Set up the canvas and context
const width = 600;
const height = 400;
const canvas = document.getElementById("globeCanvas");
canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");

const countryNameDiv = document.getElementById("countryName");

// Country name mapping for consistent formatting
const countryNameMapping = { /* (same as your original country mapping) */ };

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
  function render(highlightCountry, highlightLocation, circuitName, arcCoords = null) {
    context.clearRect(0, 0, width, height);
    
    // Draw the outer sphere (globe) with a white border
    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = "black";  // Globe background color
    context.fill();
    context.strokeStyle = "white"; // White border for the globe
    context.lineWidth = 2;
    context.stroke();

    // Draw each country in light gray, highlighting selected ones in red
    land.forEach(country => {
      context.beginPath();
      path(country);

      const mappedCountryName = getMappedCountryName(highlightCountry);
      const countryNameInData = country.properties.name;

      if (countryNameInData === mappedCountryName) {
        context.fillStyle = "red";  // Highlighted country in red
      } else {
        context.fillStyle = "#444";  // Light gray color for other countries
      }
      context.fill();
    });

    // Draw country borders in white for clarity
    context.beginPath();
    path(borders);
    context.strokeStyle = "white";
    context.lineWidth = 0.5;
    context.stroke();

    // Draw the arc between countries with a brighter color
    if (arcCoords) {
      context.beginPath();
      const arcPath = d3.geoPath()
                        .projection(projection)
                        .context(context);
      arcPath({ type: "LineString", coordinates: arcCoords });
      context.strokeStyle = "#bbb"; // Brighter gray color for arc
      context.lineWidth = 2;
      context.stroke();
    }

    // Draw the circuit marker dot in red and label in white
    if (highlightLocation) {
      const [x, y] = projection([highlightLocation.lng, highlightLocation.lat]);
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = "red";  // Marker color in red for F1 theme
      context.fill();

      // Set font and color for the circuit name label in white
      context.font = "bold 14px Arial";
      context.fillStyle = "white"; // Label color in white for readability
      context.fillText(circuitName, x + 7, y);
    }
  }

  // Initial render with no circuit highlighted
  render();

  // Rotate and highlight circuits one by one
  let previousLocation = null;
  circuits.forEach((circuit, i) => {
    const country = circuit.country;
    const location = { lat: +circuit.lat, lng: +circuit.lng };
    const circuitName = circuit.name;

    setTimeout(() => {
      countryNameDiv.innerText = `Country: ${country} | Circuit: ${circuitName}`;

      // Define rotation and interpolation
      const iv = d3.interpolate(
        projection.rotate(),
        [-location.lng, 20 - location.lat]
      );

      // Define arc coordinates if a previous location exists
      const arcCoords = previousLocation ? [[previousLocation.lng, previousLocation.lat], [location.lng, location.lat]] : null;

      d3.transition()
        .duration(1250)
        .tween("rotate", () => t => {
          projection.rotate(iv(t));
          render(country, location, circuitName, arcCoords);
        });

      // Update previous location
      previousLocation = location;
    }, i * 2000); // Delay between each transition
  });
});
