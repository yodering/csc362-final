const width = window.innerWidth;
const height = window.innerHeight;

// create text SVG
const textSvg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", 30);

// create map SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height - 30)
    .attr("alt", "Interactive map of competitions in Europe");

const projection = d3.geoMercator()
    .center([20, 50])
    .scale(500)
    .translate([width / 2, (height - 30) / 2]);

const path = d3.geoPath().projection(projection);

// zoom scale
const zoom = d3.zoom()
    .scaleExtent([1, 20]) 
    .on("zoom", (event) => {
        svg.selectAll("path").attr('transform', event.transform);
        svg.selectAll("circle")
            .attr('transform', event.transform)
            .attr('r', 5 / event.transform.k) 
            .attr('stroke-width', 1 / event.transform.k); 
    });

svg.call(zoom);

// tooltip div
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

// load data
d3.json("geojson/europe.geojson").then(function (europe) {
    d3.csv("data/updated_data6.csv").then(function (data) {
        data.forEach(d => {
            const dateYear = d.date.split(",").pop().trim(); 
            d.year = parseInt(dateYear); 
            if (d.longitude && d.latitude) {
                d.jitteredLongitude = +d.longitude + (Math.random() - 0.5) * 0.05; // jitter
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

        // custom colors
        const colorScale = distinctColorScale();

        let filteredData = validData; 
        let selectedYears = []; 

        function filterData() {
            const selectedCountries = Array.from(countrySelect.property("selectedOptions"), option => option.value);
        
            if (selectedYears.length === 0 && (selectedCountries.length === 0 || selectedCountries.includes(""))) {
                filteredData = validData;
            } else if (selectedYears.length === 0) {
                filteredData = validData.filter(d => selectedCountries.includes(d.country.split(",")[0].trim()));
            } else if (selectedCountries.length === 0 || selectedCountries.includes("")) {
                filteredData = validData.filter(d => selectedYears.includes(d.year));
            } else {
                filteredData = validData.filter(d => selectedYears.includes(d.year) && selectedCountries.includes(d.country.split(",")[0].trim()));
            }
            updateMap();
            updateDisplayedCount();
            resetZoom(); // call reset zoom to fix marker positioning bug
        }

        
        const countrySelect = d3.select("#filter-controls").append("select")
            .attr("multiple", true)
            .style("width", "200px") 
            .style("height", "125px")
            .attr("aria-label", "Filter competitions by country")
            .on("change", filterData);

        
        countrySelect.append("option")
            .attr("value", "")
            .text("All Countries");

        // only country
        const countries = Array.from(new Set(validData.map(d => d.country.split(",")[0].trim()))).sort();

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
                            tooltip.html(`Name: ${d.name}<br/>Location: ${d.country}<br/>Venue: ${d.venue}<br/>Date: ${d.date}`)
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
            textSvg.select(".displayed-count")
                .text(`Displayed Competitions: ${filteredData.length}`);
        }
        
        // count of competition
        textSvg.append("text")
            .attr("class", "displayed-count")
            .attr("x", 50)
            .attr("y", 20)
            .style("font-size", "16px")
            .text(`Displayed Competitions: ${validData.length}`);
        
        // plot map
        svg.selectAll("path")
            .data(europe.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);

        
        updateMap();
        updateDisplayedCount();

        // color key
        const colorKey = svg.append("g")
            .attr("class", "color-key")
            .attr("transform", `translate(${width - 200}, 20)`)
            .attr("aria-label", "Color key for competition years");

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
            .attr("transform", (d, i) => `translate(0, ${(i + 1) * 25})`)
            .on("click", function (event, d) {
                const index = selectedYears.indexOf(d);
                if (index > -1) {
                    selectedYears.splice(index, 1);
                    d3.select(this).select("rect")
                        .attr("stroke", "#000")
                        .attr("stroke-width", 1);
                } else {
                    selectedYears.push(d);
                    d3.select(this).select("rect")
                        .attr("stroke", "blue")
                        .attr("stroke-width", 2);
                }
                filterData();
            })
            .style("cursor", "pointer");

        keyItems.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d))
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .on("mouseover", function () {
                if (selectedYears.indexOf(d3.select(this.parentNode).datum()) === -1) {
                    d3.select(this).attr("stroke-width", 2);
                }
            })
            .on("mouseout", function () {
                if (selectedYears.indexOf(d3.select(this.parentNode).datum()) === -1) {
                    d3.select(this).attr("stroke-width", 1);
                }
            });

        keyItems.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text(d => d);

       
        const keyHeight = (years.length + 1) * 25; 

        
        if (keyHeight > height - 40) {
            svg.attr("height", keyHeight + 40); 
        }

        // reset button
        const resetButton = d3.select("#controls")
            .append("button")
            .text("Reset Selection")
            .attr("aria-label", "Reset country and year selection")
            .on("click", resetMap);

        function resetMap() {
            countrySelect.property("value", [""]);

            selectedYears = [];

            colorKey.selectAll(".key-item rect")
                .attr("stroke", "#000")
                .attr("stroke-width", 1);

            filteredData = validData;


            updateMap();
            updateDisplayedCount();
        }

        // reset zoom
        const resetZoomButton = d3.select("#zoom-controls")
            .append("button")
            .text("Reset Zoom")
            .attr("aria-label", "Reset map zoom level")
            .on("click", resetZoom);

        function resetZoom() {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        }

    });
});