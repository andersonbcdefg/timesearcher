'use strict';

// Fetch and parse cable news dataset
const fetchData = async () => {
	const parseTime = d3.timeParse("%Y-%m")
	const res = await d3.csv("top_100.csv")
	const raw_cable = res.map(entry => {
		return {
			name: entry.person,
			month: parseTime(entry.year_month),
			screen_time: Number(entry.screen_time_seconds)
		}
	});
	const cable = Array.from(d3.group(raw_cable, d => d.name)).map(person => {
		return {
			name: person[0],
			values: person[1]
		}
	})
	return [cable, raw_cable];
}

// Add buttons to manage the state of the application
const addButtons = (box_mgr) => {
	const body = d3.select("body")
	for (let state of ["CREATE", "EDIT", "DELETE"]) {
		body.append("button")
			.text(state)
			.attr("id", state.toLowerCase())
			.on("click", function() {
				box_mgr.setState(state);
				if (state === "EDIT") {
					addResize(box_mgr);
				} else {
					removeResize(box_mgr);
				}
			})
	}
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selections for outer & inner containers.
const makeContainer = (params) => {
	const outerContainer = d3.select("body")
		.append("svg")
		.attr("width", params.width + 2 * params.marginX)
		.attr("height", params.height + 2 * params.marginY)
		.attr("id", "outerContainer")

	const plotContainer = outerContainer.append("g")
		.attr('transform', `translate(${params.marginX},${params.marginY})`)
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
		.domain(d3.extent(data, d => d.screen_time * 1.1))
		.range([params.height, 0])

	return [xScale, yScale];
}

// Add X and Y axes to the plot; along with title and labels.
const addAxes = (plotContainer, xScale, yScale, params) => {
	plotContainer.append("g")
		.call(d3.axisLeft(yScale))

	plotContainer.append("g")
		.attr("transform", `translate(0, ${params.height})`)
		.call(d3.axisBottom(xScale))
	
	plotContainer.append("text")
		.attr("y", params.height + 50)
		.attr("x", params.width / 2 - 40)
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text("Date (Month)")

	plotContainer.append("text")
		.attr("transform", "rotate(-90, 40, 10)")
		.attr("y", -100)
		.attr("x", -params.height / 2)
		.attr("font-size", "0.8em")
		.attr("font-weight", "light")
		.text("Screen Time (Seconds)")

	plotContainer.append("text")
		.attr("x", 200)
		.attr("y", -35)
		.attr("font-size", "1.2em")
		.attr("font-weight", "bold")
		.text("Screen Time of Top 100 Celebrities in the 2010s")

}

const capitalize = (name) => {
	return name.split(" ").map(n => n.slice(0, 1).toUpperCase() + n.slice(1)).join(" ")
}

const highlightLabel = (e, target, xScale, yScale, params) => {
	let txt_width = d3.select(target)
		.attr("font-weight", "bold").node().getComputedTextLength();
	
	// Make the line thicker and gold, bring it to the front
	d3.select(target.parentNode)
		.raise()
		.select("path")
		.attr("stroke-width", 2.5)
		.attr("stroke", "#EEB110")
	
	// Add background to the text so it stands out
	let txt = d3.select(target.parentNode)
		.insert("rect", ".line-label")
		.attr("height", "1em")
		.attr("width", txt_width + 10)
		.attr("fill", "WhiteSmoke")
		.attr("stroke", "Silver")
		.attr("x", params.width)
		.attr("y", d => yScale(d.values.sort((a, b) => a.month - b.month).slice(-1)[0].screen_time) - 12)
		.attr("class", "label-background")
}

const unhighlightLabel = (e, target, xScale, yScale, params) => {
	d3.select(target).attr("font-weight", "normal")
		.attr("stroke", null)
		.attr("stroke-width", null)
	d3.select(target.parentNode)
		.select("path")
		.attr("stroke-width", 1.5)
		.attr("stroke", "firebrick")
	d3.select(target.parentNode)
		.select(".label-background").remove()
}

// Plot lines and label for each celebrity
// Inspired by: 
	// https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91 
	// (And the Homework 3 Observable Notebook)
const makeLines = (plotContainer, xScale, yScale, grouped_cable, params) => {
	const lineGenerator = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))


	const lines = plotContainer.append("g")
		.attr("id", "series-group")
		.selectAll(".series")
		.data(grouped_cable, d => d.name)
		.enter()
		.append("g")
		.attr("class", "series")
			
	
	lines.append("path")
		.attr("class", "line")
      	.attr("d", d => lineGenerator(d.values))
      	.attr("fill", "none")
        .attr("stroke", "firebrick")
        .attr("stroke-width", 1.5)


    lines.append("text")
    	.attr("class", "line-label")
    	.text(d => capitalize(d.name))
    	.attr("y", d => yScale(d.values[d.values.length - 1].screen_time))
    	.attr("x", params.width + 5)
    	.attr("font-size", 12)
    	.on("mouseover", function(e) {highlightLabel(e, this, xScale, yScale, params)})
    	.on("mouseout", function(e) {unhighlightLabel(e, this, xScale, yScale, params)})
}

const filterSeries = (d, filts) => {
	let values = d.values;
	for (let filt of filts) {
		let xrange = values.filter(d => {
			return (d.month >= filt.xmin && d.month <= filt.xmax);
		});
		// If filter is too narrow to capture any X data, do interpolation
		if (xrange.length == 0) {

			let xmid = new Date((filt.xmin.getTime() + filt.xmax.getTime()) / 2);
			let closest_pts = values.sort((a, b) => {
				return Math.abs(a.month - xmid) - Math.abs(b.month - xmid)
			}).slice(0, 2);
			let ymid = (closest_pts[0].screen_time + closest_pts[1].screen_time) / 2;
			if (ymid > filt.ymax || ymid < filt.ymin) return false;
		}
		let yvals = xrange.map(d => d.screen_time);
		if (Math.max(...yvals) > filt.ymax || Math.min(...yvals) < filt.ymin) return false;
	}
	return true;
}

const updateLines = (xScale, yScale, filts, params) => {
	if (filts.length == 0) {
		let series = d3.selectAll(".series")
		series.select(".line")
			.attr("stroke", "firebrick")
		series.select(".line-label")
			.attr("fill", "black")
			.on("mouseover", function(e) {highlightLabel(e, this, xScale, yScale, params)})
	    	.on("mouseout", function(e) {unhighlightLabel(e, this, xScale, yScale, params)})
	} else {
		let series = d3.selectAll(".series")
		series.select(".line")
			.attr("stroke", "grey")
		series.select(".line-label")
			.attr("fill", "rgba(180, 180, 180, 0.5)")
			.on("mouseover", null)
			.on("mouseout", null)
		
		let filtered = series.filter(d => filterSeries(d, filts))
		
		filtered.raise()
			.select(".line")
			.attr("stroke", "firebrick")

		filtered.select(".line-label")
			.attr("fill", "black")
			.on("mouseover", function(e) {highlightLabel(e, this, xScale, yScale, params)})
	    	.on("mouseout", function(e) {unhighlightLabel(e, this, xScale, yScale, params)})
	}
	
}

const addCreateHandler = (box_mgr) => {
    box_mgr.outer.call(d3.drag()
    	.subject((e) => { 
    		let m = d3.pointer(e);
    		return {x: m[0], y: m[1] }; 
    	})
    	.on("start", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.createBox(e);
    		}
    	})
    	.on("drag", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.resizeNewBox(e);
    		}
    	})
    	.on("end", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.addNewBoxListeners(e, box_mgr);
    		}
    	})
    )
}

// Select all boxes and add the resize and drag handlers.
const addResize = (box_mgr) => {
	for (let box of box_mgr.boxes) {
		let circ = box_mgr.plot.append("circle")
			.attr("class", "resize-handle");
		
		circ.attr("r", 5)
			.attr("cx", box.x1)
			.attr("cy", box.y1)
			.attr("fill", "white")
			.attr("stroke", "black")
			.style("cursor", "nwse-resize")
			.call(d3.drag()
				.on("drag", (e) => {
					box_mgr.resizeExistingBox(e, box, circ);
				})
				.on("end", (e) => {
					if (box.x0 < box.x1) [box.x0, box.x1] = [box.x1, box.x0];
					if (box.y0 < box.y1) [box.y0, box.y1] = [box.y1, box.y0];
					removeResize(box_mgr);
					addResize(box_mgr);
				})

			)

		box.rect.style("cursor", "grab")
			.call(d3.drag()
				.on("start", (e) => {
					box.rect.style("cursor", "grabbing")
				})
				.on("drag", (e) => {
					box_mgr.moveBox(e, box, circ);
				})
				.on("end", (e) => {
					box.rect.style("cursor", "grab")
				})
			);
	}
}

const removeResize = (box_mgr) => {
	try {
		box_mgr.plot.selectAll(".resize-handle").remove();
		box_mgr.plot.selectAll(".filter-box")
			.on(".drag", null)
			.style("cursor", null)
	} catch {}
}


// Class to manage all the filter boxes placed on the TimeSearcher.
// Rectangle-drawing code inspired by:
// https://bl.ocks.org/michaelwooley/b095fa7ce0e11d771dcb3f035fda1f07
class BoxManager {
	constructor(outerContainer, plotContainer, xScale, yScale, params) {
		this.outer = outerContainer;
		this.plot = plotContainer;
		this.xScale = xScale;
		this.yScale = yScale;
		this.boxes = [];
		this.params = params;
		this.state = "CREATE";
		addCreateHandler(this);
	}

	createBox(e) {
		let box = {};
		// X and Y relative to the plot container, not outer container
		box.x0 = e.x - this.params.marginX;
		box.y0 = e.y - this.params.marginY;
		box.x1 = box.x0 + 1;
		box.y1 = box.y0 + 1;
		box.rect = this.plot.append("rect")
    		.attr("class", "filter-box")
    		.attr("x", box.x0)
    		.attr("y", box.y0)
    		.attr("width", 2)
    		.attr('height', 2)
    	box.filt = {
    		xmin: this.xScale.invert(box.x0),
    		xmax: this.xScale.invert(box.x1),
    		ymin: this.yScale.invert(box.y1),
    		ymax: this.yScale.invert(box.y0)
    	}
    	this.boxes.push(box);
	}

	resizeNewBox(e) {
		let box = this.newestBox;
		box.x1 = Math.min(Math.max(e.x - this.params.marginX, 0), this.params.width);
		box.y1 = Math.min(Math.max(e.y - this.params.marginY, 0), this.params.height);
		box.rect.attr("x", Math.min(box.x0, box.x1))
			.attr("y", Math.min(box.y0, box.y1))
			.attr("width", Math.max(2, Math.abs(box.x0 - box.x1)))
			.attr("height", Math.max(2, Math.abs(box.y0 - box.y1)));
		box.filt = {
    		xmin: this.xScale.invert(Math.min(box.x0, box.x1)),
    		xmax: this.xScale.invert(Math.max(box.x0, box.x1)),
    		ymin: this.yScale.invert(Math.max(box.y0, box.y1)),
    		ymax: this.yScale.invert(Math.min(box.y0, box.y1))
    	}
    	updateLines(this.xScale, this.yScale, this.filters, this.params);
	}

	resizeExistingBox(e, box, circ) {
		box.x1 = Math.min(Math.max(e.x, 0), this.params.width);
		box.y1 = Math.min(Math.max(e.y, 0), this.params.height);
		box.rect.attr("x", Math.min(box.x0, box.x1))
			.attr("y", Math.min(box.y0, box.y1))
			.attr("width", Math.max(2, Math.abs(box.x0 - box.x1)))
			.attr("height", Math.max(2, Math.abs(box.y0 - box.y1)));
		circ.attr("cx", box.x1)
			.attr("cy", box.y1)
		box.filt = {
    		xmin: this.xScale.invert(Math.min(box.x0, box.x1)),
    		xmax: this.xScale.invert(Math.max(box.x0, box.x1)),
    		ymin: this.yScale.invert(Math.max(box.y0, box.y1)),
    		ymax: this.yScale.invert(Math.min(box.y0, box.y1))
    	}
    	updateLines(this.xScale, this.yScale, this.filters, this.params);
	}

	moveBox(e, box, circ) {
		box.x1 += e.dx;
		box.x0 += e.dx;
		box.y1 += e.dy;
		box.y0 += e.dy;
		// Don't allow box to be dragged outside the plot
		if (box.x1 < 0) {
			box.x0 -= box.x1;
			box.x1 = 0;
		}
		if (box.y1 < 0) {
			box.y0 -= box.y1;
			box.y1 = 0;
		}
		if (box.x0 > this.params.width) {
			box.x1 -= (box.x0 - this.params.width);
			box.x0 = this.params.width;
		}
		if (box.y0 > this.params.height) {
			box.y1 -= (box.y0 - this.params.height);
			box.y0 = this.params.height;
		}
		box.rect.attr("x", Math.min(box.x0, box.x1))
			.attr("y", Math.min(box.y0, box.y1))
			.attr("width", Math.max(2, Math.abs(box.x0 - box.x1)))
			.attr("height", Math.max(2, Math.abs(box.y0 - box.y1)));
		circ.attr("cx", box.x1)
			.attr("cy", box.y1)
		box.filt = {
    		xmin: this.xScale.invert(Math.min(box.x0, box.x1)),
    		xmax: this.xScale.invert(Math.max(box.x0, box.x1)),
    		ymin: this.yScale.invert(Math.max(box.y0, box.y1)),
    		ymax: this.yScale.invert(Math.min(box.y0, box.y1))
    	}
    	updateLines(this.xScale, this.yScale, this.filters, this.params);

	}

	addNewBoxListeners(e, box_mgr) {
		let box = this.newestBox;
		// Swap coordinates to make x1 and y1 the top left corner
		if (box.x0 < box.x1) [box.x0, box.x1] = [box.x1, box.x0];
		if (box.y0 < box.y1) [box.y0, box.y1] = [box.y1, box.y0];

		box.rect.on("mouseover", function () {
			if (box_mgr.state == "DELETE") {
				d3.select(this)
					.attr("class", null).attr("class", "filter-box-hovered")
			}
		})
		.on("mouseout", function () {
			d3.select(this)
			.attr("class", null).attr("class", "filter-box")
		})
		.on("click", function () {
			if (box_mgr.state == "DELETE") {
				d3.select(this).node().remove();
				box_mgr.boxes = box_mgr.boxes.filter(b => {
					return b.rect.attr("class") !== "filter-box-hovered";
				});
				updateLines(box_mgr.xScale, box_mgr.yScale, box_mgr.filters, box_mgr.params);
				if (box_mgr.boxes.length == 0) {
					box_mgr.setState("CREATE");
				}
			}
		});
	}

	setState(state) {
		this.state = state;
		d3.selectAll("button").attr("class", "null")
		d3.select(`#${state.toLowerCase()}`).attr("class", "active")
		d3.select("#message").text(state !== "DELETE" ? `Click and drag to ${state.toLowerCase()} a filter!`:"Click on a filter to delete it.");
	}

	get newestBox() {
		return this.boxes.slice(-1)[0];
	}

	get filters() {
		return this.boxes.map(b => b.filt);
	}
}

export { fetchData, addButtons, makeContainer, makeScales, 
	addAxes, BoxManager, makeLines };