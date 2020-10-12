'use strict';
import * as lib from "./lib.mjs"

const main = async (params) => {

	const cable = await lib.fetchData();

	let [outerContainer, plotContainer] = lib.makeContainer(params);
	let [xScale, yScale] = lib.makeScales(cable, params);
	lib.addAxes(plotContainer, xScale, yScale, params);

	const line = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))

	const grouped = Array.from(d3.group(cable, d => d.name))

	console.log(grouped)
	

	// Inspired by: https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
	const lines = plotContainer.selectAll(".line")
		.data(grouped)
		.enter()
		.append("g")
			.attr("fill", "none")
	        .attr("stroke", "firebrick")
	        .attr("stroke-width", 1)
	
	lines.append("path")
		.attr("class", "path")
      	.attr("d", d => line(d[1]))

    window.BM = new lib.BoxManager(outerContainer, plotContainer);
    lib.addButtons(BM);
    lib.addDragFunc(BM);
    

}

const params = {
	margin: 75,
	width: 600,
	height: 300
};

main(params)