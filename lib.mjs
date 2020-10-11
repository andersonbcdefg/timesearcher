'use strict';

const params = {
	margin: 75,
	width: 600,
	height: 300
};

// Fetch and parse cable news dataset
const fetchData = async () => {
	const parseTime = d3.timeParse("%Y-%m")
	const raw_data = await d3.csv("top_100.csv")
	const cable = raw_data.map(entry => {
		return {
			name: entry.person,
			month: parseTime(entry.year_month),
			screen_time: Number(entry.screen_time_seconds)
		}
	});
	return cable;
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selections for outer & inner containers.
const makeContainer = (params) => {
	const outerContainer = d3.select("body")
		.append("svg")
		.attr("width", params.width + 2 * params.margin)
		.attr("height", params.height + 2 * params.margin)
		.attr("id", "outerContainer")

	const plotContainer = outerContainer.append("g")
		.attr('transform', `translate(${params.margin},${params.margin})`)
	    .attr('id', 'plotContainer');

	return [outerContainer, plotContainer]
}

// Make X and Y scales.
// RETURNS: X scale and Y scale.
const makeScales = (data, params) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, d => d.month))
		.range([0, params.width])

	const yScale = d3.scaleLinear()
		.domain(d3.extent(data, d => d.screen_time))
		.range([params.height, 0])

	return [xScale, yScale];
}

// Add X and Y axes to the plot.
// RETURNS: --
const addAxes = (plotContainer, xScale, yScale, params) => {
	plotContainer.append("g")
		.call(d3.axisLeft(yScale))

	plotContainer.append("g")
		.attr("transform", `translate(0, ${params.height})`)
		.call(d3.axisBottom(xScale))
}

/*

	

	

	

	

	const line = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))

	const grouped = Array.from(d3.group(cable, d => d.name))

	console.log(grouped)
	
	const lines = plotContainer.append("g")
			.attr("fill", "none")
	        .attr("stroke", "firebrick")
	        .attr("stroke-width", 1)
		.selectAll("path")
      	.data(grouped)
      	.join("path")
      		.attr("d", d => line(d[1]))
	lines.on("click", d => {
		console.log(this)
	})
*/

export { fetchData, makeContainer, makeScales, addAxes };