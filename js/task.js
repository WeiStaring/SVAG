d3.select("#oriBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        delAllLayer();
    });

d3.select("#flowBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        addFlowLayer();
    });

d3.select("#tripBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        addTripLayer();
    });

d3.select("#modeBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        addModeLayer();
    });