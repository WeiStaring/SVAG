d3.select("#flowBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        tripStayButtonIsClicked = 0;
        volumeButtonIsClicked = 1;
        tripModeButtonIsClicked = 0;
        clearInfoUp();
        cleanInfoDown();
        addFlowLayer();
        drawArea();

    });

d3.select("#tripBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        tripStayButtonIsClicked = 1;
        volumeButtonIsClicked = 0;
        tripModeButtonIsClicked = 0;
        clearInfoUp();
        cleanInfoDown();
        addTripLayer();
        drawArea();
    });

d3.select("#modeBtn")
    .on("click", function () {
        d3.selectAll("button").classed("button-active", false);
        d3.select(this).classed("button-active", true);
        tripStayButtonIsClicked = 0;
        volumeButtonIsClicked = 0;
        tripModeButtonIsClicked = 1;
        clearInfoUp();
        cleanInfoDown();
        addModeLayer();
        d3.selectAll(".time-area").remove();
        svgTime.selectAll('g').remove();
        let personTrackNowData = personTrackData[curUser].features;

        let yScaleTemp = d3.scaleLinear()
            .domain([0, d3.max(personTrackNowData, d => d.properties.realSpeed)+2])
            .range([height-margin.bottom, margin.top]);
        let yAxisTemp = d3.axisLeft(yScaleTemp).ticks(5).tickSizeOuter(0).tickSize(2);
        svgTime.append("g")
            .attr("transform", "translate(0," + (yScale.range()[0]+10) + ")")
            .call(xAxis);
        svgTime.append("g").attr("transform", "translate(" + xScale.range()[0] + ",10)")
            .call(yAxisTemp);
    });