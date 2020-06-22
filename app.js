var jsonData = d3.json("GlobalTemperatures.json"); //read data
//svg dims
var width = 1400;
var height = 600;
var padding = 60;

//colors for temperature
var colors = [ "#313695",  "#4575b4",  "#74add1",  "#abd9e9",  "#e0f3f8",  "#ffffbf",  "#fee090",  "#fdae61",  "#f46d43",  "#d73027",  "#a50026" ];
var months = [ "January",  "February",  "March",  "April",  "May",  "June",  "July",  "August",  "September",  "October",  "November",  "December" ];

//svg init and tooltip fetch
var svg = d3.select(".map")
            .append("svg")
            .attr("width", width)
            .attr("height", height + padding);
var tooltip = d3.select("#tooltip");
tooltip.attr("id", "tooltip");

//work with json data
jsonData.then(data => {
    var baseTemp = data.baseTemperature;
    var dataset = data.monthlyVariance;
    //easier scaling since months array begins from 0, see case scaleAdjust
    dataset.forEach(d => {
      d.month -= 1;
    });
    var minTemp = d3.min(dataset, d => d.variance) + baseTemp;
    var maxTemp = d3.max(dataset, d => d.variance) + baseTemp;
    var years = dataset.map(data => data.year);
    var range = d3.extent(years);
    //dims for cells which represent months
    var cellWidth = (width - 2 * padding) / (range[1] - range[0] + 1);
    var cellHeight = (height - 2 * padding) / 11;
    //heatmap scales
    var xScale = d3.scaleLinear()
                  .domain(range)
                  .range([padding, width - padding]);
    var yScale = d3.scaleLinear()
                  .domain([11, 0])
                  .range([height - padding, padding]);
    //heatmap axes
    var xAxis = d3.axisBottom(xScale)
                  .tickFormat(d3.format("d"))
                  .tickSize(10, 1);
    var yAxis = d3.axisLeft(yScale)
                  .tickFormat((d, i) => months[months.length - 1 - i])
                  .tickSize(10, 1);
    //corresponding color for temperature variances
    var corrColor = d3.scaleQuantize()
                      .domain([minTemp, maxTemp])
                      .range(colors);
    //draw heatmap axes
    svg.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${height - padding})`)
      .call(xAxis);
    svg.append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${padding}, 0)`)
      .call(yAxis);
    //draw heatmap
    svg.append("g")
      .attr("id", "heatmap")
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("x", d => 1 + xScale(d.year))
      .attr("y", d => yScale(d.month) - cellHeight)
      .attr("fill", d => corrColor(baseTemp + d.variance))
      .attr("class", "cell")
      .attr("month", d => d.month)
      .attr("year", d => d.year)
      .attr("temp", d => baseTemp + d.variance)
      .on("mouseover", d => {
        var x = d3.event.clientX;
        var y = d3.event.clientY;
        tooltip.attr("year", d.year)
               .style("left", `${x + 20}px`)                              //scaleAdjust
               .style("top", `${y - 20}px`).html(`<b>${d.year}</b> - <b>${months[d.month]}</b> <br> <b>${(d.variance + baseTemp)}°C</b> <br> <b>${d.variance > 0 ? "+" : ""}${d.variance}°C</b>`);
        tooltip.classed("hidden", false);
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true);
      });
    //legend dims
    var widthL = 300;
    var heightL = 30;
    var rectWidth = widthL / colors.length;
    var rectHeight = heightL;
    //temperature array scaled for colors
    var arr = colors.map((d, i) => {
      return (i * (maxTemp - minTemp)) / colors.length + minTemp;
    });
    //legend scale
    var scaleL = d3.scaleLinear()
                   .domain([minTemp, maxTemp])
                   .range([0, widthL]);
    //legend axis
    var scaleLAx = d3.axisBottom(scaleL)
                   .tickFormat(d3.format(".1f"))
                   .tickValues(arr);
    //legend init
    var legend = svg.append("g")
                    .attr("id", "legend")
                    .attr("transform", `translate(${padding}, ${height - heightL - 5})`);
    //legend draw
    legend.append("g")
          .selectAll("rect")
          .data(colors)
          .enter()
          .append("rect")
          .style("fill", d => d)
          .attr("x", (d, i) => i * rectWidth)
          .attr("y", 0)
          .attr("width", rectWidth)
          .attr("height", rectHeight);
    //legend axis draw
    legend.append("g")
          .attr("transform", `translate(0, ${rectHeight})`)
          .call(scaleLAx);
  });