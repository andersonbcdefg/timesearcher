'use strict';
import * as lib from "/lib.mjs"

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
    
    outerContainer.on("click", (e, d) => {
    	const m = d3.pointer(e)
    	plotContainer.append("rect")
    		.attr("stroke", "steelblue")
    		.attr("fill", "rgba(70, 130, 180, 0.5)")
    		.attr("x", m[0] - params.margin)
    		.attr("y", m[1] - params.margin)
    		.attr("width", 50)
    		.attr('height', 50)
    })
}

const params = {
	margin: 75,
	width: 600,
	height: 300
};

main(params)