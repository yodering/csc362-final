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
d3.json("geojson/europe.geojson").then(function(europe) {
    d3.csv("/data/updated_1.csv").then(function(data) {
        data.forEach(d => {
            const dateYear = d.date.split(",").pop().trim(); // Extract the year from the date string
            d.year = parseInt(dateYear); // Convert the year to an integer
            if (d.longitude && d.latitude) {
                d.jitteredLongitude = +d.longitude + (Math.random() - 0.5) * 0.05; // Jitter positions
                d.jitteredLatitude = +d.latitude + (Math.random() - 0.5) * 0.05;
            }
        });

        const validData = data.filter(d => d.jitteredLongitude && d.jitteredLatitude);
        const missingDataCount = data.length - validData.length;

        const years = Array.from(new Set(validData.map(d => d.year))).sort();
        const colorScale = d3.scaleOrdinal()
            .domain(years)
            .range(d3.schemeTableau10);

        // Plot the map and data points
        svg.selectAll("path")
            .data(europe.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);

        svg.selectAll(".competition")
            .data(validData)
            .enter()
            .append("circle")
            .attr("class", "competition")
            .attr("cx", d => projection([d.jitteredLongitude, d.jitteredLatitude])[0])
            .attr("cy", d => projection([d.jitteredLongitude, d.jitteredLatitude])[1])
            .attr("r", 5)
            .attr("fill", d => colorScale(d.year)) // Use color scale based on the year
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Name: ${d.name}<br/>Location: ${d.city ? d.city + ', ' : ''}${d.country}<br/>Venue: ${d.venue}<br/>Date: ${d.date}`) // Display the full range of days in the tooltip
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Display count of competitions
        svg.append("text")
            .attr("x", 50)
            .attr("y", height - 40)
            .style("font-size", "16px")
            .text(`Displayed Competitions: ${validData.length}`);

        svg.append("text")
            .attr("x", 50)
            .attr("y", height - 20)
            .style("font-size", "16px")
            .text(`Missing Competitions: ${missingDataCount}`);
    });
});

