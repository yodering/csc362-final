const width = window.innerWidth;
const height = window.innerHeight;

// Create SVG element
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define a projection type
const projection = d3.geoMercator()
    .center([20, 50]) // Center on Europe
    .scale(500) // Initial scale
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Modify here: Increase the maximum zoom scale
const zoom = d3.zoom()
    .scaleExtent([1, 20]) // Allow zooming in more closely, max scale was increased from 8 to 20
    .on("zoom", (event) => {
        svg.selectAll("path").attr('transform', event.transform);
        svg.selectAll("circle")
            .attr('transform', event.transform)
            .attr('r', 5 / event.transform.k) // Adjust the circle radius inversely with zoom
            .attr('stroke-width', 1 / event.transform.k); // Adjust stroke width inversely with zoom
    });

svg.call(zoom);

// Create a tooltip div that is hidden by default
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "left")
    .style("width", "200px")
    .style("height", "auto")
    .style("padding", "10px")
    .style("background", "white")
    .style("border", "1px solid #000")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// Load and process data
d3.json("geojson/europe.geojson").then(function (europe) {
    d3.csv("/data/updated_data6.csv").then(function (data) {
        data.forEach(d => {
            const dateYear = d.date.split(",").pop().trim(); // Extract the year from the date string
            d.year = parseInt(dateYear); // Convert the year to an integer
            if (d.longitude && d.latitude) {
                d.jitteredLongitude = +d.longitude + (Math.random() - 0.5) * 0.05; // Jitter positions
                d.jitteredLatitude = +d.latitude + (Math.random() - 0.5) * 0.05;
            }
        });

        const validData = data.filter(d => d.jitteredLongitude && d.jitteredLatitude);

        const years = Array.from(new Set(validData.map(d => d.year))).sort();

        const distinctColors = [
            '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
            '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'
        ];

        function distinctColorScale() {
            return d3.scaleOrdinal().range(distinctColors);
        }

        // Use the custom distinct color scale
        const colorScale = distinctColorScale();

        let filteredData = validData; // Initialize filteredData with all valid data

        function filterData() {
            const selectedYear = yearSelect.property("value");
            const selectedCountry = countrySelect.property("value");

            if (selectedYear === "" && selectedCountry === "") {
                filteredData = validData;
            } else if (selectedYear === "") {
                filteredData = validData.filter(d => d.country === selectedCountry);
            } else if (selectedCountry === "") {
                filteredData = validData.filter(d => d.year === +selectedYear);
            } else {
                filteredData = validData.filter(d => d.year === +selectedYear && d.country === selectedCountry);
            }
            updateMap();
            updateDisplayedCount();
        }

        // Create a select dropdown for year filtering
        const yearSelect = d3.select("body").append("select")
            .on("change", filterData);

        yearSelect.append("option")
            .attr("value", "")
            .text("All Years");

        years.forEach(year => {
            yearSelect.append("option")
                .attr("value", year)
                .text(year);
        });

        // Create a select dropdown for country filtering
        const countrySelect = d3.select("body").append("select")
            .on("change", filterData);

        countrySelect.append("option")
            .attr("value", "")
            .text("All Countries");

        const countries = Array.from(new Set(validData.map(d => d.country))).sort();
        countries.forEach(country => {
            countrySelect.append("option")
                .attr("value", country)
                .text(country);
        });

        function updateMap() {
            svg.selectAll(".competition")
                .data(filteredData, d => d.name)
                .join(
                    enter => enter.append("circle")
                        .attr("class", "competition")
                        .attr("cx", d => projection([d.jitteredLongitude, d.jitteredLatitude])[0])
                        .attr("cy", d => projection([d.jitteredLongitude, d.jitteredLatitude])[1])
                        .attr("r", 5)
                        .attr("fill", d => colorScale(d.year))
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1.5)
                        .on("mouseover", function (event, d) {
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", .9);
                            tooltip.html(`Name: ${d.name}<br/>Location: ${d.city ? d.city + ', ' : ''}${d.country}<br/>Venue: ${d.venue}<br/>Date: ${d.date}`)
                                .style("left", (event.pageX + 5) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseout", function (d) {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        }),
                    update => update,
                    exit => exit.remove()
                );
        }

        function updateDisplayedCount() {
            svg.select(".displayed-count")
                .text(`Displayed Competitions: ${filteredData.length}`);
        }

        // Plot the map
        svg.selectAll("path")
            .data(europe.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);

        // Initial map update
        updateMap();
        updateDisplayedCount();

        // Display count of competitions
        svg.append("text")
            .attr("class", "displayed-count")
            .attr("x", 50)
            .attr("y", height - 20)
            .style("font-size", "16px")
            .text(`Displayed Competitions: ${validData.length}`);

        // Add color key
        const colorKey = svg.append("g")
            .attr("class", "color-key")
            .attr("transform", `translate(${width - 200}, 20)`); // Position the key at the top-right corner

        colorKey.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-weight", "bold")
            .text("Year");

        const keyItems = colorKey.selectAll(".key-item")
            .data(years)
            .enter()
            .append("g")
            .attr("class", "key-item")
            .attr("transform", (d, i) => `translate(0, ${(i + 1) * 25})`); // Adjust the spacing between key items

        keyItems.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));

        keyItems.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text(d => d);

        // Calculate the height of the color key
        const keyHeight = (years.length + 1) * 25; // +1 to account for the "Year" label

        // If the key height exceeds the available space, adjust the SVG height
        if (keyHeight > height - 40) {
            svg.attr("height", keyHeight + 40); // Add some padding for the key
        }
    });
});